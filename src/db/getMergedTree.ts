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

      CALL apoc.path.subgraphAll(
        m,
        {
          relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
          labelFilter: "Module|Logic"
        }
      ) YIELD nodes, relationships

      WITH collect(nodes) AS listOfNodeLists, collect(relationships) AS listOfRelLists
      WITH apoc.coll.flatten(listOfNodeLists) AS allNodesWithDups, apoc.coll.flatten(listOfRelLists) AS allRelsWithDups

      UNWIND allNodesWithDups AS n
      WITH collect(DISTINCT n) AS finalNodes, allRelsWithDups
      UNWIND allRelsWithDups AS r
      WITH finalNodes, collect(DISTINCT r) AS finalRels

      RETURN finalNodes AS nodes, finalRels AS relationships
      `,
      { moduleCodes }
    );

    if (!result.records.length || !result.records[0].has('nodes')) {
      return { nodes: {}, relationships: [] };
    }

    const record: NeoRecord = result.records[0];
    const neoNodes = record.get('nodes') as NeoNode[];
    const neoRels  = record.get('relationships') as NeoRel[];

    return mapGraph({ nodes: neoNodes, relationships: neoRels });
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}