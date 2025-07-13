// initialise.ts
/**
 * Initializes the planner state by analyzing the graph structure.
 * Identifies initially available modules, sets up logic node tracking,
 * and establishes the starting conditions for scheduling.
 */
import { NormalisedGraph, LogicStatus, PlannerState } from '@/types/graphTypes';
import { isNofNode, isModuleData } from './constants';

//TODO: Better representation with adjacency list O(VE) -> O(V)
export function initialise(graph: NormalisedGraph, targetModules?: string[]): PlannerState {
  const availableModules = new Set<string>();
  const completedModules = new Set<string>();
  const logicStatus: Record<string, LogicStatus> = {};
  const satisfiedLogicNodes = new Set<string>();

  // Initialize all logic nodes
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isNofNode(node)) {
      const satisfied = node.n === 0;
      logicStatus[id] = { satisfied, requires: node.n, satisfiedCount: 0 };
      if (satisfied) satisfiedLogicNodes.add(id);
    }
  }

  return { availableModules, completedModules, logicStatus, satisfiedLogicNodes };
}