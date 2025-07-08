import { connectToNeo4j, closeNeo4jConnection } from "../../../db/neo4j";

export async function deleteYSCModules() {
  const { driver, session } = await connectToNeo4j();

  const cypher = `
    MATCH (m:Module)
    WHERE m.moduleCode STARTS WITH 'YSC'
    DETACH DELETE m
    RETURN count(m) AS deletedCount
  `;

  try {
    const result = await session.run(cypher);
    const deleted = result.records[0].get("deletedCount").toNumber();
    console.log(`🗑️ Deleted ${deleted} YSC-prefixed modules.`);
  } catch (err) {
    console.error("❌ Error deleting YSC modules:", err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

if (require.main === module) {
  deleteYSCModules().catch((err) => {
    console.error("❌ Failed to delete YSC modules:", err);
    process.exit(1);
  });
}
