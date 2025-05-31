/**
 * @path src/utils/graph/augment/weightByModuleCredit.ts
 * @param graph: FormattedGraph
 * @returns graph with weights assigned based on module credits: FormattedGraph
 * @description Assign weights to nodes based on module credits.
 * For module nodes, weight is the module credit plus the weight of all child nodes.
 * For logic nodes, weight is computed based on the type of logic node:
 * - AND: sum of child weights
 * - OR: minimum of child weights
 * - NOF: sum of the top N child weights, where N is specified in the node
 * For module groups, weight is based on the first module in the group.
 * This function modifies the input graph in place, adding a `weight` property to each node.
 */

import {
  FormattedGraph,
  Module,
  ModuleGroup,
} from '@/types/graphTypes';

export function weighByModuleCredit(graph: FormattedGraph): FormattedGraph {
  const { moduleNodes, logicNodes, edges } = graph;

  // Build child relationship map: parent -> [children]
  const childMap: Record<number, number[]> = {};
  for (const edge of edges) {
    if (!childMap[edge.from]) childMap[edge.from] = [];
    childMap[edge.from].push(edge.to);
  }

  function computeWeight(nodeId: number): number {
    // MODULE NODE
    const moduleNode = moduleNodes[nodeId];
    if (moduleNode) {
      const children = childMap[nodeId] || [];
      const childrenWeight = children.reduce((sum, childId) => sum + computeWeight(childId), 0);

      if (moduleNode.type === 'single') {
        const mod: Module = moduleNode.info;
        const credit = parseFloat(mod.moduleCredit);
        const totalWeight = credit + childrenWeight;
        mod.weight = totalWeight;
        return totalWeight;

      } else if (moduleNode.type === 'group') {
        const group: ModuleGroup = moduleNode.info;
        const modules = Object.values(group.list);
        const sampled = modules[0]; // Sample the first module in the group
        const credit = parseFloat(sampled.moduleCredit);
        const totalWeight = credit + childrenWeight;
        group.weight = totalWeight;
        return totalWeight;
      }
    }

    // LOGIC NODE
    const logicNode = logicNodes[nodeId];
    const children = childMap[nodeId] || [];

    let weight = 0;

    if (logicNode.type === 'AND') {
      weight = children.reduce((sum, childId) => sum + computeWeight(childId), 0);
    } else if (logicNode.type === 'OR') {
      weight = Math.min(...children.map(childId => computeWeight(childId)));
    } else if (logicNode.type === 'NOF') {
      const n = logicNode.n ?? 1;
      const weights: number[] = [];

      for (const childId of children) {
        const child = moduleNodes[childId];
        if (child?.type === 'group') {
          // Sample `n` modules randomly from group
          const group = child.info;
          const modules = Object.values(group.list);
          for (let i = 0; i < n; i++) {
            const sampled = modules[i]; // Sample the first `n` modules in the group
            weights.push(parseFloat(sampled.moduleCredit));
          }
          // Add children of group node
          const extraWeight = (childMap[childId] || []).reduce((sum, cid) => sum + computeWeight(cid), 0);
          weights[weights.length - 1] += extraWeight;
        } else {
          weights.push(computeWeight(childId));
        }
      }

      const topN = weights.sort((a, b) => a - b).slice(0, n);
      weight = topN.reduce((a, b) => a + b, 0);
    }

    logicNode.weight = weight;
    return weight;
  }

  // Apply weight computation to all nodes
  const allNodeIds = new Set<number>([
    ...Object.keys(moduleNodes).map(Number),
    ...Object.keys(logicNodes).map(Number)
  ]);
  for (const id of allNodeIds) {
    computeWeight(id);
  }

  return graph;
}
