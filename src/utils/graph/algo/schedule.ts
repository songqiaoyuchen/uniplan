
/**
 * Main scheduler coordinator - clean implementation from scratch.
 * Handles semester-by-semester planning with snapshot-based availability.
 */

import { NormalisedGraph, TimetableData } from '@/types/graphTypes';
import { initialise } from './initialise';
import { selectModulesForSemester} from './select';
import { calculateAvailableModules } from './update';
import { MAX_SEMESTERS } from './constants';
import { validateSchedule, generateValidationReport } from './check';

/**
 * Runs the complete scheduling algorithm.
 */
export function runScheduler(
  graph: NormalisedGraph,
  targetModules: string[] = [],
): TimetableData[] {
  const plannerState = initialise(graph, targetModules);
  const targetSet = new Set(targetModules);
  const plan: TimetableData[] = [];

  for (let semester = 1; semester <= MAX_SEMESTERS; semester++) {
    // Check if all targets completed
    const allTargetsPlanned = [...targetModules].every((code) =>
      plannerState.completedModules.has(code)
    );

    if (allTargetsPlanned) break;

    // Calculate available modules snapshot for this semester
    const availableThisSemester = calculateAvailableModules(plannerState, graph);
    
    if (availableThisSemester.size === 0) {
      break;
    }

    // Select modules for this semester
    const selectedModules = selectModulesForSemester(
      availableThisSemester,
      plannerState,
      graph,
      targetSet
    );

    // Add to plan
    for (const code of selectedModules) {
      plannerState.completedModules.add(code);
      plan.push({
        code,
        semester
      });
    }
  }

  const codesBySemester = plan.map(item => ({ code: item.code, semester: item.semester }));
  const validation = validateSchedule(codesBySemester, graph, Array.from(targetSet));
  const report = generateValidationReport(validation);
  console.log('Validation Report:', report);

  return plan;
}