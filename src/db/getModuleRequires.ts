import { parsePrereq } from '@/utils/planner/parsePrereq';
import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { PrereqTree } from '@/types/plannerTypes';


export async function getModuleRequires(moduleCode: string): Promise<PrereqTree | null> {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `
        MATCH (start:Module { moduleCode: $code })
        MATCH path = (start)-[:HAS_PREREQ|REQUIRES|OPTION*1..]->(target:Module)
        WHERE ALL(n IN nodes(path)[1..-1] WHERE n:Logic)

        WITH collect(DISTINCT nodes(path)) AS pathNodes, collect(DISTINCT relationships(path)) AS pathRels
        WITH apoc.coll.flatten(pathNodes) AS nodes, apoc.coll.flatten(pathRels) AS relationships

        RETURN nodes, relationships
      `,
      { code: moduleCode }
    );

    const { nodes, relationships } = result.records[0].toObject();
    return parsePrereq(nodes, relationships);

  } finally {
    await closeNeo4jConnection(driver, session);
  }
}