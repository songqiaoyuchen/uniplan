/**
 * @author Kevin Zhang
 * @description Merges prerequisite subgraphs for multiple modules using APOC subgraphAll from Neo4j.
 * @created 2025-05-10
 */

import { connectToNeo4j, closeNeo4jConnection } from '../../db/neo4j';
import type { Record as NeoRecord, Node as NeoNode, Relationship as NeoRel } from 'neo4j-driver';

interface JsonNode {
  id: number;
  labels: string[];
  properties: Record<string, any>;
}
interface JsonRel {
  id: number;
  startNode: number;
  endNode: number;
  type: string;
  properties: Record<string, any>;
}

/**
 * Merges prerequisite subgraphs for multiple modules in a single Cypher call,
 * eliminates duplicates via DISTINCT, and returns plain JSON arrays.
 */
export async function getMergedTree(moduleCodes: string[]): Promise<{
  nodes: JsonNode[];
  relationships: JsonRel[];
}> {
  const { driver, session } = await connectToNeo4j();
  try {
        // Single Cypher query to unwind, collect, and dedupe subgraphs
    const result = await session.run(
      `UNWIND $moduleCodes AS code
       MATCH (m:Module { code: code })
       CALL apoc.path.subgraphAll(
         m,
         {
           relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
           labelFilter: "Module|Logic"
         }
       ) YIELD nodes AS subNodes, relationships AS subRels
       UNWIND subNodes AS n
       UNWIND subRels AS r
       WITH collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS relationships
       RETURN nodes, relationships`,
      { moduleCodes }
    );

    if (result.records.length === 0) {
      return { nodes: [], relationships: [] };
    }

    const record = result.records[0] as NeoRecord;
    const neoNodes = record.get('nodes') as NeoNode[];
    const neoRels  = record.get('relationships') as NeoRel[];

    // Map driver objects to plain JSON
    const nodes: JsonNode[] = neoNodes.map(n => ({
      id: n.identity.toInt(),
      labels: [...n.labels],
      properties: {
        ...n.properties,
        offeredIn: n.properties.offeredIn?.map((x: any) => typeof x.toInt === "function" ? x.toInt() : x)
      }
    }));

    const relationships: JsonRel[] = neoRels.map(r => ({
      id:        r.identity.toInt(),
      startNode: r.start.toInt(),
      endNode:   r.end.toInt(),
      type:      r.type,
      properties:{ ...r.properties }
    }));

    return { nodes, relationships };
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
