/**
 * @author Kevin Zhang
 * @description Clears all nodes and relationships from the Neo4j database.
 * @created 2025-06-28
 */

import { connectToNeo4j, closeNeo4jConnection } from '../../../db/neo4j';

export async function deleteGraph(): Promise<void> {
  const { driver, session } = await connectToNeo4j();

  try {
    console.log('🔥 Deleting all nodes and relationships...');
    await session.run(`MATCH (n) DETACH DELETE n`);
    console.log('✅ Graph deleted.');
  } catch (error) {
    console.error('❌ Failed to delete graph:', error);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

if (require.main === module) {
  deleteGraph().catch(err => {
    console.error('❌ Failed to delete graph:', err);
    process.exit(1);
  });
}