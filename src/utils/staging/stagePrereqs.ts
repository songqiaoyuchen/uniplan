/**
 * @author Kevin Zhang
 * @description Imports NUSMods module codes and their prerequisite trees into Neo4j
 * @created 2025-05-07
 */

import fs from 'fs';
import path from 'path';
import { connectToNeo4j, closeNeo4jConnection } from '../helper/neo4j';
import { getPrereqTree } from '../../logic/fetchNusMods/fetchTree';
import { attachPrereqTree } from '../../logic/createGraph/attachTree';

const moduleCodes: string[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'output', 'moduleCodes.json'), 'utf8')
);

//IMPORTANT: Not meant to be run more than once (Must delete all previous logic nodes to do so)
/*  MATCH (l:Logic)
    DETACH DELETE l
*/
//Key fix required: Logic nodes are replicated without checking as of right now
export async function run() {
  const { driver, session } = await connectToNeo4j();

  for (const code of moduleCodes) {
    const tree = await getPrereqTree(code);
    if (!tree) {
      console.log(`⚠️ Skipped ${code}: No prereqTree`);
      continue;
    }

    try {
      await attachPrereqTree(code, tree, session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error processing ${code}:`, msg);
      console.debug(`🪵 Tree for ${code}:`, JSON.stringify(tree, null, 2));
    }
  }

  await closeNeo4jConnection(driver, session);
  console.log("🎉 Finished attaching all prereq trees.");
}

