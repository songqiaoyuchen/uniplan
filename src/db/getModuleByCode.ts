// get a single module from Neo4j by its module code

import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { ModuleData } from '@/types/plannerTypes';

// function convertSemesterNumberToLabel(n: number): SemesterLabel {
//   switch (n) {
//     case 1: return "First";
//     case 2: return "Second";
//     case 3: return "Special Term 1";
//     case 4: return "Special Term 2";
//     default: return "Unplanned"
//   }
// }

// function extractSemestersOffered(semesterData?: RawSemesterInfo[]): SemesterLabel[] {
//   return (semesterData ?? []).map(s => convertSemesterNumberToLabel(s.semester));
// }

// function extractExam(semesterData?: RawSemesterInfo[]): Exam | null {
//   const entry = (semesterData ?? []).find(s => s.examDate);
//   return entry && entry.examDate
//     ? {
//         startTime: entry.examDate,
//         durationMinutes: entry.examDuration ?? 0,
//       }
//     : null;
// }

// function parsePreclusion(raw?: string): string[] {
//   if (!raw) return [];
//   return raw.match(/[A-Z]{2,3}\d{4}[A-Z]?/g) ?? [];
// }

//     const module: ModuleData = {
//       id: node.identity.toString(),
//       code: props.moduleCode,
//       title: props.title,
//       credits: parseInt(props.moduleCredit, 10),
//       semestersOffered: extractSemestersOffered(props.semesterData),
//       exam: extractExam(props.semesterData),
//       preclusions: parsePreclusion(props.preclusion),
//       plannedSemester: -1,
//       grade: props.gradingBasisDescription ?? undefined,
//       status: undefined,
//       description: props.description,
//       faculty: props.faculty,
//       department: props.department,
//     };

export async function getModuleByCode(moduleCode: string): Promise<ModuleData | null> {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `MATCH (m:Module {code: $code}) RETURN m`,
      { code: moduleCode }
    );

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('m');
    const module: ModuleData = {
      id: node.identity.toString(), // Store as string to match your ModuleData type
      code: node.properties.code,
      title: node.properties.title,
      credits: parseInt(node.properties.moduleCredit),
      semestersOffered: [],
      // no map currently
      exam: node.properties.exam ? {
        startTime: node.properties.exam.startTime,
        durationMinutes: parseInt(node.properties.exam.durationMinutes)
      } : null,
      // no map currently
      preclusions: node.properties.preclusions || [],
      plannedSemester: -1,
      grade: node.properties.grade || null,
      status: parseInt(node.properties.status),
      description: node.properties.description ?? undefined,
      faculty: node.properties.faculty ?? undefined,
      department: node.properties.department ?? undefined,
    };

    return module;

  } catch (err) {
    console.error(`❌ Failed to fetch module ${moduleCode}:`, err);
    throw err;
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
