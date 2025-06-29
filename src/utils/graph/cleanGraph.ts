/**
 * @path src/utils/graph/cleanGraph.ts
 * @param graph: RawGraph,
 *        required mode codes: string[]
 * @returns cleaned graph: RawGraph
 * @description clean the graph to include only the nodes and relationships 
 * that are required based on the provided list of module codes.
*/

import { RawGraph, RawNode, RawRelationship } from '@/types/graphTypes';
import { v4 as uuid } from 'uuid';

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
    if (node.labels.includes('Module') && requiredCodes.includes(node.properties.moduleCode)) {
      requiredModuleIds.add(node.id);
    }
  }

  const nodesToRemove = new Set<string>();

  function removeNode(nodeId: string) {
    delete nodeMap[nodeId];
    nodesToRemove.add(nodeId);

    if (outgoingEdges[nodeId]) {
      for (const edge of outgoingEdges[nodeId]) {
        incomingEdges[edge.endNode] = (incomingEdges[edge.endNode] || []).filter(e => e.id !== edge.id);
      }
      delete outgoingEdges[nodeId];
    }

    if (incomingEdges[nodeId]) {
      for (const edge of incomingEdges[nodeId]) {
        outgoingEdges[edge.startNode] = (outgoingEdges[edge.startNode] || []).filter(e => e.id !== edge.id);
      }
      delete incomingEdges[nodeId];
    }
  }

  function cleanOrNof(nodeId: string) {
    const inEdges = incomingEdges[nodeId] || [];

    for (const rel of [...inEdges]) {
      const parent = rel.startNode;
      const parentNode = nodeMap[parent];
      if (!parentNode || !parentNode.labels.includes('Logic')) continue;

      if (parentNode.properties.type === 'OR') {
        const siblings = outgoingEdges[parent] || [];
        for (const sibEdge of siblings) {
          if (!requiredModuleIds.has(sibEdge.endNode)) {
            removeNode(sibEdge.endNode);
          }
        }

        const orInEdges = incomingEdges[parent] || [];
        for (const orInEdge of orInEdges) {
          orInEdge.endNode = nodeId;
          incomingEdges[nodeId] = incomingEdges[nodeId] || [];
          incomingEdges[nodeId].push(orInEdge);
          incomingEdges[parent] = incomingEdges[parent].filter(e => e.id !== orInEdge.id);
        }

        removeNode(parent);
      }

      else if (parentNode.properties.type === 'NOF') {
        const childrenEdges = outgoingEdges[parent] || [];
        const requiredChildren = childrenEdges.filter(e => requiredModuleIds.has(e.endNode));

        if (requiredChildren.length < parentNode.properties.threshold) {
          parentNode.properties.threshold -= requiredChildren.length;

          const newAND = {
            id: uuid(),
            labels: ['Logic'],
            properties: { type: 'AND' },
          };
          nodeMap[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];

          const nofParents = incomingEdges[parent] || [];
          for (const nofParentRel of nofParents) {
            nofParentRel.endNode = newAND.id;
            incomingEdges[newAND.id].push(nofParentRel);
          }
          incomingEdges[parent] = [];

          for (const childEdge of requiredChildren) {
            const newRel = {
              id: `${newAND.id}-${childEdge.endNode}`,
              startNode: newAND.id,
              endNode: childEdge.endNode,
              type: 'REQUIRES',
              properties: {},
            };
            outgoingEdges[newAND.id].push(newRel);
            incomingEdges[childEdge.endNode] = incomingEdges[childEdge.endNode] || [];
            incomingEdges[childEdge.endNode].push(newRel);
            relationships.push(newRel);
          }

          const andToNofRel = {
            id:  `${newAND.id}-${parent}`,
            startNode: newAND.id,
            endNode: parent,
            type: 'REQUIRES',
            properties: {},
          };
          outgoingEdges[newAND.id].push(andToNofRel);
          incomingEdges[parent].push(andToNofRel);
          relationships.push(andToNofRel);
        } else {
          removeNode(parent);

          for (const childEdge of childrenEdges) {
            if (!requiredModuleIds.has(childEdge.endNode)) {
              removeNode(childEdge.endNode);
            }
          }

          const newAND = {
            id: uuid(),
            labels: ['Logic'],
            properties: { type: 'AND' },
          };
          nodeMap[newAND.id] = newAND;
          incomingEdges[newAND.id] = [];
          outgoingEdges[newAND.id] = [];

          const selectedChildren = requiredChildren.slice(0, parentNode.properties.threshold);
          for (const childEdge of selectedChildren) {
            const newRel = {
              id: `${newAND.id}-${childEdge.endNode}`,
              startNode: newAND.id,
              endNode: childEdge.endNode,
              type: 'REQUIRES',
              properties: {},
            };
            outgoingEdges[newAND.id].push(newRel);
            incomingEdges[childEdge.endNode] = incomingEdges[childEdge.endNode] || [];
            incomingEdges[childEdge.endNode].push(newRel);
            relationships.push(newRel);
          }

          const nofParents = incomingEdges[parent] || [];
          for (const nofParentRel of nofParents) {
            nofParentRel.endNode = newAND.id;
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
      const parentNode = nodeMap[rel.startNode];
      if (!parentNode || !parentNode.labels.includes('Logic')) continue;

      const type = parentNode.properties.type;
      if (type === 'OR') {
        return true;
      }
      else if (type === 'NOF') {
        const childrenEdges = outgoingEdges[parentNode.id] || [];
        const requiredChildrenCount = childrenEdges.filter(e => requiredModuleIds.has(e.endNode)).length;
        if (requiredChildrenCount < parentNode.properties.threshold) {
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

  return removeRedundantParts(nodes, relationships, requiredModuleIds, nodesToRemove);
}

function removeRedundantParts(
  nodes: RawNode[],
  relationships: RawRelationship[],
  rootRequiredIds: Set<string>,
  markedNodes: Set<string>
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
    nodes: nodes.filter(n => visitedNodes.has(n.id) && !markedNodes.has(n.id)),
    relationships: relationships.filter(r => visitedrelationships.has(r.id))
  }
}
