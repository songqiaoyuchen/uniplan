// src/types/graphTypes.ts

export type RawNode = {
  id: string;
  labels: string[];
  properties: Record<string, any>;
};

export type RawRelationship = {
  id: string;
  startNode: string;
  endNode: string;
  type: string;
  properties: Record<string, any>;
};

export type RawGraph = {
  nodes: RawNode[];
  relationships: RawRelationship[];
};

export type LogicNode = {
  id: string;
  requires: number
};

export type ModuleNode =
  | { type: 'single'; info: Module }
  | { type: 'group'; info: ModuleGroup };

export type Edge = {
  from: string;
  to: string;
};

export type ModuleGroup = {
  list: Module[];
};

export type Module = {
  id: string;
  code: string;
  title: string;
  offeredIn: number[];
  description: string;
  moduleCredit: string;
};

export type FormattedGraph = {
  moduleNodes: Record<string, ModuleNode>;
  logicNodes: Record<string, LogicNode>;
  edges: Edge[];
};