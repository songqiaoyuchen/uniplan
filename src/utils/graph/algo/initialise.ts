import { NormalisedGraph } from '@/types/graphTypes';
import { LogicStatus, PlannerState } from '@/types/graphTypes';
import { isNofNode, isModuleData } from './constants';

export function initialise(graph: NormalisedGraph): PlannerState {
  const availableModules = new Set<string>();
  const completedModules = new Set<string>();
  const logicStatus: Record<string, LogicStatus> = {};
  const satisfiedLogicNodes = new Set<string>();

  // Build adjacency structures for efficient lookup
  const incomingEdges: Record<string, string[]> = {};
  const outgoingEdges: Record<string, string[]> = {};

  for (const edge of graph.edges) {
    incomingEdges[edge.to] = incomingEdges[edge.to] || [];
    incomingEdges[edge.to].push(edge.from);
    
    outgoingEdges[edge.from] = outgoingEdges[edge.from] || [];
    outgoingEdges[edge.from].push(edge.to);
  }

  // Initialize logic nodes
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isNofNode(node)) {
      const requires = node.n || (incomingEdges[id]?.length || 0);
      logicStatus[id] = {
        satisfied: false,
        requires,
        satisfiedCount: 0,
      };
    }
  }

  // Find initially available modules
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      const prereqs = incomingEdges[id] || [];
     const hasUnsatisfiedPrereqs = prereqs.some(prereqId => {
        const prereqNode = graph.nodes[prereqId];
        // Skip if prereq node doesn't exist (dangling edge)
        if (!prereqNode) {
          console.warn(`Warning: Edge points to non-existent node ${prereqId}`);
          return false;
        }
        return isNofNode(prereqNode) && !logicStatus[prereqId].satisfied;
      });
      
      if (!hasUnsatisfiedPrereqs) {
        availableModules.add(node.code);
      }
    }
  }

  return {
    availableModules,
    completedModules,
    logicStatus,
    satisfiedLogicNodes,
  };
}