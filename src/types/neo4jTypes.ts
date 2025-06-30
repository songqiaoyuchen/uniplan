export type Neo4jMiniModuleData = {
    moduleCode: string;
    title: string;
};

import type { Node as NeoNode, Relationship as NeoRel } from 'neo4j-driver';

export type Neo4jGraph = {
    nodes: NeoNode[];
    relationships: NeoRel[];
};

// Matches NUSMODS module data structure
// Source: https://api.nusmods.com/v2/2024-2025/module
export type Neo4jModuleData = {
  moduleCode: string;
  title: string;
  description: string;
  moduleCredit: string; // note: still string, e.g. "4"
  department: string;
  faculty: string;
  workload?: number[]; // e.g. [3,1,0,3,3]
  prerequisite?: string;
  preclusion?: string;
  attributes?: RawAttributes;
  gradingBasisDescription?: string;
  semesterData?: RawSemesterInfo[];
};

export type RawAttributes = {
  mpes1?: boolean;
  mpes2?: boolean;
  su?: boolean;
  [key: string]: boolean | undefined;
};

export type RawSemesterInfo = {
  semester: number;
  examDate?: string; // ISO string
  examDuration?: number; // in minutes
  covidZones?: string[];
};

export type PrereqTree =
  | string
  | { and: PrereqTree[] }
  | { or: PrereqTree[] }
  | { nOf: [number, PrereqTree[]] };

// Dictionary of module codes to their prerequisite trees
export type Prerequisite = {
  [moduleCode: string]: PrereqTree | null; // null if no prerequisites
};

export type LogicType = 'AND' | 'OR' | 'NOF';
