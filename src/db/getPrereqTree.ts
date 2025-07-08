/**
 * Fetches the prerequisite graph for a given module code from Neo4j.
 *
 * @param {string} moduleCode - The module code to fetch prerequisite information for.
 * @returns {Promise<FormattedGraph | null>}
 *
 * @description Retrieves the full prerequisite subgraph (including modules and logic gates)
 * starting from the given module. Returns a `RawGraph` object with `nodes` and `relationships`
 * arrays, or `null` if the module is not found.
 */

import { mapGraph } from "@/utils/graph/mapGraph";
import type { Node as NeoNode, Relationship as NeoRel } from "neo4j-driver";
import { connectToNeo4j, closeNeo4jConnection } from "./neo4j";
import { FormattedGraph } from "@/types/graphTypes";

export async function getPrereqTree(
  moduleCode: string,
): Promise<FormattedGraph | null> {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `
      MATCH (m:Module {moduleCode: $code})
      CALL apoc.path.subgraphAll(m, {
        relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
        labelFilter: "Module|Logic"
      }) YIELD nodes, relationships
      RETURN nodes, relationships
      `,
      { code: moduleCode },
    );

    const record = result.records[0];
    if (!record) return null;

    const neoNodes = record.get("nodes") as NeoNode[];
    const neoRels = record.get("relationships") as NeoRel[];

    return mapGraph({ nodes: neoNodes, relationships: neoRels });
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
