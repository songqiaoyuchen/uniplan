import { EdgeMap, NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isModuleData, isNofNode } from './constants';

/**
 * Calculate snapshot of modules available for a semester.
 * Only updated at semester start.
 */
export function calculateAvailableModules(
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

    if (allPrereqsSatisfied) {
      available.add(moduleId);
    }
  }

  return available;
}