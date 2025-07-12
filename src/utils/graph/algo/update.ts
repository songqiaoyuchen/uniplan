import { NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isNofNode, isModuleData } from './constants';

export function applySemester(
  taken: string[],
  state: PlannerState,
  graph: NormalisedGraph,
): void {
  // Mark modules as completed
  for (const code of taken) {
    state.completedModules.add(code);
    state.availableModules.delete(code);
  }

  // Update logic nodes that might now be satisfied
  updateLogicNodes(taken, state, graph);

  // Prune alternatives for newly satisfied logic nodes
  pruneCompletedAlternatives(state, graph);

  // Unlock new modules
  unlockNewModules(state, graph);
}

function updateLogicNodes(
  taken: string[],
  state: PlannerState,
  graph: NormalisedGraph
): void {
  const logicNodesToCheck = new Set<string>();
  
  // Find logic nodes affected by taken modules
  for (const code of taken) {
    const moduleEntry = Object.entries(graph.nodes).find(
      ([_, node]) => isModuleData(node) && node.code === code
    );
    
    if (!moduleEntry) continue;
    const [moduleId] = moduleEntry;
    
    // Find logic nodes that have this module as an option
    graph.edges
      .filter(e => e.to === moduleId && isNofNode(graph.nodes[e.from]))
      .forEach(e => logicNodesToCheck.add(e.from));
  }

  // Keep updating logic nodes until no more changes (cascade satisfaction)
  let hasChanges = true;
  while (hasChanges) {
    hasChanges = false;
    
    for (const logicId of logicNodesToCheck) {
      const wasUpdated = updateSingleLogicNode(logicId, state, graph);
      if (wasUpdated) {
        hasChanges = true;
        
        // If this logic node was newly satisfied, check parent logic nodes
        graph.edges
          .filter(e => e.to === logicId && isNofNode(graph.nodes[e.from]))
          .forEach(e => logicNodesToCheck.add(e.from));
      }
    }
  }
}

function updateSingleLogicNode(
  logicId: string,
  state: PlannerState,
  graph: NormalisedGraph
): boolean {
  const logic = state.logicStatus[logicId];
  const logicNode = graph.nodes[logicId];
  if (!logic || logic.satisfied || !isNofNode(logicNode)) return false;

  // Count satisfied options
  const options = graph.edges.filter(e => e.from === logicId);
  const satisfiedCount = options.filter(edge => {
    const optionNode = graph.nodes[edge.to];
    if (isModuleData(optionNode)) {
      return state.completedModules.has(optionNode.code);
    }
    if (isNofNode(optionNode)) {
      return state.logicStatus[edge.to]?.satisfied || false;
    }
    return false;
  }).length;

  const previousSatisfied = logic.satisfied;
  logic.satisfiedCount = satisfiedCount;
  
  if (satisfiedCount >= logic.requires) {
    logic.satisfied = true;
    state.satisfiedLogicNodes.add(logicId);
  }

  // Return true if satisfaction status changed
  return !previousSatisfied && logic.satisfied;
}

function pruneCompletedAlternatives(
  state: PlannerState,
  graph: NormalisedGraph
): void {
  // Initialize prunedModules if it doesn't exist
  if (!state.prunedModules) {
    state.prunedModules = new Set<string>();
  }

  for (const logicId of state.satisfiedLogicNodes) {
    const logic = state.logicStatus[logicId];
    if (!logic || !logic.satisfied) continue;

    // Remove uncompleted alternatives from available modules
    const moduleOptions = graph.edges
      .filter(e => e.from === logicId)
      .map(e => e.to)
      .filter(id => isModuleData(graph.nodes[id]));

    for (const moduleId of moduleOptions) {
      const module = graph.nodes[moduleId] as any;
      if (!state.completedModules.has(module.code)) {
        state.availableModules.delete(module.code);
        state.prunedModules.add(module.code);
      }
    }
  }
}

function unlockNewModules(
  state: PlannerState,
  graph: NormalisedGraph
): void {
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (!isModuleData(node) || 
        state.completedModules.has(node.code) || 
        state.availableModules.has(node.code)) {
      continue;
    }

    // Don't unlock modules that were deliberately pruned
    if (state.prunedModules?.has(node.code)) {
      continue;
    }

    // Check if all prerequisites are satisfied
    const prereqs = graph.edges.filter(e => e.from === id);
    const allPrereqsSatisfied = prereqs.every(edge => {
      const prereqNode = graph.nodes[edge.to];
      if (isNofNode(prereqNode)) {
        return state.logicStatus[edge.to]?.satisfied || false;
      }
      if (isModuleData(prereqNode)) {
        return state.completedModules.has(prereqNode.code);
      }
      return true;
    });

    if (allPrereqsSatisfied) {
      state.availableModules.add(node.code);
    }
  }
}