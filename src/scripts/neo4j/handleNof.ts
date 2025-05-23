// /src/scripts/neo4j/handleNof.ts
// Handles the case where logic gate is Nof

import { Session, Integer } from 'neo4j-driver';
import { resolveModuleCodes } from './resolveModuleCodes';

// === Handle nOf logic gate
export async function handleNof(tree: any, session: Session): Promise<Integer> {
  const [threshold, options] = tree.nOf;
  
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error(`nOf has no options: ${JSON.stringify(tree)}`);
  }
  
  const logicRes = await session.run(
    `CREATE (l:Logic {type: "NOF", threshold: $threshold}) RETURN id(l) AS logicId`,
    { threshold }
  );
  const logicId = logicRes.records[0].get('logicId');
  
  for (const code of options) {
    const ids = await resolveModuleCodes(code, session);
  
    for (const moduleId of ids) {
      await session.run(
        `MATCH (l) WHERE id(l) = $lid
           MATCH (m) WHERE id(m) = $mid
           MERGE (l)-[:OPTION]->(m)`,
        { lid: logicId, mid: moduleId }
      );
    }
  }
  
  return logicId;
}
