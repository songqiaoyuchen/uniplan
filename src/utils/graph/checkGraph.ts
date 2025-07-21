import { NormalisedGraph } from "@/types/graphTypes";

export function checkGraph(graph: NormalisedGraph): boolean {
  const nodeIds = new Set(Object.keys(graph.nodes));

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      console.warn(`Invalid edge: ${edge.id} - from: ${edge.from}, to: ${edge.to}`);
      return false;
    }
  }

  return true;
}
