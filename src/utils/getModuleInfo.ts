/**
 * @author Kevin Zhang
 * @description Calls NUSMods API for all modules information, and writes to a file for later use
 * @created 2025-05-07
 */

import { fetchModuleInfo } from '../logic/fetchNusMods/fetchModuleInfo';
import fs from 'fs/promises';
import path from 'path';

async function getModuleInfo(): Promise<any> {
  try {
    console.log(`📡 Fetching module information ...`);
    const response = await fetchModuleInfo();

    if (!response) {
      console.warn(`⚠️ No information found`);
      return;
    }

    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, `NUSMods-response.json`);
    await fs.writeFile(filePath, JSON.stringify(response, null, 2), 'utf-8');

    console.log(`✅ Response written`);
    console.log('📝 Response data:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getModuleInfo();
