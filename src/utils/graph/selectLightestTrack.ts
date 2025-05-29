/**
 * @path src/utils/graph/selectLightestTrack.ts
 * @param graph: FormattedGraph,
 * @returns graph with the least total module credit: FormattedGraph
 * @description explore all tracks in the graph and return the track with the least total module credit.
 * (a track is a graph where all logic nodes are resolved)
 */

import {
  FormattedGraph,
  ModuleNode,
  LogicNode,
  Edge,
} from '@/types/graphTypes';

export function selectLightestTrack(
  graph: FormattedGraph,
): Set<string> {
  const { moduleNodes, logicNodes, edges } = graph;

  // Helper: get node by id or code
  // Modules keyed by code, LogicNodes keyed by id
  function getNode(idOrCode: number | string): ModuleNode | LogicNode | null {
    if (typeof idOrCode === 'string') {
      return moduleNodes[idOrCode] || null;
    }
    return logicNodes[idOrCode] || null;
  }

  // Build adjacency: Map from nodeId to list of child nodeIds
  // We'll represent nodes by their id:
  // For modules, id is moduleNode.id
  // For logic nodes, id is logicNode.id
  const nodeChildren = new Map<number, number[]>();

  // Helper: get node id by code or id
  function getNodeId(node: ModuleNode | LogicNode): number {
    return node.id;
  }

  // Create reverse lookup from module code to id
  const moduleCodeToId = Object.values(modules).reduce<Record<string, number>>(
    (acc, mod) => {
      acc[mod.code] = mod.id;
      return acc;
    },
    {}
  );

  // Build nodeChildren map
  for (const edge of edges) {
    // from node id → to node id
    if (!nodeChildren.has(edge.from)) nodeChildren.set(edge.from, []);
    nodeChildren.get(edge.from)!.push(edge.to);
  }

  // Memoization cache: nodeId -> minimal prerequisite set of modules (strings)
  const memo = new Map<number, Set<string>>();

  /**
   * Recursive function to compute minimal prereqs for a node (module or logic node)
   */
  function dfs(nodeId: number): Set<string> {
    // If cached
    if (memo.has(nodeId)) return memo.get(nodeId)!;

    // Is this node a module?
    // Find module with id=nodeId
    const module = Object.values(modules).find((m) => m.id === nodeId);
    if (module) {
      // For a module node, minimal prereq set is the module itself
      const result = new Set<string>([module.code]);
      memo.set(nodeId, result);
      return result;
    }

    // Otherwise, logic node
    const logicNode = logicNodes[nodeId];
    if (!logicNode) {
      // Defensive: unknown node, return empty set
      return new Set();
    }

    // Get children of this logic node
    const children = nodeChildren.get(nodeId) || [];

    // Compute prereq sets of all children recursively
    const childPrereqs = children.map(dfs);

    let result = new Set<string>();

    switch (logicNode.type) {
      case 'AND':
        // Union of all children prereqs
        result = new Set<string>();
        for (const cset of childPrereqs) {
          for (const c of cset) result.add(c);
        }
        break;

      case 'OR':
        // Pick the minimal sized set among children prereqs
        if (childPrereqs.length === 0) {
          result = new Set();
        } else {
          let minSet = childPrereqs[0];
          for (const cset of childPrereqs) {
            if (cset.size < minSet.size) minSet = cset;
          }
          result = new Set(minSet);
        }
        break;

      case 'nOF':
        // logicNode.n = number required (assume defined)
        // Find the minimal union of any n children sets

        const n = logicNode.n ?? 0;
        if (n <= 0 || n > childPrereqs.length) {
          // Invalid n, fallback to empty
          result = new Set();
          break;
        }

        // To find minimal union of any n child sets, do combination and pick minimal union size

        // Generate all combinations of n child prereq sets
        // We'll generate combinations of indices 0..childPrereqs.length-1, size n

        function* combinations(arr: Set<string>[], k: number): Generator<Set<string>[]> {
          function* backtrack(start: number, combo: Set<string>[]): any {
            if (combo.length === k) {
              yield combo;
              return;
            }
            for (let i = start; i < arr.length; i++) {
              yield* backtrack(i + 1, [...combo, arr[i]]);
            }
          }
          yield* backtrack(0, []);
        }

        let minUnion: Set<string> | null = null;

        for (const combo of combinations(childPrereqs, n)) {
          // union all in combo
          const unionSet = new Set<string>();
          for (const s of combo) {
            for (const mod of s) unionSet.add(mod);
          }

          if (minUnion === null || unionSet.size < minUnion.size) {
            minUnion = unionSet;
          }
        }

        result = minUnion ?? new Set();
        break;
    }

    memo.set(nodeId, result);
    return result;
  }

  // Find the module node id for target module
  const targetId = moduleCodeToId[targetModuleCode];
  if (!targetId) {
    throw new Error(`Target module code '${targetModuleCode}' not found in graph`);
  }

  // Find immediate prerequisite logic or module nodes connected to the target module
  // Look for edges where from = targetId and type = HAS_PREREQ or similar
  // Actually, prereqs are usually children in the graph (target has prereqs as children?)

  // Usually prereq graph edges: target module → prerequisite node
  // So we traverse the child nodes of target module

  // Get prereq children of target module node
  const prereqChildren = nodeChildren.get(targetId);
  if (!prereqChildren || prereqChildren.length === 0) {
    // No prereqs → empty set
    return new Set();
  }

  // Compute minimal prereqs sets for all prereq children and union them
  const finalSet = new Set<string>();
  for (const childId of prereqChildren) {
    const childSet = dfs(childId);
    for (const mod of childSet) finalSet.add(mod);
  }

  return finalSet;
}
