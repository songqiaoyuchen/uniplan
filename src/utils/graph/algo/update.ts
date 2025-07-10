import { FormattedGraph, PlannerState } from "@/types/graphTypes";

export function applySemester(
  taken: string[],
  state: PlannerState,
  graph: FormattedGraph,
): void {
  for (const code of taken) {
    state.completedModules.add(code);
    state.availableModules.delete(code);

    // Update downstream logic nodes
    const modNode = Object.entries(graph.nodes).find(
      ([, n]) => n.type === "single" && n.info.code === code,
    )?.[0];

    if (!modNode) continue;

    for (const edge of graph.edges) {
      if (edge.from === modNode && graph.nodes[edge.to]?.type === "logic") {
        const logic = state.logicStatus[edge.to];
        if (logic && !logic.satisfied) {
          logic.satisfiedCount++;
          if (logic.satisfiedCount >= logic.requires) {
            logic.satisfied = true;
          }
        }
      }

      if (edge.from === modNode && graph.nodes[edge.to]?.type === "single") {
        const prereqSatisfied = checkLogicSatisfied(edge.to, state, graph);
        if (prereqSatisfied) {
          const modCode = (graph.nodes[edge.to] as any).info.code;
          state.availableModules.add(modCode);
        }
      }
    }
  }
}

function checkLogicSatisfied(
  nodeId: string,
  state: PlannerState,
  graph: FormattedGraph,
): boolean {
  const logicParents = graph.edges
    .filter((e) => e.to === nodeId && graph.nodes[e.from]?.type === "logic")
    .map((e) => e.from);

  return logicParents.every((pid) => state.logicStatus[pid]?.satisfied);
}
