/** 
 * @path src/utils/graph/normaliseNodes.ts
 * @param graph: RawGraph
 * @returns graph with normalised nodes and additional relationships: RawGraph
 * @description convert all logic nodes of type AND or OR into equivalent NOF form for easier traversal
 * - AND nodes become NOF with threshold equal to the number of outgoing edges
 * - OR nodes become NOF with threshold 1
 * - all direct module-to-module dependencies are inserted with a NOF(1) node in between
 */

import { RawGraph, RawNode, RawRelationship } from '@/types/graphTypes';
import { v4 as uuid } from 'uuid';

export function normaliseNodes(graph: RawGraph): RawGraph {
  const { nodes, relationships } = graph;

  const nodeMap: Record<string, RawNode> = {};
  for (const node of nodes) nodeMap[node.id] = node;

  const outgoingEdges: Record<string, number> = {};

  // Count outgoing edges for logic node normalization
  for (const rel of relationships) {
    outgoingEdges[rel.startNode] ??= 0;
    outgoingEdges[rel.startNode] ++;
  }

  for (const node of nodes) {
    if (node.labels.includes('Logic') && node.properties.type === 'AND') {
      const out = outgoingEdges[node.id] ?? 0;
      // debugging
      if (out <= 0) {
        console.warn(`AND node ${node.id} has no outgoing edges!!!!!!!!!!!!!!`);
      }
      node.properties.threshold = out;
      node.properties.type = 'NOF';
    } else if (node.labels.includes('Logic') && node.properties.type === 'OR') {
      node.properties.threshold = 1;
      node.properties.type = 'NOF';
    } else {
      continue;
    }
  }

  for (const rel of relationships) {
    const fromNode = nodeMap[rel.startNode];
    const toNode = nodeMap[rel.endNode];

    const fromIsModule = fromNode?.labels.includes('Module');
    const toIsModule = toNode?.labels.includes('Module');

    if (
      fromIsModule &&
      toIsModule
    ) {
      const nofId = uuid();
      nodes.push({
        id: nofId,
        labels: ['Logic'],
        properties: { type: 'NOF', threshold: 1 },
      });

      relationships.push(
        {
          id: `${rel.startNode}-${nofId}`,
          startNode: rel.startNode,
          endNode: nofId,
          type: 'HAS_PREREQ',
          properties: {},
        },
        {
          id: `${nofId}-${rel.endNode}`,
          startNode: nofId,
          endNode: rel.endNode,
          type: 'HAS_PREREQ',
          properties: {},
        }
      );

      // delete the original relationship
      relationships.splice(relationships.indexOf(rel), 1);
    } else {
      continue;
    }
  }

  return graph;
}
