import { connectToNeo4j, closeNeo4jConnection } from './neo4j';
import { attachPrereqTree} from '../logic/attachTree';

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