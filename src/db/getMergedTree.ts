// src/db/getMergedPrereqTree.ts
// get prerequisite subgraphs for multiple modules and return a merged tree as RawGraph
// merges prerequisite subgraphs for multiple modules using APOC subgraphAll from Neo4j.

import type { Node as NeoNode, Relationship as NeoRel } from 'neo4j-driver';
import type { Record as NeoRecord} from 'neo4j-driver';
import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { mapGraph } from '@/utils/graph/mapGraph';
import { FormattedGraph } from '@/types/graphTypes';

/**
 * Merges prerequisite subgraphs for multiple modules in a single Cypher call,
 * eliminates duplicates via DISTINCT, and returns plain JSON arrays.
 */
export async function getMergedTree(moduleCodes: string[]): Promise<FormattedGraph> {
  const { driver, session } = await connectToNeo4j();
  try {
    // Single Cypher query to unwind, collect, and dedupe subgraphs
    const result = await session.run(
      `
        UNWIND $moduleCodes AS code
        MATCH (m:Module { moduleCode: code })
        OPTIONAL MATCH path = (m)-[:HAS_PREREQ|REQUIRES|OPTION*0..]->(n)
        WITH collect(DISTINCT m) + collect(DISTINCT n) AS allNodes, collect(DISTINCT relationships(path)) AS allRels
        WITH apoc.coll.flatten(allNodes) AS nodes, apoc.coll.flatten(allRels) AS rels
        RETURN nodes, rels AS relationships
      `,
      { moduleCodes }
    );

    console.log("Neo4j raw result:", JSON.stringify(result, null, 2));

    if (!result.records.length || !result.records[0].has('nodes')) {
      return { nodes: {}, relationships: [] };
    }

    const record: NeoRecord = result.records[0];
    const neoNodes = record.get('nodes') as NeoNode[];
    const neoRels  = record.get('relationships') as NeoRel[];

    console.log("Neo4j nodes:", JSON.stringify(neoNodes, null, 2));
    console.log("Neo4j rels:", JSON.stringify(neoRels, null, 2));

    const mapped = mapGraph({ nodes: neoNodes, relationships: neoRels });
    console.log("Mapped graph:", JSON.stringify(mapped, null, 2));
    return mapped;
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}