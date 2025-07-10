/**
 * @author Kevin Zhang
 * @description Attaches prerequisite trees to module nodes in Neo4j
 * @created 2025-05-07
 */

import fs from "fs";
import path from "path";
import { connectToNeo4j, closeNeo4jConnection } from "../../../db/neo4j";
import { Prerequisite } from "@/types/neo4jTypes";
import { attachPrereqTree } from "./buildTree/attachTree";

export async function uploadAllPrereqTrees(): Promise<void> {
  const filePath = path.join(
    process.cwd(),
    "src",
    "data",
    "modulePrereqInfo.json",
  );

  const prereqMap: Prerequisite = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { driver, session } = await connectToNeo4j();

  try {
    for (const [moduleCode, tree] of Object.entries(prereqMap)) {
      if (!tree) {
        console.log(`⚠️ Skipping ${moduleCode} (no tree)`);
        continue;
      }

      try {
        await attachPrereqTree(moduleCode, tree, session);
      } catch (err) {
        console.warn(
          `❌ Failed to attach ${moduleCode}:`,
          (err as Error).message,
        );
      }
    }

    console.log("🎉 Finished uploading all prerequisite trees.");
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

if (require.main === module) {
  uploadAllPrereqTrees().catch((err) => {
    console.error("❌ Failed to upload prerequisite trees:", err);
    process.exit(1);
  });
}

if (require.main === module) {
  uploadAllPrereqTrees()
    .then(() => console.log("✅ Prerequisite trees uploaded successfully."))
    .catch((err) =>
      console.error("❌ Failed to upload prerequisite trees:", err),
    );
}
