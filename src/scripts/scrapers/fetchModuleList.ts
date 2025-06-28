/**
 * @path src/scripts/scrapers/fetchModuleList.ts
 * @description Scrapes module list from NUSMods API, outputs to src/data/moduleList.json,
 * stores only code and title.
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const MODULE_LIST_URL = "https://api.nusmods.com/v2/2024-2025/moduleList.json";

async function fetchMpeModules() {
  try {
    const response = await axios.get(MODULE_LIST_URL);
    const modules = response.data;

    // Filter only needed fields
    const filteredModules = modules.map((mod: { moduleCode: string; title: string }) => ({
      code: mod.moduleCode,
      title: mod.title,
    }));

    // Target output: src/data/moduleList.json
    const outputDir = path.join(process.cwd(), "src", "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, "moduleList.json");
    fs.writeFileSync(filePath, JSON.stringify(filteredModules, null, 2));

    console.log(`✅ Module list saved to: ${filePath}`);
    console.log("Preview:", filteredModules.slice(0, 5));
  } catch (error) {
    console.error("❌ Failed to fetch MPE modules:", error);
  }
}

// Run directly
if (require.main === module) {
  fetchMpeModules();
}
