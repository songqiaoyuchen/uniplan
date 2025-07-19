// constants.ts
/**
 * Configuration constants and type guards for the scheduling algorithm.
 * Defines scheduling constraints, prioritization weights, and utility functions.
 */
import { LogicNode } from "@/types/graphTypes";
import { ModuleData } from "@/types/plannerTypes";

// Scheduling constraints
export const MAX_MCS_PER_SEMESTER = 20;
export const MAX_SEMESTERS = 20;

// Type guards
export function isNofNode(node: LogicNode | ModuleData | undefined): node is LogicNode {
  return node !== undefined && 'type' in node && node.type === 'NOF';
}

export function isModuleData(node: unknown): node is ModuleData {
  return typeof node === 'object' && node !== null && 'code' in node;
}