// get prereq graph for a given module from Neo4j as FormattedGraph

import { FormattedGraph } from "@/types/graphTypes";
import {  getNeo4jDriver } from "./neo4j";
import { mapGraph } from "@/utils/graph/mapGraph";

export async function getGraph(
  moduleCode: string,
): Promise<FormattedGraph | null> {
  const driver = getNeo4jDriver();
  const session = driver.session(); 

  try {
    const result = await session.run(
      `MATCH (m:Module {moduleCode: $code})
       CALL apoc.path.subgraphAll(m, {
         relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
         labelFilter: "Module|Logic"
       }) YIELD nodes, relationships
       RETURN nodes, relationships`,
      { code: moduleCode },
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];

    const neoNodes = record.get("nodes");
    const neoRels = record.get("relationships");

    return mapGraph({ nodes: neoNodes, relationships: neoRels });
  } catch (err) {
    console.error(`❌ Failed to query graph for ${moduleCode}:`, err);
    throw err;
  } finally {
    await session.close();
  }
}
