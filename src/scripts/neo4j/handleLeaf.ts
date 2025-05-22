import { Session, Integer } from 'neo4j-driver';
import { resolveModuleCodes } from './resolveModuleCodes';

// === Handle leaf case: a single string module prerequisite
export async function handleLeaf(tree: string, session: Session): Promise<Integer> {
    // Resolve module node IDs that match the given code (handles % wildcards internally)
    const ids = await resolveModuleCodes(tree, session);
  
    if (ids.length === 0) {
      throw new Error(`❌ No module matched for: ${tree}`);
    }
  
    // If it's a wildcard with multiple matches (e.g. "CS2040%"), create an OR logic gate
    if (tree.includes('%') && ids.length > 1) {
      const logicRes = await session.run(
        `CREATE (l:Logic {type: "OR"}) RETURN id(l) AS logicId`
      );
      const logicId = logicRes.records[0].get('logicId');
  
      // Link each matching module to the OR node via OPTION relationship
      // OPTION or generic LINK???
      for (const moduleId of ids) {
        await session.run(
          `MATCH (l) WHERE id(l) = $lid
           MATCH (m) WHERE id(m) = $mid
           MERGE (l)-[:OPTION]->(m)`, // connect logic node to each module via OPTION
          { lid: logicId, mid: moduleId }
        );
      }
      
      return logicId;
    }
  
    return ids[0];
  }