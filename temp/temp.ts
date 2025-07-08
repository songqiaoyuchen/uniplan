/** More actions
 * @path src/utils/graph/cleanGraph.ts
 * @param graph: RawGraph,
 *        required mode codes: string[]
 * @returns cleaned graph: RawGraph
 * @description cleans the graph to include only the nodes and relationships
 * that are required based on the provided list of module codes.
 */

import { RawGraph, RawNode, RawRelationship } from "@/types/graphTypes";
import { v4 as uuid } from "uuid";

export function cleanGraph(raw: RawGraph, requiredCodes: string[]): RawGraph {
  const { nodes, relationships } = raw;

  const nodeMap: Record<string, RawNode> = {};
  for (const node of nodes) nodeMap[node.id] = node;

  const outgoingEdges: Record<string, RawRelationship[]> = {};
  const incomingEdges: Record<string, RawRelationship[]> = {};
  for (const rel of relationships) {
    if (!outgoingEdges[rel.startNode]) outgoingEdges[rel.startNode] = [];
    if (!incomingEdges[rel.endNode]) incomingEdges[rel.endNode] = [];
    outgoingEdges[rel.startNode].push(rel);
    incomingEdges[rel.endNode].push(rel);
  }

  const requiredModuleIds = new Set<string>();
  for (const node of nodes) {
    if (
      node.labels.includes("Module") &&
      requiredCodes.includes(node.properties.code)
    ) {
      requiredModuleIds.add(node.id);
    }
  }

  const nodesToRemove = new Set<string>();

  function cleanOrNof(nodeId: string) {
    const inEdges = incomingEdges[nodeId] || [];
    for (const parent of inEdges.map((r) => r.startNode)) {
      if (
        nodeMap[parent].labels.includes("Logic") &&
        nodeMap[parent].properties.type === "OR"
      ) {
        // If the parent is a OR, remove all its peers that are not required
        const outEdges = outgoingEdges[parent] || [];
        for (const outEdge of outEdges) {
          if (!requiredModuleIds.has(outEdge.endNode)) {
            nodesToRemove.add(outEdge.endNode);
          }
        }
        nodesToRemove.add(parent); // Remove the OR parent itself
        incomingEdges[nodeId] = incomingEdges[nodeId].filter(
          (edge) => edge.startNode !== parent,
        );

        for (const edge of incomingEdges[parent] ?? []) {
          // redirect relationships to parent to the required module
          edge.endNode = nodeId;
        }
      }

      if (
        nodeMap[parent].labels.includes("Logic") &&
        nodeMap[parent].properties.type === "NOF"
      ) {
        // If the parent is a NOF, check if it has enough required children
        const outEdges = outgoingEdges[parent] || [];
        const requiredChildren = outEdges.filter((r) =>
          requiredModuleIds.has(r.endNode),
        );
        if (requiredChildren.length < nodeMap[parent].properties.threshold) {
          nodeMap[parent].properties.threshold -= requiredChildren.length; // reduce the threshold
          // create a new AND node
          const newAND = {
            id: uuid(),
            labels: ["Logic"],
            properties: { type: "AND" },
          };
          nodeMap[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];
          // redirect NOF parents to the new AND node
          for (const edge of incomingEdges[parent] ?? []) {
            edge.endNode = newAND.id;
          }
          // connect the new AND node to the required children
          for (const childId of requiredChildren.map((r) => r.endNode)) {
            const newANDToRequired = {
              id: uuid(),
              startNode: newAND.id,
              endNode: childId,
              type: "REQUIRES",
              properties: {},
            };
            outgoingEdges[newAND.id].push(newANDToRequired);
            incomingEdges[childId].push(newANDToRequired);
            relationships.push(newANDToRequired); // add the new relationship to the graph
          }
          // connect the new AND node to the parent NOF
          const newANDToNOF = {
            id: uuid(),
            startNode: newAND.id,
            endNode: parent,
            type: "REQUIRES",
            properties: {},
          };
          outgoingEdges[newAND.id].push(newANDToNOF);
          incomingEdges[parent].push(newANDToNOF);
          relationships.push(newANDToNOF); // add the new relationship to the graph
        } else {
          // If the NOF has enough required children, we can remove it
          nodesToRemove.add(parent); // mark NOF for removal
          for (const child of outEdges.map((r) => r.endNode)) {
            if (!requiredModuleIds.has(child)) {
              nodesToRemove.add(child); // mark non-required children for removal
            }
          }
          // create a new AND node to connect the required children
          const newAND = {
            id: uuid(),
            labels: ["Logic"],
            properties: { type: "AND" },
          };
          nodeMap[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];
          // connect the new AND node to the required children
          requiredChildren.length = nodeMap[parent].properties.threshold; // ensure we only connect the required number of children
          for (const childId of requiredChildren.map((r) => r.endNode)) {
            const newANDToRequired = {
              id: uuid(),
              startNode: newAND.id,
              endNode: childId,
              type: "REQUIRES",
              properties: {},
            };
            outgoingEdges[newAND.id].push(newANDToRequired);
            incomingEdges[childId].push(newANDToRequired);
            relationships.push(newANDToRequired); // add the new relationship to the graph
          }
          // redirect NOF parents to the new AND node
          for (const edge of incomingEdges[parent] ?? []) {
            edge.endNode = newAND.id;
          }
        }
      }
    }
  }

  function hasOrNofParent(nodeId: string): boolean {
    const inEdges = incomingEdges[nodeId] || [];
    for (const parent of inEdges.map((r) => r.startNode)) {
      if (
        nodeMap[parent].labels.includes("Logic") &&
        (nodeMap[parent].properties.type === "OR" ||
          nodeMap[parent].properties.type === "NOF")
      ) {
        return true;
      }
    }
    return false;
  }

  for (const id of requiredModuleIds) {
    // !!! node should be found
    // delete debugging code if needed
    const node = nodeMap[id];
    if (!node) console.warn(`Node with id ${id} not found in the graph.`);

    while (hasOrNofParent(id)) {
      cleanOrNof(id);
    }
  }

  return removeRedundantParts(
    nodes,
    relationships,
    requiredModuleIds,
    nodesToRemove,
  );
}

// helper function to remove redundant parts of the graph created while selecting required nodes
function removeRedundantParts(
  nodes: RawNode[],
  relationships: RawRelationship[],
  rootRequiredIds: Set<string>,
  markedNodes: Set<string>,
): RawGraph {
  const adjacency = new Map<string, Array<{ node: string; relId: string }>>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.startNode)) adjacency.set(rel.startNode, []);
    adjacency.get(rel.startNode)!.push({ node: rel.endNode, relId: rel.id });
  }

  const visitedNodes = new Set<string>();
  const visitedrelationships = new Set<string>();
  const stack = [...rootRequiredIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visitedNodes.has(current)) continue;
    visitedNodes.add(current);

    for (const { node, relId } of adjacency.get(current) ?? []) {
      visitedrelationships.add(relId);
      if (!visitedNodes.has(node)) stack.push(node);
    }
  }

  return {
    nodes: nodes.filter(
      (n) => visitedNodes.has(n.id) || !markedNodes.has(n.id),
    ),
    relationships: relationships.filter((r) => visitedrelationships.has(r.id)),
  };
}
