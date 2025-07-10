/**
 * @path src/utils/graph/normaliseNodes.ts
 * @param graph: FormattedGraph
 * @returns graph with normalised nodes and additional relationships: NormalisedGraph
 * @description convert all logic nodes of type AND or OR into equivalent NOF form for easier traversal
 * - AND nodes become NOF with threshold equal to the number of outgoing edges
 * - OR nodes become NOF with threshold 1
 * - all direct module-to-module dependencies are inserted with a NOF(1) node in between
 */

import { NofNode, FormattedGraph, NormalisedGraph } from "@/types/graphTypes";
import { ModuleData } from "@/types/plannerTypes";
import { v4 as uuid } from "uuid";

export function normaliseNodes(graph: FormattedGraph): NormalisedGraph {
  const { nodes, relationships } = graph;

  const outgoingEdges: Record<string, number> = {};

  // Count outgoing edges for each node
  for (const rel of relationships) {
    outgoingEdges[rel.from] ??= 0;
    outgoingEdges[rel.from]++;
  }

  // Convert AND/OR nodes into NOF equivalents
  for (const id in nodes) {
    const node = nodes[id];
    if ("type" in node) {
      if (node.type === "AND") {
        const out = outgoingEdges[id] ?? 0;
        if (out <= 0) {
          console.warn(`AND node ${id} has no outgoing edges!!!!!!!!!!!!!!`);
        }
        nodes[id] = {
          id,
          type: "NOF",
          n: out,
        };
      } else if (node.type === "OR") {
        nodes[id] = {
          id,
          type: "NOF",
          n: 1,
        };
      }
    }
  }

  // Convert module-to-module relationships into: module -> NOF -> module
  const newNodes: FormattedGraph["nodes"] = {};
  const newRelationships: FormattedGraph["relationships"] = [];

  for (const rel of relationships) {
    const fromNode = nodes[rel.from];
    const toNode = nodes[rel.to];

    const fromIsModule = !("type" in fromNode);
    const toIsModule = !("type" in toNode);

    if (fromIsModule && toIsModule) {
      const nofId = uuid();
      const nofNode: NofNode = {
        id: nofId,
        type: "NOF",
        n: 1,
      };

      newNodes[nofId] = nofNode;

      newRelationships.push(
        {
          id: uuid(),
          from: rel.from,
          to: nofId,
        },
        {
          id: uuid(),
          from: nofId,
          to: rel.to,
        },
      );
    } else {
      newRelationships.push(rel);
    }
  }

  // Add new NOF nodes to graph
  Object.assign(nodes, newNodes);

  // Replace relationships with the new list
  graph.relationships = newRelationships;

  return {
    nodes: graph.nodes as Record<string, ModuleData | NofNode>,
    edges: graph.relationships,
  };
}
