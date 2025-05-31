/** 
 * @path src/utils/graph/cleanGraph.ts
 * @param graph: RawGraph,
 *        required mode codes: string[]
 * @returns cleaned graph: RawGraph
 * @description cleans the graph to include only the nodes and relationships 
 * that are required based on the provided list of module codes.
*/

import { RawGraph, RawNode, RawRelationship } from '@/types/graphTypes';
import { normaliseNodes } from './normaliseNodes';

export function cleanGraph(graph: RawGraph, requiredCodes: string[]): RawGraph {
  const nodeMap = new Map<number, RawNode>();
  const outgoingMap = new Map<number, RawRelationship[]>();
  const incomingMap = new Map<number, RawRelationship[]>();

  for (const node of graph.nodes) nodeMap.set(node.id, node);
  for (const rel of graph.relationships) {
    if (!outgoingMap.has(rel.startNode)) outgoingMap.set(rel.startNode, []);
    if (!incomingMap.has(rel.endNode)) incomingMap.set(rel.endNode, []);
    outgoingMap.get(rel.startNode)!.push(rel);
    incomingMap.get(rel.endNode)!.push(rel);
  }

  // 🔄 Normalize AND/OR to NOF
 const normalizedNodes = normaliseNodes(graph.nodes, graph.relationships);

  const requiredModuleIds = new Set<number>();
  for (const node of normalizedNodes) {
    if (node.labels.includes('Module') && requiredCodes.includes(node.properties.code)) {
      requiredModuleIds.add(node.id);
    }
  }

  const newRelationships: RawRelationship[] = [];
  const toRemoveRel = new Set<number>();
  const additionalNodes: RawNode[] = [];

  let idCounter = 1000000;
  const generateId = () => idCounter++;

  for (const node of normalizedNodes) {
    if (!node.labels.includes('Logic')) continue;

    const children = outgoingMap.get(node.id)?.map(r => r.endNode) || [];
    const requiredChildren = children.filter(id => requiredModuleIds.has(id));

    if (requiredChildren.length === 0) continue;

    const parents = incomingMap.get(node.id)?.map(r => r.startNode) || [];
    const optionalChildren = children.filter(id => !requiredModuleIds.has(id));
    const reducedN = node.properties.threshold - requiredChildren.length;

    if (reducedN <= 0 || optionalChildren.length === 0) {
      // Flatten into direct connections to required
      for (const parent of parents) {
        for (const req of requiredChildren) {
          newRelationships.push({
            id: generateId(),
            startNode: parent,
            endNode: req,
            type: 'HAS_PREREQ',
            properties: {},
          });
        }
      }
    } else {
      const newNofId = generateId();
      const andId = generateId();

      additionalNodes.push(
        {
          id: newNofId,
          labels: ['Logic'],
          properties: { type: 'NOF', threshold: reducedN },
        },
        {
          id: andId,
          labels: ['Logic'],
          properties: { type: 'NOF', threshold: requiredChildren.length },
        }
      );

      for (const child of optionalChildren) {
        newRelationships.push({
          id: generateId(),
          startNode: newNofId,
          endNode: child,
          type: 'HAS_PREREQ',
          properties: {},
        });
      }

      for (const req of requiredChildren) {
        newRelationships.push({
          id: generateId(),
          startNode: andId,
          endNode: req,
          type: 'HAS_PREREQ',
          properties: {},
        });
      }

      newRelationships.push({
        id: generateId(),
        startNode: andId,
        endNode: newNofId,
        type: 'HAS_PREREQ',
        properties: {},
      });

      for (const parent of parents) {
        newRelationships.push({
          id: generateId(),
          startNode: parent,
          endNode: andId,
          type: 'HAS_PREREQ',
          properties: {},
        });
      }
    }

    (incomingMap.get(node.id) || []).forEach(r => toRemoveRel.add(r.id));
    (outgoingMap.get(node.id) || []).forEach(r => toRemoveRel.add(r.id));
  }

  // Keep untouched relationships
  for (const rel of graph.relationships) {
    if (!toRemoveRel.has(rel.id)) newRelationships.push(rel);
  }

  const combinedNodes = [...normalizedNodes, ...additionalNodes];

  // Final reachable pruning
  return removeRedundantParts(combinedNodes, newRelationships, requiredModuleIds);
}

// helper function to remove redundant parts of the graph created while selecting required nodes
function removeRedundantParts(
  nodes: RawNode[],
  relationships: RawRelationship[],
  rootRequiredIds: Set<number>
): RawGraph {
  const adjacency = new Map<number, Array<{ node: number; edgeId: number }>>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.startNode)) adjacency.set(rel.startNode, []);
    adjacency.get(rel.startNode)!.push({ node: rel.endNode, edgeId: rel.id });
  }

  const visitedNodes = new Set<number>();
  const visitedEdges = new Set<number>();
  const stack = [...rootRequiredIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visitedNodes.has(current)) continue;
    visitedNodes.add(current);

    for (const { node, edgeId } of adjacency.get(current) ?? []) {
      visitedEdges.add(edgeId);
      if (!visitedNodes.has(node)) stack.push(node);
    }
  }

  return {
    nodes: nodes.filter(n => visitedNodes.has(n.id)),
    relationships: relationships.filter(r => visitedEdges.has(r.id)),
  };
}
