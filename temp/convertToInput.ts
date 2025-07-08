type RawNode = {
  id: number;
  labels: string[];
  properties: {
    code?: string;
    type?: "AND" | "OR" | "NOF";
    threshold?: number;
    offeredIn?: number[];
  };
};

type RawEdge = {
  startNode: number;
  endNode: number;
  type: "HAS_PREREQ" | "OPTION" | "REQUIRES";
};

export type LogicNode =
  | { type: "AND" | "OR"; children: (LogicNode | string)[] }
  | { type: "NOF"; threshold: number; children: (LogicNode | string)[] };

type SchedulingInput = {
  moduleMap: Map<string, { code: string; offeredIn: number[] }>;
  dependencies: Map<string, LogicNode[]>;
  targets: string[];
};

export function convertToSchedulingInput(
  nodes: RawNode[],
  edges: RawEdge[],
  targetCodes: string[],
): SchedulingInput {
  const idToCode = new Map<number, string>();
  const moduleMap = new Map<string, { code: string; offeredIn: number[] }>();
  const logicDefs = new Map<
    number,
    { type: "AND" | "OR" | "NOF"; threshold: number }
  >();
  const logicToChildren = new Map<number, number[]>();
  const moduleToLogic = new Map<number, number[]>();

  for (const node of nodes) {
    if (node.labels.includes("Module") && node.properties.code) {
      idToCode.set(node.id, node.properties.code);
      moduleMap.set(node.properties.code, {
        code: node.properties.code,
        offeredIn: node.properties.offeredIn ?? [1, 2, 3, 4],
      });
    } else if (node.labels.includes("Logic") && node.properties.type) {
      logicDefs.set(node.id, {
        type: node.properties.type,
        threshold: node.properties.threshold ?? 1,
      });
    }
  }

  for (const edge of edges) {
    if (edge.type === "HAS_PREREQ") {
      if (idToCode.has(edge.startNode) && logicDefs.has(edge.endNode)) {
        moduleToLogic.set(edge.startNode, [
          ...(moduleToLogic.get(edge.startNode) ?? []),
          edge.endNode,
        ]);
      }
    } else if (edge.type === "OPTION" || edge.type === "REQUIRES") {
      logicToChildren.set(edge.startNode, [
        ...(logicToChildren.get(edge.startNode) ?? []),
        edge.endNode,
      ]);
    }
  }

  function buildLogicTree(logicId: number): LogicNode {
    const def = logicDefs.get(logicId);
    if (!def) throw new Error(`Missing logic definition for ${logicId}`);

    const rawChildren = logicToChildren.get(logicId) ?? [];
    const children: (LogicNode | string)[] = rawChildren.map((childId) => {
      if (idToCode.has(childId)) return idToCode.get(childId)!;
      else return buildLogicTree(childId); // recurse
    });

    if (def.type === "NOF") {
      return { type: "NOF", threshold: def.threshold, children };
    } else {
      return { type: def.type, children };
    }
  }

  const dependencies = new Map<string, LogicNode[]>();
  for (const [moduleId, logicIds] of moduleToLogic.entries()) {
    const code = idToCode.get(moduleId);
    if (!code) continue;
    dependencies.set(code, logicIds.map(buildLogicTree));
  }

  return { moduleMap, dependencies, targets: targetCodes };
}
