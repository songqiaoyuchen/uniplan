import { FormattedGraph } from '@/types/graphTypes';
import { LogicStatus, PlannerState} from '@/types/graphTypes';
import { LogicNode } from '@/types/graphTypes';

export function initialise(graph: FormattedGraph): PlannerState {
  const availableModules = new Set<string>();
  const completedModules = new Set<string>(); // optional: if you prefill known completed modules
  const logicStatus: Record<string, LogicStatus> = {};

  const incomingEdgesCount: Record<string, number> = {};

  // Step 1: Count incoming edges for each node
  for (const edge of graph.relationships) {
    incomingEdgesCount[edge.to] = (incomingEdgesCount[edge.to] || 0) + 1;
  }

  // Step 2: Process each node
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (node instanceof LogicNode) {
      logicStatus[id] = {
        satisfied: false,
        requires: node.requires,
        satisfiedCount: 0,
      };
    } else if (node.type === "single") {
      const moduleCode = node.info.code;
      const hasPrereqs = incomingEdgesCount[id] > 0;

      if (!hasPrereqs) {
        availableModules.add(moduleCode);
      }
    } else {
      // Module groups are not handled in this function yet
      console.warn(`Unknown node type for ${id}: ${node.type}`);
    }
  }

  return {
    availableModules,
    completedModules,
    logicStatus,
  };
}
