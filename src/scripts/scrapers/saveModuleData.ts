/**
 * @author Kevin Zhang
 * @description Writes to a file for later use
 * @created 2025-05-07
 */

import fs from "fs/promises";
import path from "path";
import { Neo4jModuleData } from "@/types/neo4jTypes";

export async function saveModuleData(
  response: Neo4jModuleData[],
): Promise<void> {
  try {
    const outputDir = path.join(process.cwd(), "src", "data");
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, "moduleData.json");
    await fs.writeFile(filePath, JSON.stringify(response, null, 2), "utf-8");

    console.log(`✅ Module info saved to: ${filePath}`);
    console.log("📝 Response data:", response);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}
