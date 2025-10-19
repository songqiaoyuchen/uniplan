/**
 * @author Kevin Zhang
 * @description Attaches prerequisite trees to module nodes in Neo4j
 * @created 2025-05-07
 */

import { Session, Integer } from "neo4j-driver";
import { handleLeaf } from "./handleLeaf";
import { handleNof } from "./handleNof";
import { PrereqTree } from "@/types/neo4jTypes";

const CLEAR_EXISTING = true; // Set to false if you want to preserve existing logic
export async function attachPrereqTree(
  moduleCode: string,
  tree: PrereqTree,
  session: Session,
) {
  if (CLEAR_EXISTING) {
    // First: delete the HAS_PREREQ relationship
    await session.run(
      `MATCH (m:Module {moduleCode: $moduleCode})-[r:HAS_PREREQ]->() DELETE r`,
      { moduleCode },
    );

    // Second: delete the entire logic subtree (only logic nodes!)
    await session.run(
      `MATCH (m:Module {moduleCode: $moduleCode})-[:HAS_PREREQ]->(root:Logic)
       CALL apoc.path.subgraphAll(root, {
         relationshipFilter: "REQUIRES>|OPTION>",
         labelFilter: "Logic"
       }) YIELD nodes
       UNWIND nodes AS l
       DETACH DELETE l`,
      { moduleCode },
    );
  }

  const nodeId = await processTree(tree, session);
  if (!nodeId) {
    console.warn(`⚠️ Skipping ${moduleCode} (no valid prereq tree)`);
    return;
  }

  // Dynamically detect whether the returned node is a Logic or Module
  const result = await session.run(
    `MATCH (n) WHERE id(n) = $id RETURN labels(n) AS labels`,
    { id: nodeId },
  );

  if (result.records.length === 0) {
    console.warn(`⚠️ Skipping ${moduleCode} (target node disappeared)`);
    return;
  }

  const labels = result.records[0].get("labels") as string[];
  const isLogic = labels.includes("Logic");
  const relTargetLabel = isLogic ? "Logic" : "Module";

  const existingRel = await session.run(
    `MATCH (m:Module {moduleCode: $moduleCode})-[r:HAS_PREREQ]->(:${relTargetLabel}) RETURN count(r) AS count`,
    { moduleCode },
  );
  const alreadyHas = existingRel.records[0].get("count").toNumber() > 0;

  await session.run(
    `MATCH (m:Module {moduleCode: $moduleCode})
    MATCH (t:${relTargetLabel}) WHERE id(t) = $id
    MERGE (m)-[:HAS_PREREQ]->(t)`,
    { moduleCode, id: nodeId },
  );

  console.log(
    alreadyHas
      ? `🔄 Updated prereqs for ${moduleCode}`
      : `✅ Attached new prereqs for ${moduleCode}`,
  );
}

// Core recursive function for constructing a prerequisite logic tree
export async function processTree(
  tree: PrereqTree,
  session: Session,
): Promise<Integer | null> {
  if (typeof tree === "string") {
    return await handleLeaf(tree, session);
  }

  if ("nOf" in tree) {
    return await handleNof(tree, session);
  }

  if ("and" in tree) {
    return await buildLogicGate("AND", tree.and, session);
  }

  if ("or" in tree) {
    return await buildLogicGate("OR", tree.or, session);
  }

  throw new Error(`Invalid tree node: ${JSON.stringify(tree)}`);
}

async function buildLogicGate(
  type: "AND" | "OR",
  children: PrereqTree[],
  session: Session,
): Promise<Integer | null> {
  if (!Array.isArray(children) || children.length === 0) {
    console.warn(`⚠️ Skipping empty ${type} logic block`);
    return null;
  }

  const logicRes = await session.run(
    `CREATE (l:Logic {type: $type}) RETURN id(l) AS logicId`,
    { type },
  );
  const logicId = logicRes.records[0].get("logicId");

  for (const child of children) {
    const childId = await processTree(child, session);
    if (childId === null) {
      console.warn(`⚠️ Skipping child in ${type} due to missing module`);
      continue;
    }

    // Dynamically determine edge type based on actual label of the returned node
    const labelRes = await session.run(
      `MATCH (n) WHERE id(n) = $id RETURN labels(n) AS labels`,
      { id: childId },
    );
    if (labelRes.records.length === 0) {
      throw new Error(`Node ${childId} disappeared during processing`);
    }

    const labels = labelRes.records[0]?.get("labels") as string[];
    const isModule = labels?.includes("Module");
    const rel = isModule ? "OPTION" : "REQUIRES";

    await session.run(
      `MATCH (l:Logic) WHERE id(l) = $lid
       MATCH (t) WHERE id(t) = $tid
       MERGE (l)-[:${rel}]->(t)`,
      { lid: logicId, tid: childId },
    );
  }

  return logicId;
}
