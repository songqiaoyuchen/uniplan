import { ModuleData } from "@/types/plannerTypes";
import { getNeo4jDriver } from "./neo4j";
import { mapModuleData } from "@/utils/graph/mapGraph";

export async function getModuleByCode(
  moduleCode: string,
): Promise<ModuleData | null> {
  const driver = getNeo4jDriver();
  const session = driver.session(); 

  try {
    const result = await session.run(
      `MATCH (m:Module {moduleCode: $code}) RETURN m`,
      { code: moduleCode },
    );

    if (result.records.length === 0) {
      return null;
    }

    const node = result.records[0].get("m");
    const module = mapModuleData(node);
    return { ...module };
  } catch (err) {
    console.error(`❌ Failed to fetch module ${moduleCode}:`, err);
    throw err;
  } finally {
    await session.close(); 
  }
}
