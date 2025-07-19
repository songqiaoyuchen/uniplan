/**
 * @path src/utils/planner/checkModuleStates.ts
 * @description check the modules in timetable for issues and prerequisites
 */

import { isEqual } from 'lodash';
import {
  ModuleStatus,
  ModuleIssue,
  PrereqTree,
  ModuleData,
  SemesterLabel,
} from '@/types/plannerTypes';
import { ModuleState, Semester } from '@/store/timetableSlice';

export type StaticModuleData = Pick<
  ModuleData,
  'code' | 'requires' | 'preclusions' | 'exam' | 'semestersOffered'
>;
export interface CheckModuleStatesArgs {
  staticModulesData: Record<string, StaticModuleData>;
  semesterEntities: Record<number, Semester>;
  moduleEntities: Record<string, ModuleState>;
}
export type ModuleUpdatePayload = {
  id: string;
  changes: Pick<ModuleState, 'status' | 'issues'>;
};

export function checkModuleStates(
  args: CheckModuleStatesArgs
): ModuleUpdatePayload[] {
  const { staticModulesData, semesterEntities, moduleEntities } = args;

  // Map each planned module to its semester
  const moduleToSemester = new Map<string, number>();
  Object.values(semesterEntities).forEach(sem => {
    sem.moduleCodes.forEach(code => moduleToSemester.set(code, sem.id));
  });

  // Build conflict issues for all modules
  const conflictMap = buildIssuesMap(staticModulesData, moduleToSemester);

  // Track seen modules to evaluate prerequisites
  const modulesSeen: Record<string, ModuleStatus> = {};

  // Track computed states for comparison later
  const newStates: Record<string, { status: ModuleStatus; issues: ModuleIssue[] }> = {};

  // Process semesters in order
  const semesterIds = Object.keys(semesterEntities)
    .map(Number)
    .sort((a, b) => a - b);

  for (const semesterId of semesterIds) {
    const semester = semesterEntities[semesterId];
    if (!semester) continue;

    // Hold computed results for this semester
    const semesterResults: Record<string, { status: ModuleStatus; issues: ModuleIssue[] }> = {};

    for (const code of semester.moduleCodes) {
      const current = moduleEntities[code];
      if (!current) continue;

      const staticData = staticModulesData[code];
      let status: ModuleStatus;
      let issues: ModuleIssue[] = conflictMap.get(code) || [];

      if (current.status === ModuleStatus.Completed) {
        status = ModuleStatus.Completed;
        issues = []; // Completed clears all issues
      } else {
        // Start with any known conflict issues
        issues = conflictMap.get(code) || [];

        // Always check for prereq satisfaction
        const prereqSatisfied = !staticData?.requires || evaluatePrereqTree(
          staticData.requires,
          prereq => {
            const seen = modulesSeen[prereq];
            return seen === ModuleStatus.Completed || seen === ModuleStatus.Satisfied;
          }
        );

        if (!prereqSatisfied) {
          issues.push({ type: 'PrereqUnsatisfied' });
        }

        // Decide status
        if ((conflictMap.get(code)?.length ?? 0) > 0) {
          status = ModuleStatus.Conflicted;
        } else if (!prereqSatisfied) {
          status = ModuleStatus.Unsatisfied;
        } else {
          status = ModuleStatus.Satisfied;
        }
      }


      semesterResults[code] = { status, issues };
    }

    // After all modules in this semester are evaluated, commit them
    for (const [code, result] of Object.entries(semesterResults)) {
      newStates[code] = result;
      modulesSeen[code] = result.status;
    }
  }


  // Compare against current state and collect deltas
  const updates: ModuleUpdatePayload[] = [];
  for (const [code, current] of Object.entries(moduleEntities)) {
    if (current.status === ModuleStatus.Completed) continue;

    const { status, issues } = newStates[code] || {
      status: ModuleStatus.Satisfied,
      issues: [],
    };

    if (status !== current.status || !isEqual(current.issues, issues)) {
      updates.push({ id: code, changes: { status, issues } });
    }
  }

  return updates;
}



// --- Helper Functions ---

/**
 * @param staticModulesData: Record of moduleCode to static info
 * @param moduleToSemesterMap: Map of moduleCode to its planned semester
 * @returns examClashMap: Map of moduleCodes to an array of moduleCodes that it clashes with
 */
function buildExamClashMap(
  staticModulesData: Record<string, StaticModuleData>,
  moduleToSemesterMap: Map<string, number>
): Map<string, string[]> {

  type ExamWindow = {
    start: number;
    end: number;
    code: string;
  };

  const examsBySemester: Record<number, ExamWindow[]> = {};
  const clashMap = new Map<string, string[]>();

  // collect exam windows
  for (const code of moduleToSemesterMap.keys()) {
    const mod = staticModulesData[code];
    const semId = moduleToSemesterMap.get(code);
    if (mod?.exam && semId !== undefined) {
      const start = new Date(mod.exam.startTime).getTime();
      const end = start + mod.exam.durationMinutes * 60 * 1000;

      if (!examsBySemester[semId]) examsBySemester[semId] = [];
      examsBySemester[semId].push({ start, end, code });
    }
  }

  // detect overlaps within each semester
  for (const windows of Object.values(examsBySemester)) {
    windows.sort((a, b) => a.start - b.start);
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i];
        const b = windows[j];

        // we are allowing back-to-back exams here
        if (b.start > a.end) break; 
        if (a.start < b.end && b.start < a.end) {
          if (!clashMap.has(a.code)) clashMap.set(a.code, []);
          if (!clashMap.has(b.code)) clashMap.set(b.code, []);
          clashMap.get(a.code)!.push(b.code);
          clashMap.get(b.code)!.push(a.code);
        }
      }
    }
  }

  return clashMap;
}

/**
 * @param staticModulesData: Record of moduleCode to static info
 * @param moduleToSemesterMap: Map of moduleCode to its planned semester
 * @returns issuesMap: Map of moduleCodes to an array of ModuleIssues containing all Conflicts
 */
function buildIssuesMap(
  staticModulesData: Record<string, StaticModuleData>,
  moduleToSemesterMap: Map<string, number>,
): Map<string, ModuleIssue[]> {
  // calling helper to build ExamClash conflicts
  const examClashes = buildExamClashMap(staticModulesData, moduleToSemesterMap);
  const issuesMap = new Map<string, ModuleIssue[]>();

  for (const code of moduleToSemesterMap.keys()) {
    const mod = staticModulesData[code];
    const issues: ModuleIssue[] = [];

    const semId = moduleToSemesterMap.get(code)!;
    const actualSem = semId % 2 === 0 ? SemesterLabel.First : SemesterLabel.Second;
    if (!mod.semestersOffered.includes(actualSem)) {
      issues.push({ type: 'InvalidSemester' });
    }

    const precluded = mod.preclusions.filter(p => moduleToSemesterMap.has(p));
    if (precluded.length > 0) {
      issues.push({ type: 'Precluded', with: precluded });
    }

    const clashes = examClashes.get(code);
    if (clashes && clashes.length > 0) {
      issues.push({ type: 'ExamClash', with: clashes });
    }

    if (issues.length > 0) {
      issuesMap.set(code, issues);
    }
  }

  return issuesMap;
}

/**
 * Recursively evaluate a prerequisite tree against a satisfaction predicate
 */
function evaluatePrereqTree(
  tree: PrereqTree,
  isSatisfied: (code: string) => boolean
): boolean {
  switch (tree.type) {
    case 'module':
      return isSatisfied(tree.moduleCode);
    case 'AND':
      return tree.children.every(ch => evaluatePrereqTree(ch, isSatisfied));
    case 'OR':
      return tree.children.some(ch => evaluatePrereqTree(ch, isSatisfied));
    case 'NOF': {
      const count = tree.children.filter(ch => evaluatePrereqTree(ch, isSatisfied)).length;
      return count >= (tree.n ?? 1);
    }
    default:
      return false;
  }
}

