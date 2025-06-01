/** 
 * @path src/utils/graph/normalizeNodes.ts
 * @param nodes: RawNode[],
 *        relationships: RawRelationship[]
 * @returns normalizedNodes: RawNode[]
 * @description converts all Logic nodes of type AND or OR into equivalent NOF form, 
 * where:
 * - AND nodes become NOF with threshold equal to the number of outgoing edges
 * - OR nodes become NOF with threshold 1
 * Additionally, direct module-to-module dependencies are rewritten to insert a NOF node in between.
 * This ensures the graph uses only a single type of logic gate (NOF) for simplification.
 */

import { RawNode, RawRelationship } from '@/types/graphTypes';

let idCounter = 10000000;

export function normaliseNodes(
  nodes: RawNode[],
  relationships: RawRelationship[]
): { normalizedNodes: RawNode[]; normalizedRelationships: RawRelationship[] } {
  const outgoingMap = new Map<number, number>();
  const newRelationships: RawRelationship[] = [];
  const newNodes: RawNode[] = [];

  const nodeMap = new Map<number, RawNode>();
  for (const node of nodes) nodeMap.set(node.id, node);

  // Count outgoing edges for logic node normalization
  for (const rel of relationships) {
    outgoingMap.set(rel.startNode, (outgoingMap.get(rel.startNode) ?? 0) + 1);
  }

  for (const node of nodes) {
    if (node.labels.includes('Logic')) {
      const out = outgoingMap.get(node.id) ?? 0;

      if (node.properties.type === 'AND') {
        newNodes.push({
          ...node,
          properties: { type: 'NOF', threshold: out },
        });
      } else if (node.properties.type === 'OR') {
        newNodes.push({
          ...node,
          properties: { type: 'NOF', threshold: 1 },
        });
      } else {
        newNodes.push(node); // already NOF
      }
    } else {
      newNodes.push(node); // module
    }
  }

  for (const rel of relationships) {
    const fromNode = nodeMap.get(rel.startNode);
    const toNode = nodeMap.get(rel.endNode);

    const fromIsModule = fromNode?.labels.includes('Module');
    const toIsModule = toNode?.labels.includes('Module');

    if (
      rel.type === 'HAS_PREREQ' &&
      fromIsModule &&
      toIsModule
    ) {
      // Insert NOF node between Module → Module
      const nofId = idCounter++;

      newNodes.push({
        id: nofId,
        labels: ['Logic'],
        properties: { type: 'NOF', threshold: 1 },
      });

      newRelationships.push(
        {
          id: idCounter++,
          startNode: rel.startNode,
          endNode: nofId,
          type: 'HAS_PREREQ',
          properties: {},
        },
        {
          id: idCounter++,
          startNode: nofId,
          endNode: rel.endNode,
          type: 'HAS_PREREQ',
          properties: {},
        }
      );
    } else {
      newRelationships.push(rel); // keep original
    }
  }

  return {
    normalizedNodes: newNodes,
    normalizedRelationships: newRelationships,
  };
}
