/**
 * @author Kevin Zhang
 * @description Executes APOC subgraphAll query for a given module code.
 * @created 2025-05-08
 */

import { Session } from 'neo4j-driver';

export async function getPrereqTree(moduleCode: string, session: Session) {
  const result = await session.run(
    `MATCH (m:Module {code: $code})
     CALL apoc.path.subgraphAll(m, {
       relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
       labelFilter: "Module|Logic"
     }) YIELD nodes, relationships
     RETURN nodes, relationships`,
    { code: moduleCode }
  );

  if (result.records.length === 0) return null;

  return result.records[0];
}
