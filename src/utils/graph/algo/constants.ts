import { LogicNode } from "@/types/graphTypes";
import { ModuleData } from "@/types/plannerTypes";

// Scheduling constraints
export const MAX_MCS_PER_SEMESTER = 20;
export const MAX_SEMESTERS = 8;

// Prioritization weights
export const PRIORITY_WEIGHTS = {
  URGENCY: 0.3,
  IMPACT: 0.3,
  EFFICIENCY: 0.1,
  CRITICALITY: 0.3,
} as const;

// Chain length calculation parameters
export const CHAIN_LENGTH_DECAY_FACTOR = 5;

// Type guards
export function isNofNode(node: LogicNode | ModuleData): node is LogicNode {
  return 'type' in node && node.type === 'NOF';
}

export function isModuleData(node: unknown): node is ModuleData {
  return typeof node === 'object' && node !== null && 'code' in node;
}