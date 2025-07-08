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
    const childId = await processTree(child, session);
    const rel = typeof child === "string" ? "OPTION" : "REQUIRES";

    await session.run(
      `MATCH (l) WHERE id(l) = $lid
      MATCH (c) WHERE id(c) = $cid
      MERGE (l)-[:${rel}]->(c)`,
      { lid: logicId, cid: childId },
    );
  }

  return logicId;
}
