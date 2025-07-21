/**
 * Module selection with greedy scoring.
 * Built from scratch for clarity and correctness.
 */

import { EdgeMap, NormalisedGraph, PlannerState } from '@/types/graphTypes';
import { isModuleData, isNofNode, MAX_MCS_PER_SEMESTER } from './constants';

/**
 * Selects modules for a single semester using greedy scoring.
 */
export function selectModulesForSemester(
  availableSnapshot: Set<string>, // Now contains IDs
  plannerState: PlannerState,
  edgeMap: EdgeMap,
  codetoIdMap: Map<string, string>, // Map from code to ID
  graph: NormalisedGraph,
  targetModules: Set<string> // Now contains IDs
): string[] {
  const selected: string[] = [];
  let usedCredits = 0;

  // Create working copy of available modules
  const remainingModules = new Set(availableSnapshot);

  while (remainingModules.size > 0 && usedCredits < MAX_MCS_PER_SEMESTER) {
    // Find best module (O(n) optimization)
    const bestModuleId = findBestModule(remainingModules, plannerState, edgeMap, graph, targetModules);

    if (!bestModuleId) break;

    const node = graph.nodes[bestModuleId];
    if (!isModuleData(node)) throw new Error("Node is not ModuleData");
    const credits = node.credits || 4;

    // Prevent exceeding MCS limit
    if (usedCredits + credits > MAX_MCS_PER_SEMESTER) break;

    // Select the module
    selected.push(bestModuleId);
    usedCredits += credits;
    remainingModules.delete(bestModuleId);
    for (const preclusion of node.preclusions) {
      if (!codetoIdMap.get(preclusion)) {
        continue;
      }
      const preclusionId = codetoIdMap.get(preclusion);
      if (preclusionId !== undefined) {
        remainingModules.delete(preclusionId);
        plannerState.redundantModules.add(preclusionId);
      }
    }
    plannerState.completedModules.add(bestModuleId);

    // Immediately update logic satisfaction to prevent redundant selections
    updateLogicSatisfaction(bestModuleId, plannerState, edgeMap, graph);
  }

  return selected;
}

/**
 * Finds the best module using pure impact scoring (O(n)).
 */
function findBestModule(
  available: Set<string>, // Now contains IDs
  plannerState: PlannerState,
  edgeMap: EdgeMap,
  graph: NormalisedGraph,
  targetModules: Set<string> // Now contains IDs
): string | null {
  let bestModule: string | null = null;
  let bestImpact = -1;

  for (const moduleId of available) {
    const impact = calculateImpact(moduleId, plannerState, edgeMap, graph, targetModules);
    
    if (impact > bestImpact) {
      bestImpact = impact;
      bestModule = moduleId;
    }
  }

  return bestModule;
}

/**
 * Pure impact scoring: targets = 1.0, others based on path to targets.
 */
function calculateImpact(
  moduleId: string, // Now expects ID
  plannerState: PlannerState,
  edgeMap: EdgeMap,
  graph: NormalisedGraph,
  targetModules: Set<string> // Now contains IDs
): number {
  // Target modules get maximum impact
  // if (targetModules.has(moduleId)) {
  //   return 100.0;
  // }

  let totalImpact = 0;

  // All modules have a parent logic node
  // Find logic nodes that have this module as a requirement
  if (!edgeMap[moduleId]) {
    throw new Error(`Module ${moduleId} not found in edgeMap`);
  }
  const parentLogicNodes = edgeMap[moduleId].in || [];

  for (const logicNode of parentLogicNodes) {
    // If parent logic is already satisfied, zero additional impact
    if (plannerState.logicStatus[logicNode]?.satisfied) continue;

    const unlockValue = calculateUnlockValue(logicNode, edgeMap, graph, targetModules, plannerState) * 1.2;
    
    totalImpact += unlockValue;
  }

  return Math.min(Number.POSITIVE_INFINITY, totalImpact);
}

/**
 * Calculate the value of satisfying a logic node (what it unlocks toward targets).
 */
function calculateUnlockValue(
  logicId: string,
  edgeMap: EdgeMap,
  graph: NormalisedGraph,
  targetModules: Set<string>,
  plannerState: PlannerState
): number {
  // Find what modules/logics require this logic node
  const unlockedNodes = edgeMap[logicId].in || [];

  let unlockValue = 0;

  for (const nodeId of unlockedNodes) {
    const node = graph.nodes[nodeId];
    
    if (isModuleData(node)) {
      // Direct target unlock
      if (targetModules.has(nodeId)) {
        unlockValue += 20;  // High value for direct target unlock
      } else {
        unlockValue += 0;  // Some value for unlocking any module
      }
    } else if (isNofNode(node)) {
      // Recursively calculate value of unlocking this logic
      unlockValue += calculateUnlockValue(nodeId, edgeMap, graph, targetModules, plannerState);
    }
  }

  return unlockValue;
}

/**
 * Immediately update logic satisfaction when a module is selected.
 */
function updateLogicSatisfaction(
  selectedModuleId: string,
  plannerState: PlannerState,
  edgeMap: EdgeMap,
  graph: NormalisedGraph
): void {
  // Find parent logic nodes and start cascading updates
  const parentLogics = edgeMap[selectedModuleId].in || [];

  const toCheck = new Set(parentLogics);

  while (toCheck.size > 0) {
    // Get and remove first item
    const iterator = toCheck.values();
    const logicId = iterator.next().value as string;
    toCheck.delete(logicId);

    const logicStatus = plannerState.logicStatus[logicId];
    const logicNode = graph.nodes[logicId];
    
    // If logic is already satisfied or not a logic node, skip
    if (!logicStatus || logicStatus.satisfied || !isNofNode(logicNode)) {
      continue;
    }

    logicStatus.satisfiedCount += 1;

    if (logicStatus.satisfiedCount >= logicStatus.requires) {
      logicStatus.satisfied = true;
      plannerState.satisfiedLogicNodes.add(logicId);

      // Recursively check its parents too
      const grandparentLogics = edgeMap[logicId].in || [];

      for (const parentId of grandparentLogics) {
          toCheck.add(parentId);
      }
    }
  }
}