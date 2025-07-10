import { NormalisedGraph, ScoredModule } from "@/types/graphTypes";
import { isModuleData, isNofNode, PRIORITY_WEIGHTS } from './constants';
import { calculateChainLengths, computeCriticality } from './chain';

export function prioritizeModules(
  available: Set<string>,
  graph: NormalisedGraph,
  targetModules: Set<string>,
  completedModules: Set<string>,
): ScoredModule[] {
  const scores: ScoredModule[] = [];
  const chainLengths = calculateChainLengths(graph, targetModules);
  
  // Build reverse lookup for module code to node ID
  const moduleToNode: Record<string, string> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      moduleToNode[node.code] = id;
    }
  }

  for (const modCode of available) {
    const nodeId = moduleToNode[modCode];
    if (!nodeId) continue;
    
    const chainInfo = chainLengths.get(modCode);
    const urgency = computeUrgency(modCode, nodeId, targetModules, graph);
    const impact = computeImpact(nodeId, graph, completedModules);
    const efficiency = computeEfficiency(modCode, graph);
    const criticality = computeCriticality(chainInfo);
    
    const score = 
      urgency * PRIORITY_WEIGHTS.URGENCY + 
      impact * PRIORITY_WEIGHTS.IMPACT + 
      efficiency * PRIORITY_WEIGHTS.EFFICIENCY + 
      criticality * PRIORITY_WEIGHTS.CRITICALITY;
      
    scores.push({ code: modCode, score, nodeId });
  }

  return scores.sort((a, b) => b.score - a.score);
}

function computeUrgency(
  code: string, 
  nodeId: string,
  targetModules: Set<string>,
  graph: NormalisedGraph
): number {
  if (targetModules.has(code)) return 1.0;
  
  const distances = dijkstraToTargets(nodeId, targetModules, graph);
  if (distances.size === 0) return 0.1;
  
  const minDistance = Math.min(...distances.values());
  return 1.0 / (1 + minDistance);
}

function computeImpact(
  nodeId: string,
  graph: NormalisedGraph,
  completedModules: Set<string>
): number {
  const unlocked = countUnlockedModules(nodeId, graph, completedModules);
  const totalModules = Object.values(graph.nodes).filter(isModuleData).length;
  return unlocked / Math.max(1, totalModules);
}

function computeEfficiency(
  code: string,
  graph: NormalisedGraph
): number {
  const node = Object.values(graph.nodes).find(
    n => isModuleData(n) && n.code === code
  );
  if (!node || !isModuleData(node)) return 0.5;
  
  const credits = node.credits || 4;
  return 1.0 / (1 + credits * 0.1);
}

function dijkstraToTargets(
  startId: string,
  targetCodes: Set<string>,
  graph: NormalisedGraph
): Map<string, number> {
  const distances: Map<string, number> = new Map();
  const visited = new Set<string>();
  const queue: [string, number][] = [[startId, 0]];
  
  while (queue.length > 0) {
    queue.sort((a, b) => a[1] - b[1]);
    const [currentId, dist] = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    const currentNode = graph.nodes[currentId];
    if (isModuleData(currentNode) && targetCodes.has(currentNode.code)) {
      distances.set(currentNode.code, dist);
    }
    
    for (const edge of graph.edges) {
      if (edge.from === currentId && !visited.has(edge.to)) {
        queue.push([edge.to, dist + 1]);
      }
    }
  }
  
  return distances;
}

function countUnlockedModules(
  nodeId: string,
  graph: NormalisedGraph,
  completedModules: Set<string>
): number {
  const visited = new Set<string>();
  const queue = [nodeId];
  let count = 0;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    for (const edge of graph.edges) {
      if (edge.from === current) {
        const targetNode = graph.nodes[edge.to];
        
        if (isModuleData(targetNode) && !completedModules.has(targetNode.code)) {
          const otherPrereqs = graph.edges
            .filter(e => e.to === edge.to && e.from !== current)
            .every(e => {
              const prereqNode = graph.nodes[e.from];
              return isNofNode(prereqNode) || 
                (isModuleData(prereqNode) && completedModules.has(prereqNode.code));
            });
          
          if (otherPrereqs) {
            count++;
            queue.push(edge.to);
          }
        } else if (isNofNode(targetNode)) {
          queue.push(edge.to);
        }
      }
    }
  }
  
  return count;
}