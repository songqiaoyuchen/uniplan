// Export prereq graph for a given module from Neo4j to node and edge lists.

import { connectToNeo4j, closeNeo4jConnection } from './neo4j';

export async function exportPrereqGraph(moduleCode: string) {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `MATCH (m:Module {code: $code})
       CALL apoc.path.subgraphAll(m, {
         relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
         labelFilter: "Module|Logic"
       }) YIELD nodes, relationships
       RETURN nodes, relationships`,
      { code: moduleCode }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];

    const nodes = record.get('nodes').map((node: any) => ({
      id: node.identity.toInt(),
      labels: node.labels,
      properties: node.properties,
    }));

    const relationships = record.get('relationships').map((rel: any) => ({
      id: rel.identity.toInt(),
      type: rel.type,
      startNode: rel.start.toInt(),
      endNode: rel.end.toInt(),
      properties: rel.properties,
    }));

    return { nodes, relationships }; // ✅ return the graph object
  } catch (err) {
    console.error(`❌ Failed to query graph for ${moduleCode}:`, err);
    throw err;
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

