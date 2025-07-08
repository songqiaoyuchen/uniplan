/**
 * @path src/utils/graph/finaliseGraph.ts
 * @param graph: FormattedGraph,
 *        required mode codes: Set<string>
 * @returns finalised graph: FinalGraph
 * @description clean the graph to include only the nodes and relationships
 * that are required based on the provided list of module codes,
 * check only single nodes exists, and format the graph to FinalGraph
 */

import {
  Edge,
  FormattedGraph,
  Node,
  Module,
  FinalGraph,
} from "@/types/graphTypes";

export function finaliseGraph(
  graph: FormattedGraph,
  requiredIds: Set<string>,
): FinalGraph {
  const visited = new Set<string>();
  const adjacency: Record<string, string[]> = {};

  // Build adjacency map from edges
  for (const edge of graph.edges) {
    if (!adjacency[edge.from]) adjacency[edge.from] = [];
    adjacency[edge.from].push(edge.to);
  }

  // Perform DFS but only through single nodes
  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    const node = graph.nodes[nodeId];
    if (!node || node.type !== "single") {
      console.warn(`Node ${nodeId} is not a single node, which it should be.`);
      return;
    }

    visited.add(nodeId);

    for (const neighbor of adjacency[nodeId] || []) {
      dfs(neighbor);
    }
  }

  // Start DFS from all required IDs
  for (const id of requiredIds) {
    dfs(id);
  }

  // Rebuild pruned nodes and edges
  const prunedNodes: Record<string, Module> = {};
  const prunedEdges: Edge[] = [];

  for (const id of visited) {
    if (!graph.nodes[id] || graph.nodes[id].type !== "single") {
      console.warn(`Node ${id} is not a single node, which it should be.`);
      continue;
    }
    prunedNodes[id] = graph.nodes[id].info;
  }

  for (const edge of graph.edges) {
    if (visited.has(edge.from) && visited.has(edge.to)) {
      prunedEdges.push(edge);
    }
  }

  return {
    nodes: prunedNodes,
    edges: prunedEdges,
  };
}
