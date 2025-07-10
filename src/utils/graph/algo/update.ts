import { NormalisedGraph, PlannerState } from "@/types/graphTypes";
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

  // Update logic nodes and propagate changes
  const nodesToProcess = new Set<string>();
  
  // Find all nodes corresponding to taken modules
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node) && taken.includes(node.code)) {
      nodesToProcess.add(id);
    }
  }

  // Process each completed module
  for (const current of nodesToProcess) {
    nodesToProcess.delete(current);

    // Update downstream nodes
    for (const edge of graph.edges) {
      if (edge.from === current) {
        const targetNode = graph.nodes[edge.to];
        
        if (isNofNode(targetNode)) {
          updateLogicNode(edge.to, state, graph, nodesToProcess);
        } else if (isModuleData(targetNode)) {
          checkModuleAvailability(edge.to, targetNode.code, state, graph);
        }
      }
    }
  }

  // Prune unnecessary alternatives
  pruneAlternatives(state, graph);
}

function updateLogicNode(
  logicId: string,
  state: PlannerState,
  graph: NormalisedGraph,
  nodesToProcess: Set<string>
): void {
  const logic = state.logicStatus[logicId];
  if (!logic || logic.satisfied) return;

  // Count satisfied prerequisites
  const satisfiedInputs = graph.edges
    .filter(e => e.to === logicId)
    .filter(e => {
      const fromNode = graph.nodes[e.from];
      if (isModuleData(fromNode)) {
        return state.completedModules.has(fromNode.code);
      } else if (isNofNode(fromNode)) {
        return state.logicStatus[e.from]?.satisfied;
      }
      return false;
    }).length;

  logic.satisfiedCount = satisfiedInputs;
  
  if (satisfiedInputs >= logic.requires) {
    logic.satisfied = true;
    state.satisfiedLogicNodes.add(logicId);
    nodesToProcess.add(logicId);
  }
}

function checkModuleAvailability(
  moduleId: string,
  moduleCode: string,
  state: PlannerState,
  graph: NormalisedGraph
): void {
  if (state.completedModules.has(moduleCode) || state.availableModules.has(moduleCode)) {
    return;
  }

  // Check if all prerequisites are satisfied
  const allPrereqsSatisfied = graph.edges
    .filter(e => e.to === moduleId)
    .every(e => {
      const fromNode = graph.nodes[e.from];
      if (!fromNode) {
        console.warn(`Warning: Edge from non-existent node ${e.from} to ${moduleId}`);
        return true; // Treat missing nodes as satisfied
      }
      if (isNofNode(fromNode)) {
        return state.logicStatus[e.from]?.satisfied;
      } else if (isModuleData(fromNode)) {
        return state.completedModules.has(fromNode.code);
      }
      return true;
    });

  if (allPrereqsSatisfied) {
    state.availableModules.add(moduleCode);
  }
}

function pruneAlternatives(state: PlannerState, graph: NormalisedGraph): void {
  // For each satisfied N-of logic node, mark excess inputs as "pruned"
  for (const logicId of state.satisfiedLogicNodes) {
    const logic = state.logicStatus[logicId];
    if (!logic || !logic.satisfied) continue;

    const node = graph.nodes[logicId];
    if (!isNofNode(node)) continue;

    // Find satisfied and unsatisfied inputs
    const inputs = graph.edges.filter(e => e.to === logicId);
    const satisfiedInputs: string[] = [];
    const unsatisfiedInputs: string[] = [];

    for (const edge of inputs) {
      const fromNode = graph.nodes[edge.from];
      if (isModuleData(fromNode)) {
        if (state.completedModules.has(fromNode.code)) {
          satisfiedInputs.push(fromNode.code);
        } else {
          unsatisfiedInputs.push(fromNode.code);
        }
      }
    }

    // If we have enough satisfied inputs, remove unsatisfied ones from available
    if (satisfiedInputs.length >= logic.requires) {
      for (const code of unsatisfiedInputs) {
        state.availableModules.delete(code);
      }
    }
  }
}
