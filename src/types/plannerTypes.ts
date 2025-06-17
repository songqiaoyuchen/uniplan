export type ModuleData = {
  id: string, // neo4j node id or uuid
  code: string, // e.g. CS1101S
  title: string, // e.g. Data Structures and Algorithms
  credits: number, // number of MC
  semestersOffered: SemesterOffering
  exam: Exam | null, 
  preclusions: string[], // module id
  plannedSemester: number // e.g. 5 = y3s2, 0 = y1s1
}

export type Exam = {
  startTime: string // ISO 8601 format (e.g. '2025-12-01T09:00:00Z')
  durationMinutes: number
}

export enum SemesterOffering {
  Both = 0,
  First = 1,
  Second = 2,
}