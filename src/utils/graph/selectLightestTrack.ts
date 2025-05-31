/**
 * @path src/utils/graph/selectLightestTrack.ts
 * @param graph: FormattedGraph
 * @returns graph with the least total module credit: FormattedGraph
 * @description explore all tracks in the graph and return the track with the least total module credit.
 * (a track is a graph where all logic nodes are resolved)
 */

import {
  FormattedGraph,
  ModuleNode,
  LogicNode,
  Edge,
  Module,
  ModuleGroup,
} from '@/types/graphTypes';

/**
 * Explore all tracks in the graph and return the track (as a subgraph) with the least total module credit.
 * If a module group is encountered, resolve it to a single random module in the group.
 * Returns a FormattedGraph containing only the nodes and edges of the lightest track.
 * For OR and NOF nodes, explores all options to find the subtree with the minimum total module credit.
 */
export function selectLightestTrack(graph: FormattedGraph): FormattedGraph {
  const { moduleNodes, logicNodes, edges } = graph;

  // Build adjacency: Map from nodeId to list of child nodeIds
  const nodeChildren = new Map<number, number[]>();
  for (const edge of edges) {
    if (!nodeChildren.has(edge.from)) nodeChildren.set(edge.from, []);
    nodeChildren.get(edge.from)!.push(edge.to);
  }

  // Helper: get all root nodes (nodes that are not a child of any other node)
  const allNodeIds = new Set<number>([
    ...Object.keys(moduleNodes).map(Number),
    ...Object.keys(logicNodes).map(Number),
  ]);
  for (const edge of edges) {
    allNodeIds.delete(edge.to);
  }
  const rootNodeIds = Array.from(allNodeIds);

  // Helper: get a random module from a module group
  function pickRandomModuleFromGroup(group: ModuleGroup): Module {
    const modules = Object.values(group.list);
    if (modules.length === 0) throw new Error('Module group is empty');
    // Pick random (for deterministic, pick first)
    return modules[Math.floor(Math.random() * modules.length)];
  }

  // Helper: get module info and code for a ModuleNode
  function getModuleInfo(node: ModuleNode): Module {
    if (node.type === 'single') return node.info;
    // If group, pick a random module
    return pickRandomModuleFromGroup(node.info);
  }

  // Memoization: nodeId -> { nodeIds: Set<number>, moduleNodes: Record<number, ModuleNode>, logicNodes: Record<number, LogicNode>, edges: Edge[], totalCredit: number }
  const memo = new Map<number, { nodeIds: Set<number>; moduleNodes: Record<number, ModuleNode>; logicNodes: Record<number, LogicNode>; edges: Edge[]; totalCredit: number }>();

  // Helper: parse module credit string to number
  function parseCredit(credit: string): number {
    const n = parseFloat(credit);
    return isNaN(n) ? 0 : n;
  }

  // DFS to find the lightest track for a node
  function dfs(nodeId: number): { nodeIds: Set<number>; moduleNodes: Record<number, ModuleNode>; logicNodes: Record<number, LogicNode>; edges: Edge[]; totalCredit: number } {
    if (memo.has(nodeId)) return memo.get(nodeId)!;

    // Module node
    if (moduleNodes[nodeId]) {
      const modNode = moduleNodes[nodeId];
      let resolvedNode: ModuleNode;
      if (modNode.type === 'single') {
        resolvedNode = modNode;
      } else {
        // Replace group with a single random module as a single node
        const picked = pickRandomModuleFromGroup(modNode.info);
        resolvedNode = { type: 'single', info: picked };
      }
      const nodeIds = new Set<number>([nodeId]);
      const moduleNodesOut: Record<number, ModuleNode> = { [nodeId]: resolvedNode };
      const result = { nodeIds, moduleNodes: moduleNodesOut, logicNodes: {}, edges: [], totalCredit: parseCredit(getModuleInfo(resolvedNode).moduleCredit) };
      memo.set(nodeId, result);
      return result;
    }

    // Logic node
    const logicNode = logicNodes[nodeId];
    if (!logicNode) {
      // Defensive: unknown node
      return { nodeIds: new Set(), moduleNodes: {}, logicNodes: {}, edges: [], totalCredit: 0 };
    }
    const children = nodeChildren.get(nodeId) || [];
    const childTracks = children.map(dfs);

    let result: { nodeIds: Set<number>; moduleNodes: Record<number, ModuleNode>; logicNodes: Record<number, LogicNode>; edges: Edge[]; totalCredit: number } = { nodeIds: new Set(), moduleNodes: {}, logicNodes: {}, edges: [], totalCredit: 0 };

    switch (logicNode.type) {
      case 'AND': {
        // Union all children
        const nodeIds = new Set<number>([nodeId]);
        let totalCredit = 0;
        let moduleNodesOut: Record<number, ModuleNode> = {};
        let logicNodesOut: Record<number, LogicNode> = { [nodeId]: logicNode };
        let edgesOut: Edge[] = [];
        for (let i = 0; i < children.length; i++) {
          const track = childTracks[i];
          for (const nid of track.nodeIds) nodeIds.add(nid);
          totalCredit += track.totalCredit;
          moduleNodesOut = { ...moduleNodesOut, ...track.moduleNodes };
          logicNodesOut = { ...logicNodesOut, ...track.logicNodes };
          edgesOut = edgesOut.concat(track.edges);
          edgesOut.push({ from: nodeId, to: children[i], type: 'LOGIC' });
        }
        result = { nodeIds, moduleNodes: moduleNodesOut, logicNodes: logicNodesOut, edges: edgesOut, totalCredit };
        break;
      }
      case 'OR': {
        // Explore all options and pick the one with the minimum totalCredit
        let minTrack: typeof result | null = null;
        for (let i = 0; i < childTracks.length; i++) {
          const track = childTracks[i];
          const nodeIds = new Set<number>([nodeId, ...track.nodeIds]);
          const moduleNodesOut = { ...track.moduleNodes };
          const logicNodesOut = { [nodeId]: logicNode, ...track.logicNodes };
          const edgesOut = [...track.edges, { from: nodeId, to: children[i], type: 'LOGIC' }];
          const option = { nodeIds, moduleNodes: moduleNodesOut, logicNodes: logicNodesOut, edges: edgesOut, totalCredit: track.totalCredit };
          if (!minTrack || option.totalCredit < minTrack.totalCredit) {
            minTrack = option;
          }
        }
        result = minTrack ?? { nodeIds: new Set([nodeId]), moduleNodes: {}, logicNodes: { [nodeId]: logicNode }, edges: [], totalCredit: 0 };
        break;
      }
      case 'NOF': {
        // Explore all combinations of n children and pick the one with the minimum totalCredit
        const n = logicNode.n ?? 0;
        if (n <= 0 || n > childTracks.length) {
          result = { nodeIds: new Set([nodeId]), moduleNodes: {}, logicNodes: { [nodeId]: logicNode }, edges: [], totalCredit: 0 };
          break;
        }
        function* combinations(arr: typeof childTracks, k: number): Generator<{ tracks: typeof childTracks, idxs: number[] }> {
          function* backtrack(start: number, combo: typeof childTracks, idxs: number[]): any {
            if (combo.length === k) {
              yield { tracks: combo, idxs };
              return;
            }
            for (let i = start; i < arr.length; i++) {
              yield* backtrack(i + 1, [...combo, arr[i]], [...idxs, i]);
            }
          }
          yield* backtrack(0, [], []);
        }
        let minCombo: typeof result | null = null;
        for (const { tracks: combo, idxs } of combinations(childTracks, n)) {
          const nodeIds = new Set<number>([nodeId]);
          let totalCredit = 0;
          let moduleNodesOut: Record<number, ModuleNode> = {};
          let logicNodesOut: Record<number, LogicNode> = { [nodeId]: logicNode };
          let edgesOut: Edge[] = [];
          for (let i = 0; i < combo.length; i++) {
            const track = combo[i];
            for (const nid of track.nodeIds) nodeIds.add(nid);
            totalCredit += track.totalCredit;
            moduleNodesOut = { ...moduleNodesOut, ...track.moduleNodes };
            logicNodesOut = { ...logicNodesOut, ...track.logicNodes };
            edgesOut = edgesOut.concat(track.edges);
            edgesOut.push({ from: nodeId, to: children[idxs[i]], type: 'LOGIC' });
          }
          const option = { nodeIds, moduleNodes: moduleNodesOut, logicNodes: logicNodesOut, edges: edgesOut, totalCredit };
          if (!minCombo || option.totalCredit < minCombo.totalCredit) {
            minCombo = option;
          }
        }
        result = minCombo ?? { nodeIds: new Set([nodeId]), moduleNodes: {}, logicNodes: { [nodeId]: logicNode }, edges: [], totalCredit: 0 };
        break;
      }
    }
    memo.set(nodeId, result);
    return result;
  }

  // Explore all root nodes and pick the lightest track
  let minTrack: { nodeIds: Set<number>; moduleNodes: Record<number, ModuleNode>; logicNodes: Record<number, LogicNode>; edges: Edge[]; totalCredit: number } | null = null;
  for (const rootId of rootNodeIds) {
    const track = dfs(rootId);
    if (!minTrack || track.totalCredit < minTrack.totalCredit) {
      minTrack = track;
    }
  }
  if (!minTrack) {
    return { moduleNodes: {}, logicNodes: {}, edges: [] };
  }
  return {
    moduleNodes: minTrack.moduleNodes,
    logicNodes: minTrack.logicNodes,
    edges: minTrack.edges,
  };
}
