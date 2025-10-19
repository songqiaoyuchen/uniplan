/**
 * @author Kevin Zhang
 * @description Returns node IDs of the corresponding course(s) in Neo4j
 * @created 2025-05-08
 */

import { Session, Integer } from "neo4j-driver";

// === Resolve one or more module IDs from a raw moduleCode (e.g., "CS2040", "CS2040%", "CS2040:D")
export async function resolveModuleCodes(
  tree: string,
  session: Session,
): Promise<Integer[]> {
  let rawCode = tree.split(":")[0].toUpperCase();
  let moduleIds: Integer[] = [];

  if (rawCode.includes("%")) {
    rawCode = rawCode.replace("%", "");
    const res = await session.run(
      `MATCH (m:Module) WHERE m.moduleCode STARTS WITH $rawCode RETURN id(m) AS id`,
      { rawCode },
    );
    moduleIds = res.records.map((r) => r.get("id"));
  } else {
    const res = await session.run(
      `MATCH (m:Module {moduleCode: $moduleCode}) RETURN id(m) AS id`,
      { moduleCode: rawCode },
    );
    moduleIds = res.records.map((r) => r.get("id"));
  }

  if (moduleIds.length === 0) {
    console.warn(`⚠️ No module found for moduleCode: ${rawCode}`);
  }

  return moduleIds;
}
