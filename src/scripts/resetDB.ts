import { connectToNeo4j, closeNeo4jConnection } from '../db/neo4j';
import { fetchModuleList } from './scrapers/fetchModuleList';
import { importModules } from './neo4j/stageNodes';
import { run } from './stagePrereqs';
import { deduplicateOrNodes } from './neo4j/deduplicateOrNodes';
import { exportModuleInfo } from './exportModuleInfo';
import { updateModulesMetadata } from './neo4j/updateModuleInfo';

async function resetDB(): Promise<void> {
  const { driver, session } = await connectToNeo4j();
  const startTime = Date.now();

  try {
    console.log('🔥 Deleting all nodes and relationships...');
    await session.run(`MATCH (n) DETACH DELETE n`);
    console.log('✅ Graph cleared.');

    console.log('📡 Fetching latest NUSMods data...');
    await exportModuleInfo();

    console.log('📦 Scraping module data...');
    await fetchModuleList();

    console.log('🌱 Staging module nodes...');
    await importModules();

    console.log('📝 Updating module metadata...');
    await updateModulesMetadata();

    console.log('🔗 Staging prerequisite relationships...');
    await run();

    console.log('🧹 Deduplicating OR logic nodes...');
    await deduplicateOrNodes();

    console.log('🧹 Removing deprecated nodes...')
    await session.run(`
        MATCH (m:Module)
        WHERE m.deprecated = true
        DETACH DELETE m`);
    
    console.log('✅ Graph reset and rebuilt successfully.');
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ Graph reset and rebuilt successfully in ${duration} seconds.`);
  } catch (err) {
    console.error('❌ Error resetting and rebuilding graph:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

resetDB();