export type ModuleData = {
  id: string; // neo4j node id or uuid
  code: string; // e.g. CS1101S
  title: string; // e.g. Data Structures and Algorithms
  credits: number; // number of MC
  semestersOffered: SemesterLabel[]; // e.g. ["First", "Second"]
  exam: Exam | null;
  preclusions: string[]; // module codes
  plannedSemester?: number | null; // e.g. 5 = y3s2, 0 = y1s1 NO LONGER IN USE
  grade?: Grade; // e.g. A+, B, C, etc.
  status?: ModuleStatus;
  description?: string; // optional description
  faculty?: string; // optional faculty name
  department?: string; // optional department name
  requires?: PrereqTree | null; // module codes that this module requires (e.g. CS1010)
  unlocks?: string[]; // module codes that this module unlocks (e.g. CS1101S)
  issues?: ModuleIssue[]
};

export type MiniModuleData = {
  code: string; // e.g. CS1101S
  title: string; // e.g. Data Structures and Algorithms
};

export type Exam = {
  startTime: string; // ISO 8601 format (e.g. '2025-12-01T09:00:00Z')
  durationMinutes: number;
};

export enum SemesterLabel {
  First,
  Second,
  SpecialTerm1,
  SpecialTerm2,
}

export enum ModuleStatus {
  Completed = 'Completed', // override status, disable checking
  Satisfied = 'Satisfied', // green status, no issues, can be taken in that semester
  Unsatisfied = 'Unsatisfied', // yellow status, prereq got issues
  Conflicted = 'Conflicted', // red, conflicted due to [exam clash, invalid sem, perclusion]
}

export type PrereqTree =
  | { type: "module"; moduleCode: string }
  | { type: "AND"; children: PrereqTree[] }
  | { type: "OR"; children: PrereqTree[] }
  | { type: "NOF"; n: number; children: PrereqTree[] };

export type ModuleIssue =
  | { type: 'PrereqUnsatisfied'}
  | { type: 'Precluded'; with: string[] }
  | { type: 'InvalidSemester' }
  | { type: 'ExamClash'; with: string[] }


// We are only allowing completed grades to be inputed,
// such that no grade -> not completed
export enum Grade {
  APlus = 'A+',
  A = 'A',
  AMinus = 'A-',
  BPlus = 'B+',
  B = 'B',
  BMinus = 'B-',
  CPlus = 'C+',
  C = 'C',
  DPlus ='D+',
  D = 'D',
  CS = 'CS',
}