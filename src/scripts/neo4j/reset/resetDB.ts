import { connectToNeo4j, closeNeo4jConnection } from "../../../db/neo4j";
import { uploadModules } from "./uploadModules";
import { deduplicateLogicNodes } from "./deduplicateLogicNodes";
import { downloadData } from "./downloadData";
import { deleteGraph } from "./deleteGraph";
import { deleteYSCModules } from "./deleteYSCModules";
import { uploadAllPrereqTrees } from "./uploadPrerequisites";

async function resetDB(): Promise<void> {
  const startTime = Date.now();

  try {
    await deleteGraph();
    // Uncomment the following lines to download the latest NUSMods data (Don't spam it!)
    // await downloadData();
    await uploadModules();
    await uploadAllPrereqTrees();
    await deduplicateLogicNodes();
    await deleteYSCModules();
    console.log("✅ Graph reset and rebuilt successfully.");
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(
      `✅ Graph reset and rebuilt successfully in ${duration} seconds.`,
    );
  } catch (err) {
    console.error("❌ Error resetting and rebuilding graph:", err);
  }
}

if (require.main === module) {
  resetDB().catch((err) => {
    console.error("❌ Failed to reset database:", err);
    process.exit(1);
  });
}
