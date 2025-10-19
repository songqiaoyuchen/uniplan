/**
 * @author Kevin Zhang
 * @description Handles the case where logic gate is OR
 * @created 2025-05-08
 */

import { Session, Integer } from "neo4j-driver";
import { resolveModuleCodes } from "./resolveModuleCodes";

// === Handle leaf case: a single string module prerequisite
export async function handleLeaf(
  tree: string,
  session: Session,
): Promise<Integer | null> {
  // Resolve module node IDs that match the given moduleCode (handles % wildcards internally)
  const ids = await resolveModuleCodes(tree, session);

  if (ids.length === 0) {
    console.warn(`⚠️ No module found for: ${tree}`);
    return null;
  }

  // If it's a wildcard with multiple matches (e.g. "CS2040%"), create an OR logic gate
  if (tree.includes("%") && ids.length > 1) {
    const logicRes = await session.run(
      `CREATE (l:Logic {type: "OR"}) RETURN id(l) AS logicId`,
    );
    const logicId = logicRes.records[0].get("logicId");

    // Link each matching module to the OR node via OPTION relationship
    for (const moduleId of ids) {
      await session.run(
        `MATCH (l) WHERE id(l) = $lid
           MATCH (m) WHERE id(m) = $mid
           MERGE (l)-[:OPTION]->(m)`, // connect logic node to each module via OPTION
        { lid: logicId, mid: moduleId },
      );
    }

    return logicId;
  }

  return ids[0];
}
