import { parsePrereq } from "@/utils/planner/parsePrereq";
import { getNeo4jDriver } from "./neo4j";
import { PrereqTree } from "@/types/plannerTypes";

export async function getModuleRequires(
  moduleCode: string,
): Promise<PrereqTree | null> {
  const driver = getNeo4jDriver();
  const session = driver.session(); 

  try {
    const result = await session.run(
      `
        MATCH (start:Module { moduleCode: $code })

        CALL apoc.path.expandConfig(start, {
          relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
          labelFilter: "/Module",
          minLevel: 1,
          uniqueness: "RELATIONSHIP_GLOBAL"
        }) YIELD path

        WITH collect(DISTINCT nodes(path)) AS pathNodes,
            collect(DISTINCT relationships(path)) AS pathRels

        RETURN apoc.coll.flatten(pathNodes) AS nodes,
              apoc.coll.flatten(pathRels) AS relationships
      `,
      { code: moduleCode },
    );

    const { nodes, relationships } = result.records[0].toObject();
    return parsePrereq(nodes, relationships);
  } finally {
    await session.close(); 
  }
}

