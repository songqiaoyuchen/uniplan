/**
 * @author Kevin Zhang
 * @description Attaches prerequisite trees to module nodes in Neo4j
 * @created 2025-05-07
 */

import { Session, Integer } from 'neo4j-driver';

const CLEAR_EXISTING = true; // Set to false if you want to preserve existing logic

export async function attachPrereqTree(moduleCode: string, tree: any, session: Session) {
  if (CLEAR_EXISTING) {
    await session.run(
      `MATCH (m:Module {code: $code})-[r:HAS_PREREQ]->(l:Logic)
       DETACH DELETE l`,
      { code: moduleCode }
    );
  }

  const logicId = await processTree(tree, session);

  const existingRel = await session.run(
    `MATCH (m:Module {code: $code})-[r:HAS_PREREQ]->(:Logic) RETURN count(r) AS count`,
    { code: moduleCode }
  );

  const alreadyHas = existingRel.records[0].get('count').toNumber() > 0;

  await session.run(
    `MATCH (m:Module {code: $code})
     MATCH (l:Logic) WHERE id(l) = $lid
     MERGE (m)-[:HAS_PREREQ]->(l)`,
    { code: moduleCode, lid: logicId }
  );

  console.log(alreadyHas
    ? `🔄 Updated prereqs for ${moduleCode}`
    : `✅ Attached new prereqs for ${moduleCode}`);
}

// === Resolve one or more module IDs from a raw code (e.g., "CS2040", "CS2040%", "CS2040:D")
export async function resolveModuleCodes(rawCode: string, session: Session): Promise<Integer[]> {
  const prefix = rawCode.replace('%', '');

  const res = await session.run(
    `MATCH (m:Module) WHERE m.code STARTS WITH $prefix RETURN id(m) AS id`,
    { prefix }
  );

  return res.records.map(r => r.get('id'));
}

// === Handle leaf case: a single string module prerequisite
export async function handleLeaf(tree: string, session: Session): Promise<Integer> {
  const rawCode = tree.split(':')[0];
  const ids = await resolveModuleCodes(rawCode, session);

  if (ids.length === 0) {
    throw new Error(`❌ No module matched for: ${rawCode}`);
  }

  if (rawCode.includes('%') && ids.length > 1) {
    const logicRes = await session.run(
      `CREATE (l:Logic {type: "OR"}) RETURN id(l) AS logicId`
    );
    const logicId = logicRes.records[0].get('logicId');

    for (const moduleId of ids) {
      await session.run(
        `MATCH (l) WHERE id(l) = $lid
         MATCH (m) WHERE id(m) = $mid
         MERGE (l)-[:OPTION]->(m)`,
        { lid: logicId, mid: moduleId }
      );
    }

    return logicId;
  }

  return ids[0];
}

// === Handle nOf logic gate
async function handleNof(tree: any, session: Session): Promise<Integer> {
  const [threshold, options] = tree.nOf;

  if (!Array.isArray(options) || options.length === 0) {
    throw new Error(`nOf has no options: ${JSON.stringify(tree)}`);
  }

  if (threshold > options.length) {
    console.warn(`⚠️ nOf threshold ${threshold} exceeds number of options (${options.length})`);
  }

  const logicRes = await session.run(
    `CREATE (l:Logic {type: "NOF", threshold: $threshold}) RETURN id(l) AS logicId`,
    { threshold }
  );
  const logicId = logicRes.records[0].get('logicId');

  for (const code of options) {
    const rawCode = code.split(':')[0];
    const ids = await resolveModuleCodes(rawCode, session);

    for (const moduleId of ids) {
      await session.run(
        `MATCH (l) WHERE id(l) = $lid
         MATCH (m) WHERE id(m) = $mid
         MERGE (l)-[:OPTION]->(m)`,
        { lid: logicId, mid: moduleId }
      );
    }
  }

  return logicId;
}

// === Core recursive function
export async function processTree(tree: any, session: Session): Promise<Integer> {
  if (typeof tree === 'string') {
    return await handleLeaf(tree, session);
  }

  if ('nOf' in tree) {
    return await handleNof(tree, session);
  }

  const type = Object.keys(tree)[0]?.toUpperCase();
  const children = tree[type.toLowerCase()];

  if (type !== "AND" && type !== "OR") {
    throw new Error(`Invalid logic type: ${type}`);
  }

  if (!Array.isArray(children) || children.length === 0) {
    throw new Error(`Empty ${type} logic block in ${JSON.stringify(tree)}`);
  }

  const logicRes = await session.run(
    `CREATE (l:Logic {type: $type}) RETURN id(l) AS logicId`,
    { type }
  );
  const logicId = logicRes.records[0].get('logicId');

  for (const child of children) {
    let childId: Integer;
    let rel: string;

    if (typeof child === 'string') {
      childId = await handleLeaf(child, session);
      rel = 'OPTION';
    } else {
      childId = await processTree(child, session);
      rel = 'REQUIRES';
    }

    await session.run(
      `MATCH (l:Logic) WHERE id(l) = $lid
       MATCH (t) WHERE id(t) = $tid
       MERGE (l)-[:${rel}]->(t)`,
      { lid: logicId, tid: childId }
    );
  }

  return logicId;
}
