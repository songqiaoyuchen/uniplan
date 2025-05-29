// src/utils/graph/formatGraph.ts
// format RawGraph from neo4j to FormattedGraph for easier processing

import {
  RawGraph,
  RawNode,
  RawRelationship,
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

  const idToNode: Record<number, RawNode> = {};
  const childrenMap: Record<number, Set<number>> = {};
  const parentsMap: Record<number, Set<number>> = {};

  for (const node of raw.nodes) {
    idToNode[node.id] = node;

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
    if (!childrenMap[rel.startNode]) childrenMap[rel.startNode] = new Set();
    if (!parentsMap[rel.endNode]) parentsMap[rel.endNode] = new Set();

    childrenMap[rel.startNode].add(rel.endNode);
    parentsMap[rel.endNode].add(rel.startNode);

    edges.push({
      from: rel.startNode,
      to: rel.endNode,
      type: rel.type,
    });
  }

  const moduleGroupCandidates: Record<
    string,
    { id: number; module: Module }[]
  > = {};

  for (const [idstr, node] of Object.entries(moduleNodes)) {
    const id = Number(idstr);
    if (node.type !== "single") continue;

    const mod = node.info;
    const parentsSet = parentsMap[mod.id] ?? new Set();
    const childrenSet = childrenMap[mod.id] ?? new Set();

    // Check: only logic parents of type OR or NOF
    const hasOnlyOrNofParents = Array.from(parentsSet).every(pId => {
      const pNode = idToNode[pId];
      return (
        pNode?.labels.includes("Logic") &&
        (pNode.properties.type === "OR" || pNode.properties.type === "NOF")
      );
    });
    if (!hasOnlyOrNofParents) continue;

    // Generate a unique key based on sorted parent and child IDs
    const groupKey = `${[...parentsSet].sort().join(",")}|${[...childrenSet].sort().join(",")}`;

    if (!moduleGroupCandidates[groupKey]) {
      moduleGroupCandidates[groupKey] = [];
    }
    moduleGroupCandidates[groupKey].push({ id, module: mod });
  }

  const groupedIds = new Set<number>();
  const newEdges: Edge[] = [];

  for (const [groupKey, groupList] of Object.entries(moduleGroupCandidates)) {
    if (groupList.length <= 1) continue; // only group if more than one

    const groupId = groupList[0].id;
    const group: ModuleGroup = {
      list: Object.fromEntries(groupList.map(({ id, module }) => [id, module])),
    };

    // Remove the original single nodes
    for (const { id } of groupList) {
      delete moduleNodes[id];
    }

    // Create a group node
    moduleNodes[groupId] = { type: "group", info: group };

    // Track which IDs were grouped
    for (const { module } of groupList) {
      groupedIds.add(module.id);
    }

    // Reconnect the edges (preserve same parent/child edges for the groupCode)
    const sample = groupList[0].module;
    const parentIds = Array.from(parentsMap[sample.id] ?? []);
    const childIds = Array.from(childrenMap[sample.id] ?? []);

    // Remove all edges from OR nodes to individual modules in the group
    // Identify all OR parents
    const orParentIds = parentIds.filter((pId) => {
      const logicNode = logicNodes[pId];
      return logicNode?.type === "OR";
    });

    // Filter out edges that go from any OR parent to any module in the group
    for (let i = edges.length - 1; i >= 0; i--) {
      const edge = edges[i];
      if (orParentIds.includes(edge.from) && groupedIds.has(edge.to)) {
        edges.splice(i, 1);
      }
    }

    for (const pId of parentIds) {
      newEdges.push({ from: pId, to: groupId, type: "OPTION" });
    }

    for (const cId of childIds) {
      newEdges.push({ from: groupId, to: cId, type: "HAS_PREREQ" });
    }
  }

  edges.push(...newEdges);

  return { moduleNodes, logicNodes, edges };
}
