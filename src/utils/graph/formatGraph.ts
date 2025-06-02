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
import { mergeModules } from './mergeModules';

export function formatGraph(raw: RawGraph): FormattedGraph {
  const moduleNodes: Record<string, ModuleNode> = {};
  const logicNodes: Record<string, LogicNode> = {};
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
      logicNodes[node.id] = {
        id: node.id,
        requires: node.properties.threshold,
      };
    }
  }

  for (const rel of raw.relationships) {
    edges.push({
      from: rel.startNode,
      to: rel.endNode,
    });
  }

  return mergeModules({moduleNodes, logicNodes, edges});
}
