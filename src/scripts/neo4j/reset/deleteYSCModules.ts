import { Session } from "neo4j-driver";

export async function deleteYSCModules(session: Session) {
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
  }
}