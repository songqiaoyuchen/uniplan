/**
 * @path src/utils/graph/selectRandom.ts
 * @param graph: FormattedGraph, requiredModuleCodes: string[]
 * @returns finalised graph with logic nodes resolved by randomness: FinalGraph
 * @description resolve all logic nodes by randomly selecting among sibling nodes
 */

import { Edge, FinalGraph, FormattedGraph } from '@/types/graphTypes';
import { finaliseGraph } from './finaliseGraph';

export function selectRandom(graph: FormattedGraph, requiredCodes: string[]): FinalGraph {
  const { nodes, edges } = graph;

  const outgoingMap: Record<string, Edge[]> = {};
  for (const edge of edges) {
    if (!outgoingMap[edge.from]) outgoingMap[edge.from] = [];
    outgoingMap[edge.from].push(edge);
  }

  const requiredModuleIds = new Set<string>();
  for (const node of Object.values(nodes)) {
    if (node.type === 'single' && requiredCodes.includes(node.info.code)) {
      requiredModuleIds.add(node.id);
    }
  }

  const edgesToRemove = new Set<string>();

  function resolveChildren(nodeId: string) {
    const node = nodes[nodeId];

    if (node.type === 'logic' || node.type === 'group') {
      console.warn(`Node ${nodeId} is a logic or group node, shouldn't call resolveChildren on it directly.`);
      return;
    }

    const outEdges = outgoingMap[nodeId] || [];
    for (const outEdge of outEdges) {
      const childId = outEdge.to;
      const childNode = nodes[childId];

      if (childNode.type === 'logic') {
        const logicChildren = outgoingMap[childId] ?? [];
        if (logicChildren.length === 0) continue;

        const selected: Edge[] = [];
        const available = [...logicChildren];

        while (selected.length < childNode.requires && available.length > 0) {
          const idx = Math.floor(Math.random() * available.length);
          selected.push(available.splice(idx, 1)[0]);
        }

        // Remove the edge from node to logic node
        outgoingMap[nodeId] = outgoingMap[nodeId].filter(e => e.to !== childId);
        edgesToRemove.add(`${nodeId}-${childId}`);

        // Add new edges from node to selected logic children
        for (const edge of selected) {
          const newEdge = {
            id: `${nodeId}-${edge.to}`,
            from: nodeId,
            to: edge.to
          };
          outgoingMap[nodeId].push(newEdge);
          edges.push(newEdge);
        }
      }
    }

    const hasLogicChildren = () =>
      (outgoingMap[nodeId] || []).some(edge => nodes[edge.to].type === 'logic');

    while (hasLogicChildren()) {
      resolveChildren(nodeId); // keep resolving until all logic children gone
    }

    for (const edge of outgoingMap[nodeId] || []) {
      resolveChildren(edge.to); // recurse into resolved children
    }
  }

  for (const id of requiredModuleIds) {
    resolveChildren(id);
  }

  const remainingEdges = edges.filter(e => !edgesToRemove.has(`${e.from}-${e.to}`));
  return finaliseGraph({ nodes: graph.nodes, edges: remainingEdges }, requiredModuleIds);
}
