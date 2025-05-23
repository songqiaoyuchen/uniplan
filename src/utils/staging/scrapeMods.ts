/**
 * @author Kevin Zhang
 * @description Scrapes module codes from NUSMods API
 * @created 2024-05-07
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const MODULE_LIST_URL = "https://api.nusmods.com/v2/2024-2025/moduleList.json";

export async function extractModuleCodes() {
  try {
    const response = await axios.get(MODULE_LIST_URL);
    const moduleList = response.data;

    const moduleCodes = moduleList.map((mod: { moduleCode: string }) => mod.moduleCode);

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Save to file in output directory
    const filePath = path.join(outputDir, 'moduleCodes.json');
    fs.writeFileSync(filePath, JSON.stringify(moduleCodes, null, 2));
    console.log(`Output written to: ${filePath}`);
    console.log(moduleCodes); // print to console
  } catch (error) {
    console.error('Failed to fetch module list:', error);
  }
}
