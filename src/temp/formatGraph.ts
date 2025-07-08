/**
 * @path src/utils/graph/formatGraph.ts
 * @param raw: RawGraph
 * @returns formatted graph: FormattedGraph
 * @description formats the raw graph from neo4j into a more structured format
 */

import { RawGraph, Edge, Node, FormattedGraph } from "@/types/graphTypes";

export function formatGraph(raw: RawGraph): FormattedGraph {
  const nodes: Record<string, Node> = {};
  const edges: Edge[] = [];

  for (const node of raw.nodes) {
    if (node.labels.includes("Module")) {
      const { moduleCode, title, offeredIn, moduleCredit } = node.properties;
      nodes[node.id] = {
        id: node.id,
        type: "single",
        info: {
          id: node.id,
          code: moduleCode,
          title,
          offeredIn,
          moduleCredit,
        },
      };
    }

    if (node.labels.includes("Logic")) {
      nodes[node.id] = {
        id: node.id,
        type: "logic",
        requires: node.properties.threshold,
      };
    }
  }

  for (const rel of raw.relationships) {
    edges.push({
      id: `${rel.startNode}-${rel.endNode}`,
      from: rel.startNode,
      to: rel.endNode,
    });
  }

  return { nodes, edges };
}
