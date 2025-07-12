// ===== prioritise.ts =====
import { NormalisedGraph, ScoredModule, PlannerState } from "@/types/graphTypes";
import { isModuleData, isNofNode, PRIORITY_WEIGHTS, MAX_MCS_PER_SEMESTER } from './constants';

export function prioritizeModules(
  available: Set<string>,
  graph: NormalisedGraph,
  completedModules: Set<string>,
): ScoredModule[] {
  const scores: ScoredModule[] = [];
  
  // Build module code to node ID mapping
  const moduleToNode: Record<string, string> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      moduleToNode[node.code] = id;
    }
  }
  
  for (const moduleCode of available) {
    const nodeId = moduleToNode[moduleCode];
    if (!nodeId) continue;

    const node = graph.nodes[nodeId];
    if (!isModuleData(node)) continue;

    const impact = computeImpact(nodeId, graph, completedModules);
    const efficiency = computeEfficiency(nodeId, graph);

    const score = impact * PRIORITY_WEIGHTS.IMPACT + efficiency * PRIORITY_WEIGHTS.EFFICIENCY;
    scores.push({ code: node.code, score, nodeId });
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function selectModulesForSemester(
  state: PlannerState,
  graph: NormalisedGraph,
  targetModules: Set<string>
): string[] {
  const semesterAvailable = new Set(state.availableModules);
  const selected: string[] = [];
  let usedMCs = 0;

  while (semesterAvailable.size > 0 && usedMCs < MAX_MCS_PER_SEMESTER) {
    const prioritized = prioritizeModules(semesterAvailable, graph, state.completedModules);
    
    if (prioritized.length === 0) break;

    // Find the first module that fits
    let moduleAdded = false;
    for (const mod of prioritized) {
      const node = graph.nodes[mod.nodeId];
      if (!isModuleData(node)) continue;
      
      const mc = node.credits || 4;
      if (usedMCs + mc > MAX_MCS_PER_SEMESTER) continue;

      // Select this module
      selected.push(mod.code);
      usedMCs += mc;
      semesterAvailable.delete(mod.code);
      
      // Prune alternatives immediately
      pruneAlternatives(mod.code, mod.nodeId, state, semesterAvailable, graph, targetModules);
      
      moduleAdded = true;
      break;
    }
    
    if (!moduleAdded) break;
  }

  return selected;
}

function computeImpact(nodeId: string, graph: NormalisedGraph, completedModules: Set<string>): number {
  // Find logic nodes this module points to
  const logicNodesUnlocked = graph.edges
    .filter(e => e.from === nodeId)
    .map(e => e.to)
    .filter(id => isNofNode(graph.nodes[id]));
  
  // Count potential modules those logic nodes could unlock
  let totalPotentialUnlocks = 0;
  for (const logicId of logicNodesUnlocked) {
    const modulesFromLogic = graph.edges
      .filter(e => e.from === logicId)
      .map(e => e.to)
      .filter(id => {
        const node = graph.nodes[id];
        return isModuleData(node) && !completedModules.has(node.code);
      });
    
    totalPotentialUnlocks += modulesFromLogic.length;
  }
  
  return Math.min(1.0, totalPotentialUnlocks * 0.1);
}

function computeEfficiency(nodeId: string, graph: NormalisedGraph): number {
  const node = graph.nodes[nodeId];
  if (!node || !isModuleData(node)) return 0.5;
  
  const credits = node.credits || 4;
  return 1.0 / (1 + credits * 0.1);
}

function pruneAlternatives(
  selectedCode: string,
  selectedNodeId: string,
  state: PlannerState,
  semesterAvailable: Set<string>,
  graph: NormalisedGraph,
  targetModules: Set<string>
): void {
  // Find logic nodes this module is an option for
  const logicParents = graph.edges
    .filter(e => e.to === selectedNodeId && isNofNode(graph.nodes[e.from]))
    .map(e => e.from);

  for (const logicId of logicParents) {
    const logicNode = graph.nodes[logicId];
    if (!isNofNode(logicNode)) continue;

    // Find all module options for this logic node
    const moduleOptions = graph.edges
      .filter(e => e.from === logicId)
      .map(e => e.to)
      .filter(id => isModuleData(graph.nodes[id]))
      .map(id => (graph.nodes[id] as any).code);

    // Count how many are already taken this semester
    const takenCount = moduleOptions.filter(code => !semesterAvailable.has(code)).length;

    // If requirement will be met, prune alternatives
    if (takenCount >= logicNode.n) {
      for (const code of moduleOptions) {
        if (code === selectedCode) continue;
        if (targetModules.has(code)) continue;
        
        const moduleNodeId = Object.entries(graph.nodes).find(
          ([_, node]) => isModuleData(node) && node.code === code
        )?.[0];
        
        if (moduleNodeId) {
          const otherLogicParents = graph.edges
            .filter(e => e.to === moduleNodeId && isNofNode(graph.nodes[e.from]) && e.from !== logicId)
            .map(e => e.from);
          
          // Check if any other logic nodes still need this module
          const neededByOtherLogic = otherLogicParents.some(otherLogicId => 
            !state.logicStatus[otherLogicId]?.satisfied
          );
          
          if (neededByOtherLogic) {
            continue;
          }
        }
        
        // Remove from BOTH semester and global state
        semesterAvailable.delete(code);
        state.availableModules.delete(code);
        state.prunedModules.add(code);
      }
    }
  }
}