import { EdgeMap, NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isModuleData, isNofNode } from './constants';
import { SemesterLabel } from '@/types/plannerTypes';

/**
 * Calculate snapshot of modules available for a semester.
 * Only updated at semester start.
 */
export function calculateAvailableModules(
  currentSemester: number,
  plannerState: PlannerState,
  edgeMap: EdgeMap,
  graph: NormalisedGraph
): Set<string> {
  const available = new Set<string>();

  for (const [moduleId, node] of Object.entries(graph.nodes)) {
    if (!isModuleData(node)) continue;
    
    // Skip if already completed
    if (plannerState.completedModules.has(moduleId) || plannerState.redundantModules.has(moduleId)) continue;

    // Check if all prerequisites are satisfied before adding to available
    const prerequisites = edgeMap[moduleId]?.out || [];

    const allPrereqsSatisfied = prerequisites.every((prereqId) => {
      const prereqNode = graph.nodes[prereqId];
      if (isModuleData(prereqNode)) {
        return plannerState.completedModules.has(prereqId);
      }
      if (isNofNode(prereqNode)) {
        return plannerState.logicStatus[prereqId].satisfied;
      }
    });
    
    const actualSem = currentSemester % 2 === 0 ? SemesterLabel.First : SemesterLabel.Second;
    const isOffered = node.semestersOffered.some((sem) => sem === actualSem);

    if (allPrereqsSatisfied && isOffered) {
      available.add(moduleId);
    }
  }

  return available;
}