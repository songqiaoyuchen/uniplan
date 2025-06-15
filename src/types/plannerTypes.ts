export type PlannerModule = {
  id: string, // neo4j node id or uuid
  code: string, // e.g. CS1101S
  title: string, // e.g. Data Structures and Algorithms
  credits: number, // number of MC
  semestersOffered: 0 | 1 | 2, // 0 means offered in both
  exam: Exam | null, 
  preclusions: string[], // module id
  plannedSemester: number | null // e.g. 5 = y3s1
}

export type SemesterData = {
  semester: number // e.g. 5 = y3s1
  modules: string[] // module id
}

export type Exam = {
  startTime: string // ISO 8601 format (e.g. '2025-12-01T09:00:00Z')
  durationMinutes: number
}