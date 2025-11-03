/**
 * Main scheduler coordinator - clean implementation from scratch.
 * Handles semester-by-semester planning with snapshot-based availability.
 */

import { NormalisedGraph, Semester, TimetableData } from '@/types/graphTypes';
import { initialise } from './initialise';
import { selectModulesForSemester} from './select';
import { calculateAvailableModules } from './update';
import { MAX_SEMESTERS } from './constants';
import { validateSchedule, generateValidationReport } from './check';
import { isModuleData, isNofNode } from './constants';

/**
 * Runs the complete scheduling algorithm.
 */
export function runScheduler(
  graph: NormalisedGraph,
  targetModules: string[] = [], // module codes
  exemptedModules: string[] = [] // module codes
): TimetableData {
  // Build a map from node id to its edges
  const edgeMap: Record<string, { out: string[]; in: string[] }> = {};

  for (const nodeId of Object.keys(graph.nodes)) {
    edgeMap[nodeId] = { out: [], in: [] };
  }

  for (const edge of graph.edges) {
    // edge.to is prerequisite for edge.from
    edgeMap[edge.from].out.push(edge.to);    // 'from' requires 'to' (prerequisite)
    edgeMap[edge.to].in.push(edge.from);     // 'to' unlocks 'from' (dependent)
  }
  
  // Convert module codes to IDs
  const codeToIdMap = new Map<string, string>();
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      codeToIdMap.set(node.code, id);
    }
  }

  // Convert target and completed modules from codes to IDs
  const targetIds = targetModules.map(code => codeToIdMap.get(code)).filter(Boolean) as string[];
  const exemptedIds = exemptedModules.map(code => codeToIdMap.get(code)).filter(Boolean) as string[];

  const missingTargets = targetModules.filter(code => !codeToIdMap.has(code));
  if (missingTargets.length > 0) {
    throw new Error(`Target modules not found in graph: ${missingTargets.join(', ')}`);
  }
    
  // Initialize planner state
  const plannerState = initialise(graph, edgeMap, exemptedIds);

  const targetSet = new Set(targetIds);
  
  const semesters: Semester[] = [];

  for (let semester = 0; semester <= MAX_SEMESTERS; semester++) {
    // Check if all targets completed
    const allTargetsPlanned = targetIds.every((id) =>
      plannerState.completedModules.has(id)
    );

    if (allTargetsPlanned) {
      console.log(`All target modules completed by semester ${semester}. Stopping planning.`);
      break;
    }
      
    // Calculate available modules snapshot for this semester
    const availableThisSemester = calculateAvailableModules(semester, plannerState, edgeMap, graph);
    
    if (availableThisSemester.size === 0) {
      console.log(`No available modules for semester ${semester}. Skipping to next.`);
      continue;
    }

    // Select modules for this semester
    const selectedModuleIds = selectModulesForSemester(
      availableThisSemester,
      plannerState,
      edgeMap,
      codeToIdMap,
      graph,
      targetSet
    );

    // Build semester data - collect all codes for this semester
    const semesterCodes: string[] = [];
    for (const moduleId of selectedModuleIds) {
      plannerState.completedModules.add(moduleId);
      const node = graph.nodes[moduleId];
      if (isModuleData(node)) {
        semesterCodes.push(node.code);
      }
    }
    
    // Only add semester if it has modules
    if (semesterCodes.length > 0) {
      semesters.push({ 
        id: semester, 
        moduleCodes: semesterCodes 
      });
    }
  }

  const timetableData: TimetableData = { semesters };

  const validation = validateSchedule(timetableData, graph, targetModules);
  const report = generateValidationReport(validation);
  console.log('Validation Report:', report);

  return timetableData;
}