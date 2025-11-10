/**
 * @path src/utils/graph/cleanGraph.ts
 * @param graph: NormalisedGraph,
 *        required mode codes: string[]
 * @returns cleaned graph: NormalisedGraph
 * @description clean the graph to include only the nodes and relationships
 * that are required based on the provided list of module codes.
 */

import { Edge, NofNode, NormalisedGraph } from "@/types/graphTypes";
import { ModuleData } from "@/types/plannerTypes";
import { v4 as uuid } from "uuid";

export function pruneGraph(
  graph: NormalisedGraph,
  requiredCodes: string[],
): NormalisedGraph {
  const { nodes, edges } = graph;

  // map nodeId to its outgoing and incoming edges
  const outgoingEdges: Record<string, Edge[]> = {};
  const incomingEdges: Record<string, Edge[]> = {};
  for (const e of edges) {
    if (!outgoingEdges[e.from]) outgoingEdges[e.from] = [];
    if (!incomingEdges[e.to]) incomingEdges[e.to] = [];
    outgoingEdges[e.from].push(e);
    incomingEdges[e.to].push(e);
  }

  // set of module ids that are required
  const requiredModuleIds = new Set<string>();
  for (const [id, node] of Object.entries(nodes)) {
    if (!("type" in node) && requiredCodes.includes(node.code)) {
      requiredModuleIds.add(id);
    }
  }

  // called recursively on required module nodes
  function pruneOrNof(nodeId: string) {
    const inEdges = incomingEdges[nodeId] || [];

    // spread to make shallow copy as edgelist will be mutated
    for (const rel of [...inEdges]) {
      const parent = rel.from;
      const parentNode = nodes[parent];

      // skip if not a logic node
      if (!parentNode || !("type" in parentNode)) continue;

      // Only handle NOF-type nodes
      if (parentNode.type !== "NOF") continue;

      const children = outgoingEdges[parent] || [];
      const requiredChildren = children.filter((e) =>
        requiredModuleIds.has(e.to),
      );
      const requiredCount = requiredChildren.length;
      const n = parentNode.n ?? 1;

      // ========== Case 1 & 2: fully satisfied or oversatisfied ==========
      if (requiredCount >= n) {
        const inEdgesParent = incomingEdges[parent] ?? [];
        for (const inEdge of [...inEdgesParent]) {
          const p = inEdge.from;
          removeEdge(inEdge, edges, incomingEdges, outgoingEdges);
          for (const rc of requiredChildren) {
            addEdge(p, rc.to, edges, incomingEdges, outgoingEdges);
          }
        }

        // delete logic node; keep all module children intact
        deleteNodeButKeepChildrenEdges(
          parent,
          edges,
          incomingEdges,
          outgoingEdges,
          nodes,
        );

        continue;
      }

      // ========== Case 3: partially satisfied (n > requiredCount) ==========
      if (requiredCount < n && requiredCount > 0) {
        const remainingChildren = children.filter(
          (e) => !requiredModuleIds.has(e.to),
        );
        const needed = n - requiredCount;

        // create reduced NOF node
        const reducedNofId = uuid();
        nodes[reducedNofId] = {
          id: reducedNofId,
          type: "NOF",
          n: needed,
        } as NofNode;

        for (const e of remainingChildren) {
          addEdge(reducedNofId, e.to, edges, incomingEdges, outgoingEdges);
        }

        // create aggregator NOF node (acts like AND)
        const aggId = uuid();
        nodes[aggId] = {
          id: aggId,
          type: "NOF",
          n: requiredCount + 1,
        } as NofNode;

        for (const rc of requiredChildren) {
          addEdge(aggId, rc.to, edges, incomingEdges, outgoingEdges);
        }
        addEdge(aggId, reducedNofId, edges, incomingEdges, outgoingEdges);

        // redirect parents of the old NOF to the new aggregator
        const inEdgesParent = incomingEdges[parent] ?? [];
        for (const inEdge of [...inEdgesParent]) {
          const p = inEdge.from;
          removeEdge(inEdge, edges, incomingEdges, outgoingEdges);
          addEdge(p, aggId, edges, incomingEdges, outgoingEdges);
        }

        // delete old NOF; keep modules
        deleteNodeButKeepChildrenEdges(
          parent,
          edges,
          incomingEdges,
          outgoingEdges,
          nodes,
        );

        continue;
      }

      // ========== Case 4: unsatisfied (no required children yet) ==========
      // Do nothing — leave NOF node intact
    }
  }


  function hasOrNofParent(nodeId: string): boolean {
    const inEdges = incomingEdges[nodeId] || [];
    for (const rel of inEdges) {
      const parentNode = nodes[rel.from];
      if (!parentNode || !("type" in parentNode)) continue;

      if (
        parentNode.n == 1 &&
        outgoingEdges[rel.from] &&
        outgoingEdges[rel.from].length > 1
      ) {
        return true;
      } else if (
        parentNode.n > 1 &&
        outgoingEdges[rel.from] &&
        outgoingEdges[rel.from].length > parentNode.n
      ) {
        const childrenEdges = outgoingEdges[parentNode.id] || [];
        const requiredChildrenCount = childrenEdges.filter((e) =>
          requiredModuleIds.has(e.to),
        ).length;
        if (requiredChildrenCount < parentNode.n) {
          return true; // NOF not satisfied yet
        }
      }
    }
    return false;
  }

  for (const id of requiredModuleIds) {
    while (hasOrNofParent(id)) {
      pruneOrNof(id);
    }
  }

  return removeRedundantParts(nodes, edges, requiredModuleIds);
}

// ================= utils ========================
function removeRedundantParts(
  nodes: Record<string, NofNode | ModuleData>,
  relationships: Edge[],
  rootRequiredIds: Set<string>,
): NormalisedGraph {
  // build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.from)) adjacency.set(rel.from, []);
    adjacency.get(rel.from)!.push(rel.to);
  }

  // dfs from required nodes
  const visited = new Set<string>();
  const stack = [...rootRequiredIds];

  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    for (const next of adjacency.get(cur) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }

  // rebuild nodes and edges from visited set
  const keptNodes: Record<string, NofNode | ModuleData> = {};
  for (const id of visited) {
    if (nodes[id]) keptNodes[id] = nodes[id];
  }

  const keptEdges = relationships.filter(
    (e) => visited.has(e.from) && visited.has(e.to),
  );

  return {
    nodes: keptNodes,
    edges: keptEdges,
  };
}

function addEdge(
  from: string,
  to: string,
  edges: Edge[],
  incomingEdges: Record<string, Edge[]>,
  outgoingEdges: Record<string, Edge[]>,
): Edge {
  const edge: Edge = { id: uuid(), from, to };
  edges.push(edge);
  (outgoingEdges[from] ??= []).push(edge);
  (incomingEdges[to] ??= []).push(edge);
  return edge;
}

function removeEdge(
  edge: Edge,
  edges: Edge[],
  incomingEdges: Record<string, Edge[]>,
  outgoingEdges: Record<string, Edge[]>,
): void {
  // remove from global edge list
  const idx = edges.findIndex((e) => e.id === edge.id);
  if (idx >= 0) edges.splice(idx, 1);

  // remove from outgoingEdges
  const fromList = outgoingEdges[edge.from];
  if (fromList) {
    outgoingEdges[edge.from] = fromList.filter((e) => e.id !== edge.id);
    if (outgoingEdges[edge.from].length === 0) delete outgoingEdges[edge.from];
  }

  // remove from incomingEdges
  const toList = incomingEdges[edge.to];
  if (toList) {
    incomingEdges[edge.to] = toList.filter((e) => e.id !== edge.id);
    if (incomingEdges[edge.to].length === 0) delete incomingEdges[edge.to];
  }
}

function deleteNodeButKeepChildrenEdges(
  nodeId: string,
  edges: Edge[],
  incomingEdges: Record<string, Edge[]>,
  outgoingEdges: Record<string, Edge[]>,
  nodes: Record<string, NofNode | ModuleData>,
): void {
  // remove all edges into this node
  for (const e of [...(incomingEdges[nodeId] ?? [])]) {
    const outList = outgoingEdges[e.from];
    if (outList) outgoingEdges[e.from] = outList.filter((x) => x.id !== e.id);
    const idx = edges.findIndex((x) => x.id === e.id);
    if (idx >= 0) edges.splice(idx, 1);
  }

  // remove all edges out of this node (but keep the targets)
  for (const e of [...(outgoingEdges[nodeId] ?? [])]) {
    const inList = incomingEdges[e.to];
    if (inList) incomingEdges[e.to] = inList.filter((x) => x.id !== e.id);
    const idx = edges.findIndex((x) => x.id === e.id);
    if (idx >= 0) edges.splice(idx, 1);
  }

  // cleanup adjacency maps and node record
  delete incomingEdges[nodeId];
  delete outgoingEdges[nodeId];
  delete nodes[nodeId];
}
