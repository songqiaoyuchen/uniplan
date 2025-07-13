/**
 * Module selection with pure impact scoring.
 * Built from scratch for clarity and correctness.
 */

import { NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isModuleData, isNofNode, MAX_MCS_PER_SEMESTER } from './constants';

/**
 * Selects modules for a single semester using pure impact scoring.
 */
export function selectModulesForSemester(
  availableSnapshot: Set<string>,
  plannerState: PlannerState,
  graph: NormalisedGraph,
  targetModules: Set<string>
): string[] {
  const selected: string[] = [];
  let usedCredits = 0;

  // Create working copy of available modules
  const remainingModules = new Set(availableSnapshot);

  while (remainingModules.size > 0 && usedCredits < MAX_MCS_PER_SEMESTER) {
    // Find best module (O(n) optimization)
    const bestModule = findBestModule(remainingModules, plannerState, graph, targetModules);
    
    if (!bestModule) break;

    const moduleNode = findModuleNode(bestModule, graph);
    if (!moduleNode) break;

    const credits = moduleNode.credits || 4;
    if (usedCredits + credits > MAX_MCS_PER_SEMESTER) break;

    // Select the module
    selected.push(bestModule);
    usedCredits += credits;
    remainingModules.delete(bestModule);
    plannerState.completedModules.add(bestModule);

    // Immediately update logic satisfaction
    updateLogicSatisfaction(bestModule, plannerState, graph);
  }

  return selected;
}

/**
 * Finds the best module using pure impact scoring (O(n)).
 */
function findBestModule(
  available: Set<string>,
  plannerState: PlannerState,
  graph: NormalisedGraph,
  targetModules: Set<string>
): string | null {
  let bestModule: string | null = null;
  let bestImpact = -1;

  for (const moduleCode of available) {
    const impact = calculateImpact(moduleCode, plannerState, graph, targetModules);
    
    if (impact > bestImpact) {
      bestImpact = impact;
      bestModule = moduleCode;
    }
  }

  return bestModule;
}

/**
 * Pure impact scoring: targets = 1.0, others based on path to targets.
 */
function calculateImpact(
  moduleCode: string,
  plannerState: PlannerState,
  graph: NormalisedGraph,
  targetModules: Set<string>
): number {
  // Target modules get maximum impact
  if (targetModules.has(moduleCode)) {
    return 1.0;
  }

  const moduleId = findModuleId(moduleCode, graph);
  if (!moduleId) return 0;

  let totalImpact = 0;

  // Find logic nodes that have this module as a requirement
  const parentLogicNodes = graph.edges
    .filter(e => e.to === moduleId && isNofNode(graph.nodes[e.from]))
    .map(e => e.from);

  for (const logicId of parentLogicNodes) {
    const logicNode = graph.nodes[logicId];
    if (!isNofNode(logicNode)) continue;

    // Skip if logic already satisfied
    if (plannerState.logicStatus[logicId]?.satisfied) continue;

    const currentSatisfiedCount = getCurrentLogicSatisfaction(logicId, plannerState, graph);
    const unlockValue = calculateLogicUnlockValue(logicId, graph, targetModules, plannerState);
    
    // Give credit for both completion and progress
    const progressRatio = 1.0 / logicNode.n;
    const completionBonus = (currentSatisfiedCount + 1 >= logicNode.n) ? 1.0 : 0.7;
    
    totalImpact += unlockValue * progressRatio * completionBonus;
  }

  return Math.min(1.0, totalImpact);
}

/**
 * Immediately update logic satisfaction when a module is selected.
 */
function updateLogicSatisfaction(
  selectedModule: string,
  plannerState: PlannerState,
  graph: NormalisedGraph
): void {
  const moduleId = findModuleId(selectedModule, graph);
  if (!moduleId) return;

  // Find parent logic nodes and start cascading updates
  const parentLogics = graph.edges
    .filter(e => e.to === moduleId && isNofNode(graph.nodes[e.from]))
    .map(e => e.from);

  const toCheck = new Set(parentLogics);

  while (toCheck.size > 0) {
    // Get and remove first item
    const iterator = toCheck.values();
    const logicId = iterator.next().value as string;
    toCheck.delete(logicId);

    const logicStatus = plannerState.logicStatus[logicId];
    const logicNode = graph.nodes[logicId];
    
    if (!logicStatus || logicStatus.satisfied || !isNofNode(logicNode)) {
      continue;
    }

    const satisfiedCount = getCurrentLogicSatisfaction(logicId, plannerState, graph);
    const wasNotSatisfied = !logicStatus.satisfied;
    
    logicStatus.satisfiedCount = satisfiedCount;
    
    if (satisfiedCount >= logicNode.n) {
      logicStatus.satisfied = true;
      plannerState.satisfiedLogicNodes.add(logicId);

      // If this logic was newly satisfied, check its parents too
      if (wasNotSatisfied) {
        const grandparentLogics = graph.edges
          .filter(e => e.to === logicId && isNofNode(graph.nodes[e.from]))
          .map(e => e.from);
        
        for (const parentId of grandparentLogics) {
          toCheck.add(parentId);
        }
      }
    }
  }
}

/**
 * Calculate how many requirements of a logic node are currently satisfied.
 */
function getCurrentLogicSatisfaction(
  logicId: string,
  plannerState: PlannerState,
  graph: NormalisedGraph
): number {
  const options = graph.edges.filter(e => e.from === logicId);
  
  return options.filter(edge => {
    const optionNode = graph.nodes[edge.to];
    
    if (isModuleData(optionNode)) {
      return plannerState.completedModules.has(optionNode.code);
    }
    
    if (isNofNode(optionNode)) {
      return plannerState.logicStatus[edge.to]?.satisfied || false;
    }
    
    return false;
  }).length;
}

/**
 * Calculate the value of satisfying a logic node (what it unlocks toward targets).
 */
function calculateLogicUnlockValue(
  logicId: string,
  graph: NormalisedGraph,
  targetModules: Set<string>,
  plannerState: PlannerState
): number {
  // Find what modules/logics require this logic node
  const unlockedNodes = graph.edges
    .filter(e => e.to === logicId)
    .map(e => e.from);

  let unlockValue = 0;

  for (const nodeId of unlockedNodes) {
    const node = graph.nodes[nodeId];
    
    if (isModuleData(node)) {
      // Direct target unlock
      if (targetModules.has(node.code)) {
        unlockValue += 0.5;  // High value for direct target unlock
      } else {
        unlockValue += 0.1;  // Some value for unlocking any module
      }
    } else if (isNofNode(node)) {
      // Recursively calculate value of unlocking this logic
      unlockValue += calculateLogicUnlockValue(nodeId, graph, targetModules, plannerState) * 0.5;
    }
  }

  return unlockValue;
}

/**
 * Helper functions
 */
export function findModuleNode(moduleCode: string, graph: NormalisedGraph): any | null {
  for (const node of Object.values(graph.nodes)) {
    if (isModuleData(node) && node.code === moduleCode) {
      return node;
    }
  }
  return null;
}

export function findModuleId(moduleCode: string, graph: NormalisedGraph): string | null {
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node) && node.code === moduleCode) {
      return id;
    }
  }
  return null;
}