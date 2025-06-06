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

export type Node = 
  | { id: string; type: 'single'; info: Module }
  | { id: string; type: 'group'; info: ModuleGroup }
  | { id: string; type: 'logic'; requires: number };

export type Edge = {
  id: string;
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
  nodes: Record<string, Node>;
  edges: Edge[];
};

export type FinalGraph = {
  nodes: Record<string, Module>;
  edges: Edge[];
}