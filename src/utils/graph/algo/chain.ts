// chain.ts
/**
 * Critical path analysis for module dependencies.
 * Calculates chain lengths to identify modules on critical paths,
 * helping prioritize modules that are bottlenecks for reaching targets.
 */
import { NormalisedGraph, ChainLengthInfo } from "@/types/graphTypes";
import { isModuleData, CHAIN_LENGTH_DECAY_FACTOR } from './constants';

export function calculateChainLengths(
  graph: NormalisedGraph,
  targetModules: Set<string>
): Map<string, ChainLengthInfo> {
  const chainInfo = new Map<string, ChainLengthInfo>();
  
  // Build adjacency lists - edges represent prerequisites
  const prerequisites: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};
  
  for (const edge of graph.edges) {
    if (!prerequisites[edge.from]) prerequisites[edge.from] = [];
    prerequisites[edge.from].push(edge.to);
    
    if (!dependents[edge.to]) dependents[edge.to] = [];
    dependents[edge.to].push(edge.from);
  }
  
  const maxChainToTarget = calculateMaxChainToTargets(graph, targetModules, dependents);
  const startModules = findStartModules(graph, prerequisites);
  const maxChainFromStart = calculateMaxChainFromStart(graph, startModules, dependents);
  
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
  dependents: Record<string, string[]>
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
    
    // Check nodes that depend on this one
    const dependentNodes = dependents[nodeId] || [];
    
    if (dependentNodes.length === 0) {
      memo.set(nodeId, Infinity);
      return Infinity;
    }
    
    let minChain = Infinity;
    for (const nextId of dependentNodes) {
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
  dependents: Record<string, string[]>
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
    
    // Update distances to dependents
    const neighbors = dependents[nodeId] || [];
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
  prerequisites: Record<string, string[]>
): Set<string> {
  const starts = new Set<string>();
  
  for (const [nodeId, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      // A module is a start if it has no prerequisites
      const modulePrereqs = prerequisites[nodeId] || [];
      if (modulePrereqs.length === 0) {
        starts.add(nodeId);
      }
    }
  }
  
  return starts;
}

function topologicalSort(graph: NormalisedGraph): string[] {
  const prereqCount = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  // Initialize in-degrees
  for (const nodeId of Object.keys(graph.nodes)) {
    prereqCount.set(nodeId, 0);
  }

  // Count incoming edges
  for (const edge of graph.edges) {
    prereqCount.set(edge.to, (prereqCount.get(edge.to) || 0) + 1);
  }

  // Start with nodes that have no incoming edges
  for (const [nodeId, count] of prereqCount) {
    if (count === 0) queue.push(nodeId);
  }

  // Topological sort
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const edge of graph.edges) {
      if (edge.from === current) {
        const newCount = (prereqCount.get(edge.to) || 0) - 1;
        prereqCount.set(edge.to, newCount);
        if (newCount === 0) queue.push(edge.to);
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