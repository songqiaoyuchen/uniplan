/**
 * Fetches the prerequisite graph for a given module code from Neo4j.
 *
 * @param {string} moduleCode - The module code to fetch prerequisite information for.
 * @returns {Promise<{ nodes: RawNode[], relationships: RawRelationship[] } | null>}
 *
 * @description Retrieves the full prerequisite subgraph (including modules and logic gates)
 * starting from the given module. Returns a `RawGraph` object with `nodes` and `relationships`
 * arrays, or `null` if the module is not found.
 */

import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { RawNode, RawRelationship } from '@/types/graphTypes';

export async function getPrereqTree(moduleCode: string) {
  const { driver, session } = await connectToNeo4j();

  try {
    const result = await session.run(
      `
      MATCH (m:Module {moduleCode: $code})
      CALL apoc.path.subgraphAll(m, {
        relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
        labelFilter: "Module|Logic"
      }) YIELD nodes, relationships
      RETURN nodes, relationships
      `,
      { code: moduleCode }
    );

    const record = result.records[0];
    if (!record) return null;

    const nodes: RawNode[] = record.get('nodes').map((node: any) => ({
      id: node.identity.toString(),
      labels: node.labels,
      properties: node.properties,
    }));

    const relationships: RawRelationship[] = record.get('relationships').map((rel: any) => ({
      id: rel.identity.toString(),
      type: rel.type,
      startNode: rel.start.toString(),
      endNode: rel.end.toString(),
      properties: rel.properties,
    }));

    return { nodes, relationships };
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}