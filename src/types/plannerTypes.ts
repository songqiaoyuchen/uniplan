export type ModuleData = {
  id: string; // neo4j node id or uuid
  code: string; // e.g. CS1101S
  title: string; // e.g. Data Structures and Algorithms
  credits: number; // number of MC
  semestersOffered: SemesterLabel[]; // e.g. ["First", "Second"]
  exam: Exam | null;
  preclusions: string[]; // module id
  plannedSemester?: number | null; // e.g. 5 = y3s2, 0 = y1s1 NO LONGER IN USE
  grade?: string; // e.g. A+, B, C, etc.
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
  Planned = 'Planned', // green status, no issues, can be taken in that semester
  Locked = 'Locked', // red status, prereq missing in previous semesters
  Blocked = 'Blocked', // orange status, prereqs present but may be locked / conflicted
  Conflicted = 'Conflicted', // conflicted due to [exam clash, semester not offered, perclusion]
}

export type PrereqTree =
  | { type: "module"; moduleCode: string }
  | { type: "AND"; children: PrereqTree[] }
  | { type: "OR"; children: PrereqTree[] }
  | { type: "NOF"; n: number; children: PrereqTree[] };

export type ModuleIssue =
  | { type: 'PrereqMissing'; list: string[] }
  | { type: 'PrereqUnmet'; list: string[] }
  | { type: 'Precluded'; with: string[] }
  | { type: 'InvalidSemester' }
  | { type: 'ExamClash'; with: string[] }