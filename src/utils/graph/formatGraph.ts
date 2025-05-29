/** 
 * @path src/utils/graph/formatGraph.ts
 * @param raw: RawGraph,
 * @returns formatted graph: FormattedGraph
 * @description formats the raw graph from neo4j into a more structured format,
 * combining module nodes into groups where applicable and simplifying the structure.
*/ 

import {
  RawGraph,
  ModuleNode,
  LogicNode,
  Edge,
  Module,
  ModuleGroup,
  FormattedGraph,
} from '@/types/graphTypes';

export function formatGraph(raw: RawGraph): FormattedGraph {
  const moduleNodes: Record<number, ModuleNode> = {};
  const logicNodes: Record<number, LogicNode> = {};
  const edges: Edge[] = [];

  for (const node of raw.nodes) {
    if (node.labels.includes("Module")) {
      const { code, title, offeredIn, description, moduleCredit } = node.properties;
      moduleNodes[node.id] = {
        type: "single",
        info: {
          id: node.id,
          code,
          title,
          offeredIn,
          description,
          moduleCredit,
        },
      };
    }

    if (node.labels.includes("Logic")) {
      const type = node.properties.type as "AND" | "OR" | "NOF";
      logicNodes[node.id] = {
        id: node.id,
        type,
        ...(type === "NOF" && node.properties.threshold !== undefined 
          ? { n: node.properties.threshold } : {}),
      };
    }
  }

  for (const rel of raw.relationships) {
    edges.push({
      from: rel.startNode,
      to: rel.endNode,
      type: rel.type,
    });
  }

  return simplifyGraph(moduleNodes, logicNodes, edges);
}

function simplifyGraph(
  moduleNodes: Record<number, ModuleNode>,
  logicNodes: Record<number, LogicNode>,
  edges: Edge[]
): FormattedGraph {
  const moduleGroupCandidates: Record<
    string,
    { id: number; module: Module }[]
  > = {};

  // map id to node
  const idToNode: Record<number, ModuleNode | LogicNode> = {};
  for (const [id, node] of Object.entries(moduleNodes)) {
    idToNode[Number(id)] = node;
  }
  for (const [id, node] of Object.entries(logicNodes)) {
    idToNode[Number(id)] = node;
  }

  // Build parent/child maps
  const childrenMap: Record<number, Set<number>> = {};
  const parentsMap: Record<number, Set<number>> = {};
  for (const edge of edges) {
    if (!childrenMap[edge.from]) childrenMap[edge.from] = new Set();
    if (!parentsMap[edge.to]) parentsMap[edge.to] = new Set();
    childrenMap[edge.from].add(edge.to);
    parentsMap[edge.to].add(edge.from);
  }

  // Find candidate module groups based on parent/child sets
  for (const [idstr, node] of Object.entries(moduleNodes)) {
    const id = Number(idstr);
    if (node.type !== "single") continue;

    const mod = node.info;
    const parentsSet = parentsMap[mod.id] ?? new Set();
    const childrenSet = childrenMap[mod.id] ?? new Set();

    // Only logic parents of type OR or NOF
    const hasOnlyOrNofParents = Array.from(parentsSet).every((pId) => {
      const pNode = idToNode[pId];
      return (
        pNode &&
        "type" in pNode &&
        (pNode.type === "OR" || pNode.type === "NOF")
      );
    });
    if (!hasOnlyOrNofParents) continue;

    // Unique group key from sorted parents & children IDs
    const groupKey = `${[...parentsSet].sort().join(",")}|${[...childrenSet].sort().join(",")}`;

    if (!moduleGroupCandidates[groupKey]) {
      moduleGroupCandidates[groupKey] = [];
    }
    moduleGroupCandidates[groupKey].push({ id, module: mod });
  }

  const groupedIds = new Set<number>();
  const newEdges: Edge[] = [];

  for (const groupList of Object.values(moduleGroupCandidates)) {
    if (groupList.length <= 1) continue;

    const groupId = groupList[0].id;
    const group: ModuleGroup = {
      list: Object.fromEntries(groupList.map(({ id, module }) => [id, module])),
    };

    // Remove original single nodes
    for (const { id } of groupList) {
      delete moduleNodes[id];
    }

    // Add group node
    moduleNodes[groupId] = { type: "group", info: group };

    // Track grouped IDs
    for (const { module } of groupList) {
      groupedIds.add(module.id);
    }

    // Reconnect edges using sample module's parents and children
    const sample = groupList[0].module;
    const parentIds = Array.from(parentsMap[sample.id] ?? []);
    const childIds = Array.from(childrenMap[sample.id] ?? []);

    // Add new edges to group node
    for (const pId of parentIds) {
      newEdges.push({ from: pId, to: groupId, type: "OPTION" });
    }
    for (const cId of childIds) {
      newEdges.push({ from: groupId, to: cId, type: "HAS_PREREQ" });
    }
  }

  // filter edges once, keeping only those not from OR parents to grouped modules
  const filteredEdges = edges.filter(edge => {
    // Remove edges from OR parents to grouped single modules
    if (groupedIds.has(edge.to)) {
      return false;
    }
    // Remove edges from grouped single modules to any children
    if (groupedIds.has(edge.from)) {
      return false;
    }
    return true;
  });


  // Append new edges for groups
  filteredEdges.push(...newEdges);

  return { moduleNodes, logicNodes, edges: filteredEdges };
}
