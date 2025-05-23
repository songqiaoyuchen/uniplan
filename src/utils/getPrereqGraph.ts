/**
 * @author Kevin Zhang
 * @description Exports the prerequisite graph for a given module from Neo4j to JSON.
 * @created 2025-05-08
 */

import { connectToNeo4j, closeNeo4jConnection } from './helper/neo4j';
import { getPrereqTree } from '@/utils/getPrereqTree';

export async function getPrereqGraph(moduleCode: string) {
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

