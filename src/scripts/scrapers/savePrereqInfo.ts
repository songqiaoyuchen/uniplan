/**
 * @author Kevin Zhang
 * @description Saves all fetched prerequisite trees to disk
 * @created 2025-05-07
 */

import fs from 'fs/promises';
import path from 'path';
import { Prerequisite } from '@/types/neo4jTypes';

export async function savePrereqInfo(data: Prerequisite): Promise<void> {
  try {
    const outputDir = path.join(process.cwd(), "src", "data");
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, 'modulePrereqInfo.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Prereq info saved to: ${filePath}`);
  } catch (error) {
    console.error('❌ Error saving prerequisite info:', error);
  }
}