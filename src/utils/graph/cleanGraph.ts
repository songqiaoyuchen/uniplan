/**
 * @path src/utils/graph/cleanGraph.ts
 * @param graph: NormalisedGraph,
 *        required mode codes: string[]
 * @returns cleaned graph: NormalisedGraph
 * @description clean the graph to include only the nodes and relationships 
 * that are required based on the provided list of module codes.
*/

import { Edge, NofNode, NormalisedGraph } from '@/types/graphTypes';
import { ModuleData } from '@/types/plannerTypes';
import { v4 as uuid } from 'uuid';

export function cleanGraph(graph: NormalisedGraph, requiredCodes: string[]): NormalisedGraph {
  const { nodes, edges } = graph;

  const outgoingEdges: Record<string, Edge[]> = {};
  const incomingEdges: Record<string, Edge[]> = {};
  for (const e of edges) {
    if (!outgoingEdges[e.from]) outgoingEdges[e.from] = [];
    if (!incomingEdges[e.to]) incomingEdges[e.to] = [];
    outgoingEdges[e.from].push(e);
    incomingEdges[e.to].push(e);
  }

  const requiredModuleIds = new Set<string>();
  for (const [id, node] of Object.entries(nodes)) {
    if (!('type' in node) && requiredCodes.includes(node.code)) {
      requiredModuleIds.add(id);
    }
  }

  const nodesToRemove = new Set<string>();

  function removeNode(nodeId: string) {
    delete nodes[nodeId];
    nodesToRemove.add(nodeId);

    if (outgoingEdges[nodeId]) {
      for (const edge of outgoingEdges[nodeId]) {
        incomingEdges[edge.to] = (incomingEdges[edge.to] || []).filter(e => e.id !== edge.id);
      }
      delete outgoingEdges[nodeId];
    }

    if (incomingEdges[nodeId]) {
      for (const edge of incomingEdges[nodeId]) {
        outgoingEdges[edge.from] = (outgoingEdges[edge.from] || []).filter(e => e.id !== edge.id);
      }
      delete incomingEdges[nodeId];
    }
  }

  function cleanOrNof(nodeId: string) {
    const inEdges = incomingEdges[nodeId] || [];

    for (const rel of [...inEdges]) {
      const parent = rel.from;
      const parentNode = nodes[parent];
      if (!parentNode || !('type' in parentNode)) continue;

      if (parentNode.requires == 1 && outgoingEdges[parent] && outgoingEdges[parent].length > 1) {
        const siblings = outgoingEdges[parent] || [];
        for (const sibEdge of siblings) {
          if (!requiredModuleIds.has(sibEdge.to)) {
            removeNode(sibEdge.to);
          }
        }

        const orInEdges = incomingEdges[parent] || [];
        for (const orInEdge of orInEdges) {
          orInEdge.to = nodeId;
          incomingEdges[nodeId] = incomingEdges[nodeId] || [];
          incomingEdges[nodeId].push(orInEdge);
          incomingEdges[parent] = incomingEdges[parent].filter(e => e.id !== orInEdge.id);
        }

        removeNode(parent);
      }

      else if (parentNode.requires > 1 && outgoingEdges[parent] && outgoingEdges[parent].length > parentNode.requires) {
        const childrenEdges = outgoingEdges[parent] || [];
        const requiredChildren = childrenEdges.filter(e => requiredModuleIds.has(e.to));

        if (requiredChildren.length < parentNode.requires) {
          parentNode.requires -= requiredChildren.length;

          const newAND = {
            id: uuid(),
            type: "NOF",
            requires: parentNode.requires,
          }  as NofNode;
          nodes[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];

          const nofParents = incomingEdges[parent] || [];
          for (const nofParentRel of nofParents) {
            nofParentRel.to = newAND.id;
            incomingEdges[newAND.id].push(nofParentRel);
          }
          incomingEdges[parent] = [];

          for (const childEdge of requiredChildren) {
            const newRel = {
              id: `${newAND.id}-${childEdge.to}`,
              from: newAND.id,
              to: childEdge.to,
            };
            outgoingEdges[newAND.id].push(newRel);
            incomingEdges[childEdge.to] = incomingEdges[childEdge.to] || [];
            incomingEdges[childEdge.to].push(newRel);
            edges.push(newRel);
          }

          const andToNofRel = {
            id:  `${newAND.id}-${parent}`,
            from: newAND.id,
            to: parent,
          };
          outgoingEdges[newAND.id].push(andToNofRel);
          incomingEdges[parent].push(andToNofRel);
          edges.push(andToNofRel);
        } else {
          removeNode(parent);

          for (const childEdge of childrenEdges) {
            if (!requiredModuleIds.has(childEdge.to)) {
              removeNode(childEdge.to);
            }
          }

          const newAND = {
            id: uuid(),
            type: "NOF",
            requires: parentNode.requires,
          } as NofNode;
          nodes[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];

          const selectedChildren = requiredChildren.slice(0, parentNode.requires);
          for (const childEdge of selectedChildren) {
            const newRel = {
              id: uuid(),
              from: newAND.id,
              to: childEdge.to,
            };
            outgoingEdges[newAND.id].push(newRel);
            incomingEdges[childEdge.to] = incomingEdges[childEdge.to] || [];
            incomingEdges[childEdge.to].push(newRel);
            edges.push(newRel);
          }

          const nofParents = incomingEdges[parent] || [];
          for (const nofParentRel of nofParents) {
            nofParentRel.to = newAND.id;
            incomingEdges[newAND.id].push(nofParentRel);
          }
          incomingEdges[parent] = [];
        }
      }
    }
  }

  function hasOrNofParent(nodeId: string): boolean {
    const inEdges = incomingEdges[nodeId] || [];
    for (const rel of inEdges) {
      const parentNode = nodes[rel.from];
      if (!parentNode || !('type' in parentNode)) continue;

      if (parentNode.requires == 1 && outgoingEdges[rel.from] && outgoingEdges[rel.from].length > 1) {
        return true;
      }
      else if (parentNode.requires > 1 && outgoingEdges[rel.from] && outgoingEdges[rel.from].length > parentNode.requires) {
        const childrenEdges = outgoingEdges[parentNode.id] || [];
        const requiredChildrenCount = childrenEdges.filter(e => requiredModuleIds.has(e.to)).length;
        if (requiredChildrenCount < parentNode.requires) {
          return true; // NOF not satisfied yet
        }
      }
    }
    return false;
  }

  for (const id of requiredModuleIds) {
    while (hasOrNofParent(id)) {
      cleanOrNof(id);
    }
  }

  return removeRedundantParts(nodes, edges, requiredModuleIds, nodesToRemove);
}

function removeRedundantParts(
  nodes: Record<string, NofNode | ModuleData>,
  relationships: Edge[],
  rootRequiredIds: Set<string>,
  markedNodes: Set<string>
): NormalisedGraph {
  const adjacency = new Map<string, Array<{ node: string; relId: string }>>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.from)) adjacency.set(rel.from, []);
    adjacency.get(rel.from)!.push({ node: rel.to, relId: rel.id });
  }

  const visitedNodes = new Set<string>();
  const visitedRelationships = new Set<string>();
  const stack = [...rootRequiredIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visitedNodes.has(current)) continue;
    visitedNodes.add(current);

    for (const { node, relId } of adjacency.get(current) ?? []) {
      visitedRelationships.add(relId);
      if (!visitedNodes.has(node)) stack.push(node);
    }
  }

  // Rebuild filtered nodes object
  const filteredNodes: Record<string, NofNode | ModuleData> = {};
  for (const id of visitedNodes) {
    if (!markedNodes.has(id) && nodes[id]) {
      filteredNodes[id] = nodes[id];
    }
  }

  const filteredEdges = relationships.filter(r => visitedRelationships.has(r.id));

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

