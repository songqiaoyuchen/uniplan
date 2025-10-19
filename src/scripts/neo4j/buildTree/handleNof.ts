// /src/scripts/neo4j/handleNof.ts
// Handles the case where logic gate is Nof
import { Session, Integer } from "neo4j-driver";
import { processTree } from "./attachTree";
import { resolveModuleCodes } from "./resolveModuleCodes";
import { PrereqTree } from "@/types/neo4jTypes";

export async function handleNof(
  tree: { nOf: [number, PrereqTree[]] },
  session: Session,
): Promise<Integer | null> {
  const [count, children] = tree.nOf;

  if (!Array.isArray(children) || children.length === 0) {
    console.warn(`❌ nOf has no children: ${JSON.stringify(tree)}`);
    return null;
  }

  const logicRes = await session.run(
    `CREATE (l:Logic {type: "NOF", threshold: $threshold}) RETURN id(l) AS logicId`,
    { threshold: count },
  );
  const logicId = logicRes.records[0].get("logicId");

  for (const child of children) {
    // Special handling for wildcards in NOF - flatten them directly
    if (typeof child === "string" && child.includes("%")) {
      const moduleIds = await resolveModuleCodes(child, session);
      
      for (const moduleId of moduleIds) {
        await session.run(
          `MATCH (l) WHERE id(l) = $lid
           MATCH (m) WHERE id(m) = $mid
           MERGE (l)-[:OPTION]->(m)`,
          { lid: logicId, mid: moduleId },
        );
      }
    } else {
      const childId = await processTree(child, session);
      if (childId === null) {
        console.warn(`⚠️ Skipping child in NOF due to missing node`);
        continue;
      }

      // Use same logic as buildLogicGate - check actual node type
      const labelRes = await session.run(
        `MATCH (n) WHERE id(n) = $id RETURN labels(n) AS labels`,
        { id: childId },
      );

      const labels = labelRes.records[0]?.get("labels") as string[];
      const isModule = labels?.includes("Module");
      const rel = isModule ? "OPTION" : "REQUIRES";

      await session.run(
        `MATCH (l) WHERE id(l) = $lid
        MATCH (c) WHERE id(c) = $cid
        MERGE (l)-[:${rel}]->(c)`,
        { lid: logicId, cid: childId },
      );
    }
  }

  return logicId;
}