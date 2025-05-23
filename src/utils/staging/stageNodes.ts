/**
 * @author Kevin Zhang
 * @description Imports NUSMods module codes into Neo4j as nodes
 * @created 2025-05-07
 */

import fs from 'fs';
import path from 'path';
import { connectToNeo4j, closeNeo4jConnection } from '../helper/neo4j';

// Load module codes from output directory
const moduleCodes: string[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'output', 'moduleCodes.json'), 'utf8')
);

export async function importModules() {
  const { driver, session } = await connectToNeo4j();

  try {
    const tx = session.beginTransaction();

    for (const code of moduleCodes) {
      await tx.run(
        `MERGE (:Module {code: $code})`,
        { code }
      );
      console.log(`Adding ${code}...`);
    }

    await tx.commit();
    console.log(`Successfully added ${moduleCodes.length} module nodes.`);
  } catch (err) {
    console.error('Error inserting modules:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}