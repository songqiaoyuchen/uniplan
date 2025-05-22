import { Session, Integer } from 'neo4j-driver';

// === Resolve one or more module IDs from a raw code (e.g., "CS2040", "CS2040%", "CS2040:D")
export async function resolveModuleCodes(tree: string, session: Session): Promise<Integer[]> {
  let rawCode = tree.split(':')[0];
  let moduleIds: Integer[] = [];

  if (rawCode.includes('%')) {
    rawCode = rawCode.replace('%', '');
    const res = await session.run(
      `MATCH (m:Module) WHERE m.code STARTS WITH $rawCode RETURN id(m) AS id`,
      { rawCode }
    );
    moduleIds = res.records.map(r => r.get('id'));
  } else {
    const res = await session.run(
      `MATCH (m:Module {code: $code}) RETURN id(m) AS id`,
      { code: rawCode }
    );
    moduleIds = res.records.map(r => r.get('id'));
  }

  if (moduleIds.length === 0) {
    // ✅ Fallback: create deprecated module node
    const fallback = await session.run(
      `CREATE (m:Module {code: $code, deprecated: true}) RETURN id(m) AS id`,
      { code: rawCode }
    );
    console.warn(`🛠️ Created deprecated module node: ${rawCode}`);
    return [fallback.records[0].get('id')];
  }

  return moduleIds;
}
