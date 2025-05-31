import { RawNode, RawRelationship } from '@/types/graphTypes';

/**
 * Converts all Logic nodes of type AND/OR to equivalent NOF form.
 * - AND → NOF(N)
 * - OR → NOF(1)
 */
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