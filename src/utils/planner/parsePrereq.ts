import { Node } from '@/types/plannerTypes';

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
  rawRels: Neo4jRel[]
): Node | null {
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

  function buildTree(id: number): Node | null {
    if (visited.has(id)) return null; // avoid cycles
    visited.add(id);

    const node = nodesById[id];
    if (!node) return null;

    if (node.labels.includes('Module')) {
      return {
        type: 'module',
        moduleCode: node.properties.moduleCode,
      };
    }

    const type = node.properties.type;
    const children = (childrenMap[id] || [])
      .map(buildTree)
      .filter(Boolean) as Node[];

    if ((type === 'AND' || type === 'OR') && children.length > 0) {
      return { type, children };
    }

    if (type === 'NOF') {
      const n = node.properties.requires?.low ?? node.properties.requires ?? 1;
      return { type: 'NOF', n, children };
    }

    return children.length === 1 ? children[0] : null;
  }

  // Root logic nodes = directly linked to module
  const logicRoots = rawRels
    .filter((r) => {
      const from = nodesById[r.start.low];
      const to = nodesById[r.end.low];
      return from?.labels.includes('Module') && to?.labels.includes('Logic');
    })
    .map((r) => r.end.low);

  const trees = logicRoots
    .map(buildTree)
    .filter(Boolean) as Node[];

  if (trees.length === 0) return null;
  if (trees.length === 1) return trees[0];
  return { type: 'AND', children: trees };
}
