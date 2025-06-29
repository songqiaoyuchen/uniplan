// src/db/getMergedPrereqTree.ts
// get prerequisite subgraphs for multiple modules and return a merged tree as RawGraph
// merges prerequisite subgraphs for multiple modules using APOC subgraphAll from Neo4j.

import type { RawGraph, RawNode, RawRelationship } from '@/types/graphTypes';
import type { Record as NeoRecord, Node as NeoNode, Relationship as NeoRel } from 'neo4j-driver';
import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { Console } from 'console';
import { Neo4jModuleData } from '@/types/neo4jTypes';

/**
 * Merges prerequisite subgraphs for multiple modules in a single Cypher call,
 * eliminates duplicates via DISTINCT, and returns plain JSON arrays.
 */
export async function getMergedTree(moduleCodes: string[]): Promise<RawGraph> {
  const { driver, session } = await connectToNeo4j();
  try {
    // Single Cypher query to unwind, collect, and dedupe subgraphs
    const result = await session.run(
      `UNWIND $moduleCodes AS code
        MATCH (m:Module { moduleCode: code })

        CALL apoc.path.subgraphAll(
          m,
          {
            relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
            labelFilter: "Module|Logic"
          }
        ) YIELD nodes, relationships

        WITH collect(DISTINCT nodes) AS groupedNodes, collect(DISTINCT relationships) AS groupedRels
        WITH apoc.coll.flatten(groupedNodes) AS nodes, apoc.coll.flatten(groupedRels) AS relationships
        RETURN nodes, relationships`,
      { moduleCodes }
    );

    if (!result.records.length || !result.records[0].has('nodes')) {
      return { nodes: [], relationships: [] };
    }

    const record: NeoRecord = result.records[0];
    const neoNodes = record.get('nodes') as NeoNode[];
    const neoRels  = record.get('relationships') as NeoRel[];

    const nodes: RawNode[] = neoNodes.map((n): RawNode => {
      const rawProps: Record<string, any> = { ...n.properties };

      // Convert Neo4j integers to JS numbers
      for (const key in rawProps) {
        const val = rawProps[key];
        if (Array.isArray(val)) {
          rawProps[key] = val.map((item) =>
            typeof item?.toInt === 'function' ? item.toInt() : item
          );
        } else if (typeof val?.toInt === 'function') {
          rawProps[key] = val.toInt();
        }
      }

      // If it's a Module node, assert Neo4jModuleData shape
      const isModule = n.labels.includes('Module');
      return {
        id: n.identity.toString(),
        labels: [...n.labels],
        properties: isModule ? (rawProps as Neo4jModuleData) : rawProps,
      };
    });

    const relationships: RawRelationship[] = neoRels.map((r): RawRelationship => ({
      id: `${r.start.toString()}-${r.end.toString()}`,
      startNode: r.start.toString(),
      endNode: r.end.toString(),
      type: r.type,
      properties: { ...r.properties }
    }));

    return { nodes, relationships };
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}