/**
 * @author Kevin Zhang
 * @description Attaches prerequisite trees to module nodes in Neo4j
 * @created 2025-05-07
 */

import { Session, Integer } from 'neo4j-driver';
import { handleLeaf } from './handleLeaf';
import { handleNof } from './handleNof';

const CLEAR_EXISTING = true; // Set to false if you want to preserve existing logic

export async function attachPrereqTree(moduleCode: string, tree: any, session: Session) {
  if (CLEAR_EXISTING) {
    // First: delete the HAS_PREREQ relationship
    await session.run(
      `MATCH (m:Module {code: $code})-[r:HAS_PREREQ]->() DELETE r`,
      { code: moduleCode }
    );
  
    // Second: delete the entire logic subtree (only logic nodes!)
    await session.run(
      `MATCH (m:Module {code: $code})-[:HAS_PREREQ]->(root:Logic)
       CALL apoc.path.subgraphAll(root, {
         relationshipFilter: "REQUIRES>|OPTION>",
         labelFilter: "Logic"
       }) YIELD nodes
       UNWIND nodes AS l
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

// === Core recursive function for constructing a prerequisite logic tree
async function processTree(tree: any, session: Session): Promise<Integer> {
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

  // Create a Logic node with the given type ("AND" or "OR")
  const logicRes = await session.run(
    `CREATE (l:Logic {type: $type}) RETURN id(l) AS logicId`,
    { type }
  );
  const logicId = logicRes.records[0].get('logicId');

  // For each child in the logic gate
  for (const child of children) {
    let childId: Integer;
    let rel: string;

    // Arguable labels for relationship
    if (typeof child === 'string') {
      // If child is a module (or wildcard), get its node ID via handleLeaf
      childId = await handleLeaf(child, session);
      rel = 'OPTION'; // Use OPTION when a logic gate directly points to a module
    } else {
      // If child is a nested logic block, recurse to build its subtree
      childId = await processTree(child, session);
      rel = 'REQUIRES'; // Use REQUIRES when a logic gate depends on another logic gate
    }

    // Connect the current logic node to the child using the appropriate relationship
    await session.run(
      `MATCH (l:Logic) WHERE id(l) = $lid
       MATCH (t) WHERE id(t) = $tid
       MERGE (l)-[:${rel}]->(t)`,
      { lid: logicId, tid: childId }
    );
  }

  return logicId;
}

