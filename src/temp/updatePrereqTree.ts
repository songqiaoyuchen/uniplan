<<<<<<<< HEAD:src/scripts/updatePrereq.ts
import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';
import { attachPrereqTree} from './utils/attachTree';
========
/**
 * @author Kevin Zhang
 * @description Updates a given module's prerequisite tree in Neo4j. (Buggy, I havn't checked for correctness)
 * @created 2025-05-08
 */

import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';
import { attachPrereqTree} from '../scripts/neo4j/attachPrereqTree';
>>>>>>>> 68e04d6e74482ac065d3f6d539ac2cade69e04e4:src/temp/updatePrereqTree.ts

const moduleCode = "FIN3702A";
const tree = "FIN2704%:D"; // direct string leaf

async function run() {
  const { driver, session } = await connectToNeo4j();
  try {
    await attachPrereqTree(moduleCode, tree, session);
  } catch (err) {
    console.error(err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
run();