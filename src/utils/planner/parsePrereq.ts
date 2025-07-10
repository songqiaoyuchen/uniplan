import { PrereqTree } from "@/types/plannerTypes";

type Neo4jNode = {
  identity: { low: number };
  labels: string[];
  properties: Record<string, any>;
};

type Neo4jRel = {
  start: { low: number };
  end: { low: number };
};

export function parsePrereq(
  rawNodes: Neo4jNode[],
  rawRels: Neo4jRel[],
): PrereqTree | null {
  const nodesById: Record<number, Neo4jNode> = {};
  const childrenMap: Record<number, number[]> = {};

  for (const node of rawNodes) {
    nodesById[node.identity.low] = node;
  }

  for (const rel of rawRels) {
    if (!childrenMap[rel.start.low]) childrenMap[rel.start.low] = [];
    childrenMap[rel.start.low].push(rel.end.low);
  }

  const visited = new Set<number>();

  function buildTree(id: number): PrereqTree | null {
    if (visited.has(id)) return null; // avoid cycles
    visited.add(id);

    const node = nodesById[id];
    if (!node) return null;

    if (node.labels.includes("Module")) {
      return {
        type: "module",
        moduleCode: node.properties.moduleCode,
      };
    }

    const type = node.properties.type;
    const children = (childrenMap[id] || [])
      .map(buildTree)
      .filter(Boolean) as PrereqTree[];

    if ((type === "AND" || type === "OR") && children.length > 0) {
      return { type, children };
    }

    if (type === "NOF") {
      const n = node.properties.requires?.low ?? node.properties.requires ?? 1;
      return { type: "NOF", n, children };
    }

    return children.length === 1 ? children[0] : null;
  }

  const rootModuleIds = new Set<number>();
  const logicTrees: PrereqTree[] = [];
  const moduleTrees: PrereqTree[] = [];

  for (const rel of rawRels) {
    const from = nodesById[rel.start.low];
    const to = nodesById[rel.end.low];

    if (!from || !to) continue;

    // Module -> Logic
    if (from.labels.includes("Module") && to.labels.includes("Logic")) {
      const logicTree = buildTree(rel.end.low);
      if (logicTree) logicTrees.push(logicTree);
      rootModuleIds.add(rel.start.low);
    }

    // Module -> Module (direct)
    if (from.labels.includes("Module") && to.labels.includes("Module")) {
      moduleTrees.push({
        type: "module",
        moduleCode: to.properties.moduleCode,
      });
      rootModuleIds.add(rel.start.low);
    }
  }

  const allTrees = [...logicTrees, ...moduleTrees];
  if (allTrees.length === 0) return null;
  if (allTrees.length === 1) return allTrees[0];
  return { type: "AND", children: allTrees };
}
