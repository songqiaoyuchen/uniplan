// get a single module from Neo4j by its module code

import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { ModuleData } from '@/types/plannerTypes';

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
      semestersOffered: parseInt(node.properties.offeredIn.length > 1 ? 2 : node.properties.offeredIn[0]),
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
