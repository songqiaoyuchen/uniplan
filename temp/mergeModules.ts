/**
 * @path src/utils/graph/mergeModules.ts
 * @param graph: FormattedGraph
 * @returns graph with equivalent modules merged to a ModuleGroup: FormattedGraph
 * @description merge equivalent modules into a ModuleGroup,
 * modules are considered equivalent if they have the same parents and children
 */

import { Edge, Module, ModuleGroup, FormattedGraph } from "@/types/graphTypes";

import crypto from "crypto";
import { v4 as uuid } from "uuid";

export function mergeModules(graph: FormattedGraph): FormattedGraph {
  const { nodes, edges } = graph;

  const moduleGroupCandidates: Record<string, Module[]> = {};

  // Build parent/child maps
  const childrenMap: Record<string, Set<string>> = {};
  const parentsMap: Record<string, Set<string>> = {};
  for (const edge of edges) {
    if (!childrenMap[edge.from]) childrenMap[edge.from] = new Set();
    if (!parentsMap[edge.to]) parentsMap[edge.to] = new Set();
    childrenMap[edge.from].add(edge.to);
    parentsMap[edge.to].add(edge.from);
  }

  // Find candidate module groups based on parent/child sets
  for (const [_, node] of Object.entries(nodes)) {
    if (node.type !== "single") continue;
    const mod = node.info;

    // retrieve parents and children sets from maps
    const parentsSet = parentsMap[mod.id] ?? new Set();
    const childrenSet = childrenMap[mod.id] ?? new Set();

    // Unique group key from sorted parents & children IDs
    const keyString = `${[...parentsSet].sort().join(",")}|${[...childrenSet].sort().join(",")}`;
    const groupKey = crypto
      .createHash("sha256")
      .update(keyString)
      .digest("hex");

    if (!moduleGroupCandidates[groupKey]) {
      moduleGroupCandidates[groupKey] = [];
    }
    moduleGroupCandidates[groupKey].push(mod);
  }

  const groupedIds = new Set<string>();
  const newEdges: Edge[] = [];

  for (const groupList of Object.values(moduleGroupCandidates)) {
    if (groupList.length <= 1) continue;

    const groupId = uuid();
    const group: ModuleGroup = {
      list: groupList,
    };

    // Remove original single nodes
    for (const { id } of groupList) {
      delete nodes[id];
    }

    // Add group node
    nodes[groupId] = { id: groupId, type: "group", info: group };

    // Track grouped IDs
    for (const module of groupList) {
      groupedIds.add(module.id);
    }

    // Reconnect edges using sample module's parents and children
    const sample = groupList[0];
    const parentIds = Array.from(parentsMap[sample.id] ?? []);
    const childIds = Array.from(childrenMap[sample.id] ?? []);

    // Add new edges to group node
    for (const pId of parentIds) {
      newEdges.push({ id: uuid(), from: pId, to: groupId });
    }
    for (const cId of childIds) {
      newEdges.push({ id: uuid(), from: groupId, to: cId });
    }
  }

  // filter edges once, keeping only those not from OR parents to grouped modules
  const filteredEdges = edges.filter((edge) => {
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

  return { nodes: nodes, edges: filteredEdges };
}
