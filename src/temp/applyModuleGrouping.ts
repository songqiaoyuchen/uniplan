import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';

export async function applyModuleGrouping(): Promise<void> {
  const { driver, session } = await connectToNeo4j();

  const cypher = `
    MATCH (m:Module)
    OPTIONAL MATCH (m)-[:HAS_PREREQ]->(r:Logic)
    WITH m, collect(DISTINCT id(r)) AS requiresLogics

    OPTIONAL MATCH (l:Logic)-[:OPTION]->(m)
    WITH m, requiresLogics, collect(DISTINCT id(l)) AS usedByLogics

    WITH 
      apoc.coll.sort(requiresLogics) AS sortedRequires,
      apoc.coll.sort(usedByLogics) AS sortedUsedBy,
      m.code AS code, m

    WITH 
      apoc.text.join([x IN sortedRequires | toString(x)], ",") + "|" +
      apoc.text.join([x IN sortedUsedBy | toString(x)], ",") AS logicSignature,
      collect({ code: code, node: m }) AS moduleEntries,
      collect(DISTINCT sortedRequires)[0] AS requiresSet,
      collect(DISTINCT sortedUsedBy)[0] AS usedBySet
    WHERE size(moduleEntries) > 1

    CALL {
      WITH moduleEntries, requiresSet, usedBySet

      WITH moduleEntries, requiresSet, usedBySet,
          [entry IN moduleEntries | entry.code] AS memberCodes

      CREATE (g:GroupedModules {
        members: memberCodes,
        groupSize: size(memberCodes)
      })

      WITH g, moduleEntries, requiresSet, usedBySet

      // Link group to each module
      UNWIND moduleEntries AS entry
      WITH g, moduleEntries, requiresSet, usedBySet, entry.node AS mod
      CREATE (g)-[:HAS_MEMBER]->(mod)

      WITH g, moduleEntries, requiresSet, usedBySet  // <== reintroduce

      // Rewire HAS_PREREQ edges to group
      UNWIND requiresSet AS reqId
      MATCH (r:Logic) WHERE id(r) = reqId
      CREATE (g)-[:HAS_PREREQ]->(r)

      WITH g, moduleEntries  // <== carry forward again

      // Rewire OPTION edges from logic to group
      UNWIND moduleEntries AS entry2
      WITH g, moduleEntries, entry2.node AS mod2
      MATCH (l:Logic)-[opt:OPTION]->(mod2)
      CREATE (l)-[:OPTION]->(g)
      DELETE opt

      WITH moduleEntries  // <== carry forward again

      // Delete old HAS_PREREQ edges
      UNWIND moduleEntries AS entry3
      WITH entry3.node AS mod3
      MATCH (mod3)-[r:HAS_PREREQ]->(:Logic)
      DELETE r

      RETURN count(*) AS rewired
    }


    RETURN count(*) AS groupsMutated;`;

  try {
    const result = await session.run(cypher);
    console.log('✅ Grouped module rewiring completed.');
    console.log(result.records[0].toObject());
  } catch (err) {
    console.error('❌ Error applying module grouping:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

// applyModuleGrouping();