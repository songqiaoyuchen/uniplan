/** 
 * @path src/utils/graph/normalizeNodes.ts
 * @param nodes: RawNode[],
 *        relationships: RawRelationship[]
 * @returns normalizedNodes: RawNode[]
 * @description converts all Logic nodes of type AND or OR into equivalent NOF form, 
 * where:
 * - AND nodes become NOF with threshold equal to the number of outgoing edges
 * - OR nodes become NOF with threshold 1
 * This ensures the graph uses only a single type of logic gate (NOF) for simplification.
 */

import { RawNode, RawRelationship } from '@/types/graphTypes';

export function normaliseNodes(
  nodes: RawNode[],
  relationships: RawRelationship[]
): RawNode[] {
  const outgoingMap = new Map<number, number>();

  for (const rel of relationships) {
    outgoingMap.set(rel.startNode, (outgoingMap.get(rel.startNode) ?? 0) + 1);
  }

  return nodes.map(node => {
    if (!node.labels.includes('Logic')) return node;

    const out = outgoingMap.get(node.id) ?? 0;

    if (node.properties.type === 'AND') {
      return {
        ...node,
        properties: { type: 'NOF', threshold: out },
      };
    } else if (node.properties.type === 'OR') {
      return {
        ...node,
        properties: { type: 'NOF', threshold: 1 },
      };
    } else {
      return node; // already NOF
    }
  });
}