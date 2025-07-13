/**
 * @path src/utils/planner/checkIssues.ts
 * @description check the modules in timetable for issues
 */

import { isEqual } from 'lodash';
import {
  ModuleData,
  ModuleStatus,
  ModuleIssue,
  PrereqTree,
  SemesterLabel,
} from '@/types/plannerTypes'; 
import { ModuleState, Semester } from '@/store/timetableSlice';

export type StaticModuleDataForCheck = Pick<
  ModuleData,
  'code' | 'requires' | 'preclusions' | 'exam' | 'semestersOffered'
>;
export interface CheckIssuesArgs {
  staticModulesData: Record<string, StaticModuleDataForCheck>;
  semesterEntities: Record<number, Semester | undefined>;
  moduleEntities: Record<string, ModuleState | undefined>;
}
export type ModuleUpdatePayload = {
  id: string;
  changes: Pick<ModuleState, 'status' | 'issues'>;
};
export type CheckIssuesReturn = ModuleUpdatePayload[];


export function checkIssues(args: CheckIssuesArgs): CheckIssuesReturn {
  const { staticModulesData, semesterEntities, moduleEntities } = args;

  // BLOCK 1: INITIALIZATION & DATA PREPARATION
  // ===========================================
  // We first transform the input data into more efficient structures for quick lookups.

  // A map to quickly find which semester a module is in. e.g., { 'CS1101S': 0 }
  const moduleToSemesterMap = new Map<string, number>();
  // A set of all modules currently in the plan for fast 'has' checks.
  const plannedModuleCodes = new Set<string>();

  for (const semester of Object.values(semesterEntities)) {
    if (!semester) continue;
    for (const code of semester.moduleCodes) {
      moduleToSemesterMap.set(code, semester.id);
      plannedModuleCodes.add(code);
    }
  }
  
  // Pre-calculate exam clashes once to avoid redundant checks inside the loop.
  const examClashMap = buildExamClashMap(
    plannedModuleCodes,
    staticModulesData,
    moduleToSemesterMap,
  );

  // This will hold the calculated state for each module during our iterative process.
  // We initialize every non-completed module to the "best case" scenario.
  const newCalculatedStates: Record<string, Pick<ModuleState, 'status' | 'issues'>> = {};
  for (const code of plannedModuleCodes) {
    if (moduleEntities[code]?.status !== ModuleStatus.Completed) {
      newCalculatedStates[code] = { status: ModuleStatus.Planned, issues: [] };
    }
  }


  // BLOCK 2: ITERATIVE CALCULATION
  // ==============================
  // We loop until no more status changes occur. This resolves chained dependencies
  // (e.g., A is blocked by B, which is blocked by C). A failsafe limit prevents infinite loops.

  let changedInLastPass = true;
  let passes = 0;
  while (changedInLastPass && passes < 10) {
    changedInLastPass = false;
    passes++;

    for (const code of plannedModuleCodes) {
      // Skip completed modules entirely. They are a fixed, valid state.
      if (moduleEntities[code]?.status === ModuleStatus.Completed) continue;

      const staticData = staticModulesData[code];
      if (!staticData) continue; // Should not happen if data is consistent

      const currentState = newCalculatedStates[code];
      const allIssues: ModuleIssue[] = [];
      let newStatus: ModuleStatus = ModuleStatus.Planned;

      // STEP 2a: Check Prerequisite Issues (Highest Priority)
      const prereqIssues = checkPrerequisites(
        staticData,
        moduleToSemesterMap,
        moduleEntities, // Pass original entities to check completed status
        newCalculatedStates, // Pass the current, in-progress states for dependency checks
      );
      allIssues.push(...prereqIssues);

      if (prereqIssues.some(p => p.type === 'PrereqMissing')) {
        newStatus = ModuleStatus.Locked;
      } else if (prereqIssues.some(p => p.type === 'PrereqUnmet')) {
        newStatus = ModuleStatus.Blocked;
      }

      // STEP 2b: Check Placement Issues (Only if prerequisites are met)
      // We only care about placement conflicts if the module isn't already Locked or Blocked.
      if (newStatus === ModuleStatus.Planned) {
        const placementIssues = checkPlacementIssues(
          staticData,
          moduleToSemesterMap.get(code)!,
          plannedModuleCodes,
          examClashMap,
        );
        allIssues.push(...placementIssues);

        if (placementIssues.length > 0) {
          newStatus = ModuleStatus.Conflicted;
        }
      }

      // STEP 2c: Compare and update if changed
      // If the newly calculated status or issues differ from the previous pass,
      // we update our working state and flag that another pass is needed.
      if (newStatus !== currentState.status || !isEqual(allIssues, currentState.issues)) {
        newCalculatedStates[code] = { status: newStatus, issues: allIssues };
        changedInLastPass = true;
      }
    }
  }


  // BLOCK 3: DELTA CALCULATION
  // ==========================
  // After the states have stabilized, we compare the final calculated states
  // against the original states from Redux to generate our minimal update payload.

  const deltas: ModuleUpdatePayload[] = [];
  for (const code of plannedModuleCodes) {
    const originalState = moduleEntities[code];
    const finalState = newCalculatedStates[code];

    // We don't update completed modules or modules that don't have a final calculated state.
    if (!originalState || !finalState || originalState.status === ModuleStatus.Completed) {
      continue;
    }

    // Check if the status string or the issues array content has changed.
    const statusChanged = originalState.status !== finalState.status;
    const issuesChanged = !isEqual(originalState.issues, finalState.issues);

    if (statusChanged || issuesChanged) {
      deltas.push({
        id: code,
        changes: finalState,
      });
    }
  }

  return deltas;
}


// --- HELPER FUNCTIONS ---

// 🔧 FIX: Replace flattenPrereqTree with proper logical evaluation
// The old function treated all modules as required, ignoring AND/OR/NOF logic.
// This new approach evaluates the tree structure to determine actual requirements.

/**
 * Evaluates a prerequisite tree and returns the evaluation result.
 * @param tree - The prerequisite tree to evaluate
 * @param isModuleSatisfied - Function to check if a module requirement is satisfied
 * @returns Object containing satisfaction status and details about missing/unmet modules
 */
function evaluatePrereqTree(
  tree: PrereqTree,
  isModuleSatisfied: (moduleCode: string) => { satisfied: boolean; missing: boolean; unmet: boolean }
): {
  satisfied: boolean;
  missingModules: string[];
  unmetModules: string[];
} {
  const result = {
    satisfied: false,
    missingModules: [] as string[],
    unmetModules: [] as string[]
  };

  function evaluate(node: PrereqTree): boolean {
    if (node.type === 'module') {
      const moduleResult = isModuleSatisfied(node.moduleCode);
      if (moduleResult.missing) {
        result.missingModules.push(node.moduleCode);
      }
      if (moduleResult.unmet) {
        result.unmetModules.push(node.moduleCode);
      }
      return moduleResult.satisfied;
    }

    if (node.type === 'AND') {
      // All children must be satisfied
      return node.children.every(evaluate);
    }

    if (node.type === 'OR') {
      // At least one child must be satisfied
      // 🔧 KEY FIX: For OR nodes, we collect missing/unmet from ALL children initially,
      // but if ANY child is satisfied, we clear the collections because the OR is satisfied
      const childResults: boolean[] = [];
      const initialMissingCount = result.missingModules.length;
      const initialUnmetCount = result.unmetModules.length;
      
      for (const child of node.children) {
        const childSatisfied = evaluate(child);
        childResults.push(childSatisfied);
        
        // If any child is satisfied, the OR is satisfied
        if (childSatisfied) {
          // Remove the missing/unmet modules added by this OR evaluation
          // because the OR requirement is now satisfied
          result.missingModules.splice(initialMissingCount);
          result.unmetModules.splice(initialUnmetCount);
          return true;
        }
      }
      
      // If we reach here, no child was satisfied, so OR fails
      return false;
    }

    if (node.type === 'NOF') {
      // At least N children must be satisfied
      const satisfiedCount = node.children.filter(evaluate).length;
      const required = node.n || 1;
      
      if (satisfiedCount >= required) {
        // Similar to OR, if NOF is satisfied, we might need to adjust missing/unmet
        // This is more complex for NOF, but for now we'll keep it simple
        return true;
      }
      return false;
    }

    return false;
  }

  result.satisfied = evaluate(tree);
  
  // Remove duplicates
  result.missingModules = Array.from(new Set(result.missingModules));
  result.unmetModules = Array.from(new Set(result.unmetModules));
  
  return result;
}

/** Checks a module for prerequisite issues (Locked/Blocked). */
function checkPrerequisites(
  staticData: StaticModuleDataForCheck,
  moduleToSemesterMap: Map<string, number>,
  moduleEntities: Record<string, ModuleState | undefined>, // Added to check completed status
  currentCalculatedStates: Record<string, Pick<ModuleState, 'status' | 'issues'>>,
): ModuleIssue[] {
  if (!staticData.requires) return [];

  const issues: ModuleIssue[] = [];
  const currentModuleSemester = moduleToSemesterMap.get(staticData.code)!;
  
  // 🔧 FIX: Use logical evaluation instead of flattening
  // This function now respects AND/OR/NOF logic when checking prerequisites
  const isModuleSatisfied = (moduleCode: string) => {
    const prereqSemester = moduleToSemesterMap.get(moduleCode);
    
    if (prereqSemester === undefined) {
      // Module not in plan
      return { satisfied: false, missing: true, unmet: false };
    }
    
    if (prereqSemester >= currentModuleSemester) {
      // Module not in earlier semester
      return { satisfied: false, missing: false, unmet: true };
    }
    
    // Check if the prerequisite module is in a good state
    const originalState = moduleEntities[moduleCode];
    if (originalState?.status === ModuleStatus.Completed) {
      // Completed modules are always satisfied
      return { satisfied: true, missing: false, unmet: false };
    }
    
    const prereqState = currentCalculatedStates[moduleCode];
    if (prereqState && prereqState.status === ModuleStatus.Planned) {
      // Planned modules are satisfied
      return { satisfied: true, missing: false, unmet: false };
    }
    
    // Module is blocked/locked/conflicted, so not satisfied
    return { satisfied: false, missing: false, unmet: true };
  };

  const evalResult = evaluatePrereqTree(staticData.requires, isModuleSatisfied);
  
  // Only add issues if the overall prerequisite tree is not satisfied
  if (!evalResult.satisfied) {
    if (evalResult.missingModules.length > 0) {
      issues.push({ type: 'PrereqMissing', list: evalResult.missingModules });
    }
    if (evalResult.unmetModules.length > 0) {
      issues.push({ type: 'PrereqUnmet', list: evalResult.unmetModules });
    }
  }
  
  return issues;
}


/** Checks a module for placement issues (Conflicted). */
function checkPlacementIssues(
  staticData: StaticModuleDataForCheck,
  currentSemesterId: number,
  plannedModuleCodes: Set<string>,
  examClashMap: Map<string, string[]>,
): ModuleIssue[] {
  const issues: ModuleIssue[] = [];

  // Check 1: Invalid Semester
  // Fixed the semester calculation bug
  const actualSem = currentSemesterId % 2 === 0 ? SemesterLabel.First : SemesterLabel.Second;
  if (!staticData.semestersOffered.includes(actualSem)) {
    issues.push({ type: 'InvalidSemester' });
  }

  // Check 2: Exam Clash
  const clashes = examClashMap.get(staticData.code);
  if (clashes && clashes.length > 0) {
    issues.push({ type: 'ExamClash', with: clashes });
  }

  // Check 3: Preclusion
  const metPreclusions = staticData.preclusions.filter(p => plannedModuleCodes.has(p));
  if (metPreclusions.length > 0) {
    issues.push({ type: 'Precluded', with: metPreclusions });
  }

  return issues;
}

/** Pre-builds a map of exam clashes for efficient lookup. */
function buildExamClashMap(
  plannedModuleCodes: Set<string>,
  staticModulesData: Record<string, StaticModuleDataForCheck>,
  moduleToSemesterMap: Map<string, number>
): Map<string, string[]> {
  const examsBySemester: Record<number, Map<string, string[]>> = {};
  const clashMap = new Map<string, string[]>();

  // Collect exam times
  for (const code of plannedModuleCodes) {
    const mod = staticModulesData[code];
    const semId = moduleToSemesterMap.get(code);
    if (mod?.exam && semId !== undefined) {
      if (!examsBySemester[semId]) examsBySemester[semId] = new Map();
      const map = examsBySemester[semId];
      const time = mod.exam.startTime;
      if (!map.has(time)) map.set(time, []);
      map.get(time)!.push(code);
    }
  }

  // Detect clashes
  for (const map of Object.values(examsBySemester)) {
    for (const codes of map.values()) {
      if (codes.length > 1) {
        for (const code of codes) {
          clashMap.set(code, codes.filter(c => c !== code));
        }
      }
    }
  }
  return clashMap;
}