import fs from 'fs';
import path from 'path';
import { connectToNeo4j, closeNeo4jConnection } from '../../db/neo4j';

async function dryRunGroupModules(): Promise<void> {
  const { driver, session } = await connectToNeo4j();

  const cypher = `
  MATCH (m:Module)
    OPTIONAL MATCH (m)-[:HAS_PREREQ]->(r:Logic)
    WITH m, collect(DISTINCT id(r)) AS requiresLogics

    OPTIONAL MATCH (l:Logic)-[:OPTION]->(m)
    WITH m, requiresLogics, collect(DISTINCT id(l)) AS usedByLogics

    WITH 
      apoc.coll.sort(requiresLogics) AS sortedRequires,
      apoc.coll.sort(usedByLogics) AS sortedUsedBy,
      m.code AS moduleCode
    WHERE size(sortedRequires) > 0 OR size(sortedUsedBy) > 0

    WITH 
      CASE WHEN size(sortedRequires) = 0 THEN "" ELSE apoc.text.join([x IN sortedRequires | toString(x)], ",") END AS requiresKey,
      CASE WHEN size(sortedUsedBy) = 0 THEN "" ELSE apoc.text.join([x IN sortedUsedBy | toString(x)], ",") END AS usedByKey,
      moduleCode

    WITH 
      requiresKey + "|" + usedByKey AS logicSignature,
      collect(moduleCode) AS members
    WHERE size(members) > 1

    RETURN logicSignature, members
    ORDER BY size(members) DESC
  `;

   try {
    const result = await session.run(cypher);

    const output = result.records.map((record, i) => {
      const key = record.get('logicSignature');
      const members: string[] = record.get('members');

      const [requiresStr, usedByStr] = key.split('|');
      const requires = requiresStr ? requiresStr.split(',').map(Number) : [];
      const usedBy = usedByStr ? usedByStr.split(',').map(Number) : [];

      return {
        groupNumber: i + 1,
        groupSize: members.length,
        requires,
        usedBy,
        members
      };
    });

    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputPath = path.join(outputDir, 'moduleGroupingDryRun.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`✅ Dry run grouping output written to ${outputPath}`);
  } catch (err) {
    console.error('❌ Error during dry-run grouping:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

dryRunGroupModules();
