// schedule.ts
/**
 * Main scheduler that coordinates the module selection process.
 * Handles the semester-by-semester scheduling loop and coordinates
 * between prioritization, selection, and state updates.
 */

import { NormalisedGraph, TimetableData } from '@/types/graphTypes';
import { initialise } from './initialise';
import { prioritizeModules, selectModulesForSemester } from './prioritise';
import { applySemester } from './update';
import { MAX_SEMESTERS } from './constants';
import { validateSchedule, generateValidationReport } from './check';

export function runScheduler(
  graph: NormalisedGraph,
  targetModules: string[] = [],
): TimetableData[] {
  console.log('\n=== Starting Scheduler ===');
  console.log('Target modules:', targetModules);

  const state = initialise(graph, targetModules);
  const targetSet = new Set(targetModules);
  const plan: TimetableData[] = [];

  for (let semester = 1; semester <= MAX_SEMESTERS; semester++) {
    // Check if all targets completed
    if (targetSet.size > 0 && Array.from(targetSet).every(t => state.completedModules.has(t))) {
      console.log(`\nAll target modules completed by semester ${semester - 1}`);
      break;
    }

    // SELECTION PHASE: Pick modules for this semester (no unlocking yet)
    const thisSemester = selectModulesForSemester(state, graph, targetSet);
    
    if (thisSemester.length === 0) {
      break;
    }

    // Add to plan
    for (const code of thisSemester) {
      plan.push({ code, semester });
    }

    // UNLOCK PHASE: Mark completed and unlock new modules
    applySemester(thisSemester, state, graph);
  }
  
  // Validation and reporting (unchanged)
  console.log('\n=== Scheduling Complete ===');
  const codesBySemester = plan.map(item => ({ code: item.code, semester: item.semester }));
  const validation = validateSchedule(codesBySemester, graph, Array.from(targetSet));
  const report = generateValidationReport(validation);
  console.log(report);

  return plan;
}