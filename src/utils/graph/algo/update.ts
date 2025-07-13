import { NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isModuleData, isNofNode } from './constants';

/**
 * Calculate snapshot of modules available for a semester.
 * Only called at semester start.
 */
export function calculateAvailableModules(
  plannerState: PlannerState, 
  graph: NormalisedGraph
): Set<string> {
  const available = new Set<string>();

  for (const [moduleId, node] of Object.entries(graph.nodes)) {
    if (!isModuleData(node)) continue;
    
    // Skip if already completed
    if (plannerState.completedModules.has(node.code)) continue;

    // Check if all prerequisites are satisfied
    const prerequisites = graph.edges.filter(e => e.from === moduleId);
    
    const allPrereqsSatisfied = prerequisites.every(edge => {
      const prereqNode = graph.nodes[edge.to];
      
      if (isModuleData(prereqNode)) {
        return plannerState.completedModules.has(prereqNode.code);
      }
      
      if (isNofNode(prereqNode)) {
        return plannerState.logicStatus[edge.to]?.satisfied || false;
      }
      
      return true;
    });

    if (allPrereqsSatisfied) {
      available.add(node.code);
    }
  }

  return available;
}