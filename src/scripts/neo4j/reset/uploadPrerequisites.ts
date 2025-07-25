/**
 * @author Kevin Zhang
 * @description Attaches prerequisite trees to module nodes in Neo4j
 * @created 2025-05-07
 */

import fs from "fs";
import path from "path";
import { Prerequisite } from "@/types/neo4jTypes";
import { attachPrereqTree } from "../buildTree/attachTree";
import { Session } from "neo4j-driver";

export async function uploadAllPrereqTrees(session: Session): Promise<void> {
  const filePath = path.join(
    process.cwd(),
    "src",
    "data",
    "modulePrereqInfo.json",
  );

  const prereqMap: Prerequisite = JSON.parse(fs.readFileSync(filePath, "utf8"));

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
  } catch (err) {
    console.error("❌ Error uploading prerequisite trees:", err);
  }
}