// src/types.ts

export type RawNode = {
  id: number;
  labels: string[];
  properties: Record<string, any>;
};

export type RawRelationship = {
  id: number;
  startNode: number;
  endNode: number;
  type: string;
  properties: Record<string, any>;
};

export type RawGraph = {
  nodes: RawNode[];
  relationships: RawRelationship[];
};

export type LogicNode = {
  id: number;
  type: 'AND' | 'OR' | 'NOF';
  n?: number; // for nOF nodes (optional)
};

export type Edge = {
  from: number;
  to: number;
  type: string; // e.g. 'HAS_PREREQ', 'OPTION'
};

export type ModuleNode =
  | { type: 'single'; info: Module }
  | { type: 'group'; info: ModuleGroup };

export type FormattedGraph = {
  moduleNodes: Record<number, ModuleNode>;
  logicNodes: Record<number, LogicNode>;
  edges: Edge[];
};

export type ModuleGroup = {
  list: Record<string, Module>;
};

export type Module = {
  id: number;
  code: string;
  title: string;
  offeredIn: number[];
  description: string;
  moduleCredit: string;
};