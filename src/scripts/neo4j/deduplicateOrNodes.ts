import { connectToNeo4j, closeNeo4jConnection } from '../../db/neo4j';

export async function deduplicateOrNodes() {
  const { driver, session } = await connectToNeo4j();

  const cypher = `
    MATCH (l:Logic {type: "OR"})-[:OPTION]->(m)
    WITH l, apoc.coll.sort(collect(id(m))) AS sortedChildren
    WITH sortedChildren, collect(l) AS logicGroup
    WHERE size(logicGroup) > 1

    CALL {
      WITH logicGroup
      WITH logicGroup[0] AS survivor, logicGroup[1..] AS duplicates
      UNWIND duplicates AS dup

      // Rewire incoming HAS_PREREQ edges
      OPTIONAL MATCH (parent1)-[r1:HAS_PREREQ]->(dup)
      FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] ELSE [] END |
        MERGE (parent1)-[:HAS_PREREQ]->(survivor)
        DELETE r1
      )

      WITH dup, survivor

      // Rewire incoming REQUIRES edges
      OPTIONAL MATCH (parent2)-[r2:REQUIRES]->(dup)
      FOREACH (_ IN CASE WHEN r2 IS NOT NULL THEN [1] ELSE [] END |
        MERGE (parent2)-[:REQUIRES]->(survivor)
        DELETE r2
      )

      WITH dup, survivor

      // Rewire outgoing OPTION edges
      OPTIONAL MATCH (dup)-[opt:OPTION]->(child)
      FOREACH (_ IN CASE WHEN opt IS NOT NULL THEN [1] ELSE [] END |
        MERGE (survivor)-[:OPTION]->(child)
        DELETE opt
      )

      DETACH DELETE dup
      RETURN count(*) AS rewired
    }

    RETURN count(logicGroup) AS mergedGroups;
  `;

  try {
    let totalMerged = 0;
    let mergedGroups = -1;

    while (mergedGroups !== 0) {
      const result = await session.run(cypher);
      mergedGroups = result.records[0].get('mergedGroups').toNumber();
      totalMerged += mergedGroups;
      console.log(`✅ Merged ${mergedGroups} groups of duplicate OR nodes this iteration.`);
      if (mergedGroups === 0) {
        console.log(`🚀 Deduplication complete. Total groups merged: ${totalMerged}`);
      }
    }
  } catch (err) {
    console.error('❌ Error during deduplication:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
