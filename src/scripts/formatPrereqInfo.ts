/**
 * @param {string} moduleCode - module code to fetch prerequisite information for
 * @returns {Promise<{ nodes: Array, relationships: Array } | null>}
 * 
 * @description fetch and format the prerequisite graph for a given module from Neo4j to nodes and edges array.
 */

import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';
import { getPrereqTree } from '@/scripts/neo4j/getPrereqTree';

export async function fetchPrereqInfo(moduleCode: string) {
  const { driver, session } = await connectToNeo4j();

  try {
    const record = await getPrereqTree(moduleCode, session);
    if (!record) return null;

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

    return { nodes, relationships };
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

