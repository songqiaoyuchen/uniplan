/**
 * @author Kevin Zhang
 * @description Clears all nodes and relationships from the Neo4j database.
 * @created 2025-06-28
 */

import { Session } from "neo4j-driver";

export async function deleteGraph(session: Session): Promise<void> {
  try {
    console.log("🔥 Deleting all nodes and relationships...");
    await session.run(`MATCH (n) DETACH DELETE n`);
    console.log("✅ Graph deleted.");
  } catch (error) {
    console.error("❌ Failed to delete graph:", error);
  }
}