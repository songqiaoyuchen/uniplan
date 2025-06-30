import { ModuleData } from "@/types/plannerTypes";
import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { mapModuleData } from "@/utils/graph/mapGraph";

export async function getModuleByCode(moduleCode: string): Promise<ModuleData | null> {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `MATCH (m:Module {moduleCode: $code}) RETURN m`,
      { code: moduleCode }
    );

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get('m');
    return mapModuleData(node);
  } catch (err) {
    console.error(`❌ Failed to fetch module ${moduleCode}:`, err);
    throw err;
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
