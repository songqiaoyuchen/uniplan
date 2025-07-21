/**
 * Initializes the planner state by analyzing the graph structure.
 * Identifies initially available modules, sets up logic node tracking,
 * and establishes the starting conditions for scheduling.
 */
import { NormalisedGraph, LogicStatus, PlannerState, EdgeMap } from '@/types/graphTypes';
import { isNofNode } from './constants';

export function initialise(
  graph: NormalisedGraph,
  edgeMap: EdgeMap,
  exemptedIds: string[]
): PlannerState {
  const availableModules = new Set<string>();
  const completedModules = new Set<string>();
  const redundantModules = new Set<string>(exemptedIds);

  // Satisfaction status of logic nodes
  const logicStatus: Record<string, LogicStatus> = {};
  const satisfiedLogicNodes = new Set<string>();

  // Initialize all logic nodes
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isNofNode(node)) {
      const satisfied = node.n === 0;
      const prereqIds = edgeMap[id].out || [];
      const count = prereqIds.filter(prereqId => completedModules.has(prereqId)).length;
      logicStatus[id] = { satisfied, requires: node.n, satisfiedCount: count };
      if (satisfied) satisfiedLogicNodes.add(id);
    }
  }

  return { availableModules, completedModules, redundantModules, logicStatus, satisfiedLogicNodes };
}