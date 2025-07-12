import { connectToNeo4j, closeNeo4jConnection } from "../../../db/neo4j";

export async function deleteYSCModules() {
  const { driver, session } = await connectToNeo4j();

  const deleteModulesCypher = `
    MATCH (m:Module)
    WHERE m.moduleCode STARTS WITH 'YSC'
    DETACH DELETE m
    RETURN count(m) AS deletedCount
  `;

  const deleteOrphanLogicNodesCypher = `
    MATCH (n:Logic)
    WHERE NOT (n)-[:HAS_PREREQ|REQUIRES|OPTION]->()
    DETACH DELETE n
    RETURN count(n) AS deletedCount
  `;

  try {
    const result1 = await session.run(deleteModulesCypher);
    const deletedModules = result1.records[0].get("deletedCount").toNumber();
    console.log(`🗑️ Deleted ${deletedModules} YSC-prefixed modules.`);

    const result2 = await session.run(deleteOrphanLogicNodesCypher);
    const deletedLogic = result2.records[0].get("deletedCount").toNumber();
    console.log(`🧹 Deleted ${deletedLogic} orphaned logic nodes.`);
  } catch (err) {
    console.error("❌ Error deleting modules or logic nodes:", err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

if (require.main === module) {
  deleteYSCModules().catch((err) => {
    console.error("❌ Failed to delete YSC modules and logic nodes:", err);
    process.exit(1);
  });
}
