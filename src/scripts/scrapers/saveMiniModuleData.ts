import fs from "fs";
import path from "path";
import { MiniModuleData } from "@/types/plannerTypes";

// For frontend use
export async function saveMiniModuleData(
  data: MiniModuleData[],
): Promise<void> {
  try {
    // Target output: src/data/moduleList.json
    const outputDir = path.join(process.cwd(), "src", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, "miniModuleData.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ Module list saved to: ${filePath}`);
    console.log("Preview:", data.slice(0, 5));
  } catch (error) {
    console.error("❌ Failed to fetch or export module list:", error);
  }
}
