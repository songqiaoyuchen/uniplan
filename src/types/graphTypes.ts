// src/types/graphTypes.ts

import { ModuleData } from "./plannerTypes";

export type LogicNode = OrNode | AndNode | NofNode;

export type OrNode = { id: string; type: "OR" };
export type AndNode = { id: string; type: "AND" };
export type NofNode = { id: string; type: "NOF"; n: number };

export type Edge = {
  id: string;
  from: string;
  to: string;
};

export type FormattedGraph = {
  nodes: Record<string, ModuleData | LogicNode>;
  relationships: Edge[];
};

export type NormalisedGraph = {
  nodes: Record<string, ModuleData | NofNode>;
  edges: Edge[];
};

export type FinalGraph = {
  nodes: Record<string, ModuleData>;
  edges: Edge[];
};

export type LogicStatus = {
  satisfied: boolean;
  requires: number;
  satisfiedCount: number;
};

export type PlannerState = {
  availableModules: Set<string>;
  completedModules: Set<string>;
  logicStatus: Record<string, LogicStatus>;
};
