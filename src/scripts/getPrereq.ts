/**
 * @author Kevin Zhang
 * @description Prompts for a module code, calls the NUSMods API, and writes the prereq tree to file
 * @created 2025-05-07
 */

import { getPrereq } from './scrapers/prereq';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

// Simple readline prompt for CLI input
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function getPrereqTree(): Promise<void> {
  try {
    const moduleCode = await promptUser('📘 Enter a module code: ');
    if (!moduleCode) {
      console.warn('⚠️ No input provided. Exiting.');
      return;
    }

    console.log(`📡 Fetching prereq tree for ${moduleCode}...`);
    const response = await getPrereq(moduleCode);

    if (!response) {
      console.warn(`⚠️ No prereqTree found for ${moduleCode}`);
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

getPrereqTree();
