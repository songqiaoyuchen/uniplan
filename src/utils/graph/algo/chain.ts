import { NormalisedGraph, ChainLengthInfo } from "@/types/graphTypes";
import { isModuleData, isNofNode, CHAIN_LENGTH_DECAY_FACTOR } from './constants';

export function calculateChainLengths(
  graph: NormalisedGraph,
  targetModules: Set<string>
): Map<string, ChainLengthInfo> {
  const chainInfo = new Map<string, ChainLengthInfo>();
  
  // Build adjacency lists
  const outgoing: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};
  
  for (const edge of graph.edges) {
    outgoing[edge.from] = outgoing[edge.from] || [];
    outgoing[edge.from].push(edge.to);
    incoming[edge.to] = incoming[edge.to] || [];
    incoming[edge.to].push(edge.from);
  }
  
  const maxChainToTarget = calculateMaxChainToTargets(graph, targetModules, incoming);
  const startModules = findStartModules(graph, incoming);
  const maxChainFromStart = calculateMaxChainFromStart(graph, startModules, outgoing);
  
  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      const toTarget = maxChainToTarget.get(nodeId) || 0;
      const fromStart = maxChainFromStart.get(nodeId) || 0;
      
      chainInfo.set(node.code, {
        maxChainToTarget: toTarget,
        maxChainFromStart: fromStart,
        criticalPathLength: fromStart + toTarget
      });
    }
  }
  
  return chainInfo;
}

function calculateMaxChainToTargets(
  graph: NormalisedGraph,
  targetModules: Set<string>,
  incoming: Record<string, string[]>
): Map<string, number> {
  const memo = new Map<string, number>();
  
  function dfs(nodeId: string): number {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }
    
    const node = graph.nodes[nodeId];
    
    if (isModuleData(node) && targetModules.has(node.code)) {
      memo.set(nodeId, 0);
      return 0;
    }
    
    const outgoingNodes = graph.edges
      .filter(e => e.from === nodeId)
      .map(e => e.to);
    
    if (outgoingNodes.length === 0) {
      memo.set(nodeId, Infinity);
      return Infinity;
    }
    
    let minChain = Infinity;
    for (const nextId of outgoingNodes) {
      const chainLength = dfs(nextId);
      if (chainLength !== Infinity) {
        const increment = isModuleData(graph.nodes[nodeId]) ? 1 : 0;
        minChain = Math.min(minChain, chainLength + increment);
      }
    }
    
    memo.set(nodeId, minChain);
    return minChain;
  }
  
  for (const nodeId of Object.keys(graph.nodes)) {
    dfs(nodeId);
  }
  
  return memo;
}

function calculateMaxChainFromStart(
  graph: NormalisedGraph,
  startModules: Set<string>,
  outgoing: Record<string, string[]>
): Map<string, number> {
  const distances = new Map<string, number>();
  
  for (const startId of startModules) {
    distances.set(startId, 0);
  }
  
  const sorted = topologicalSort(graph);
  
  for (const nodeId of sorted) {
    if (!distances.has(nodeId)) continue;
    
    const currentDist = distances.get(nodeId)!;
    const node = graph.nodes[nodeId];
    const increment = isModuleData(node) ? 1 : 0;
    
    const neighbors = outgoing[nodeId] || [];
    for (const neighborId of neighbors) {
      const newDist = currentDist + increment;
      const existingDist = distances.get(neighborId) || -1;
      distances.set(neighborId, Math.max(existingDist, newDist));
    }
  }
  
  return distances;
}

function findStartModules(
  graph: NormalisedGraph,
  incoming: Record<string, string[]>
): Set<string> {
  const starts = new Set<string>();
  
  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      const prerequisites = incoming[nodeId] || [];
      // A module is a start module if it has no prerequisites at all
      // (no incoming edges from modules or logic nodes)
      if (prerequisites.length === 0) {
        starts.add(nodeId);
      }
    }
  }
  
  return starts;
}

function topologicalSort(graph: NormalisedGraph): string[] {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];
  
  for (const nodeId of Object.keys(graph.nodes)) {
    inDegree.set(nodeId, 0);
  }
  
  for (const edge of graph.edges) {
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  }
  
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    for (const edge of graph.edges) {
      if (edge.from === current) {
        const newDegree = (inDegree.get(edge.to) || 0) - 1;
        inDegree.set(edge.to, newDegree);
        
        if (newDegree === 0) {
          queue.push(edge.to);
        }
      }
    }
  }
  
  return result;
}

export function computeCriticality(chainInfo: ChainLengthInfo | undefined): number {
  if (!chainInfo || chainInfo.maxChainToTarget === Infinity) {
    return 0;
  }
  
  const chainLength = chainInfo.maxChainToTarget;
  return 1.0 - Math.exp(-chainLength / CHAIN_LENGTH_DECAY_FACTOR);
}