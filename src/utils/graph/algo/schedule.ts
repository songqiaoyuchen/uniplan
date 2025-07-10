import { NormalisedGraph } from '@/types/graphTypes';
import { initialise } from './initialise';
import { prioritizeModules } from './prioritise';
import { applySemester } from './update';
import { isModuleData, MAX_MCS_PER_SEMESTER, MAX_SEMESTERS } from './constants';
import { TimetableData } from '@/types/graphTypes';

export function runScheduler(
  graph: NormalisedGraph,
  targetModules: string[] = [],
): TimetableData[] {
    // Validate graph integrity
  const missingNodes = new Set<string>();
  for (const edge of graph.edges) {
    if (!graph.nodes[edge.from]) {
      missingNodes.add(edge.from);
    }
    if (!graph.nodes[edge.to]) {
      missingNodes.add(edge.to);
    }
  }
  
  if (missingNodes.size > 0) {
    console.warn(`Warning: Graph has edges pointing to non-existent nodes:`, Array.from(missingNodes));
  }
  
  const state = initialise(graph);
  const targetSet = new Set(targetModules);
  
  // If no targets specified, find end goals (modules with no outgoing edges)
  // if (targetModules.length === 0) {
  //   const endGoals = findEndGoals(graph);
  //   endGoals.forEach(goal => targetSet.add(goal));
  // }
  
  const plan: TimetableData[] = [];

  for (let semester = 1; semester <= MAX_SEMESTERS; semester++) {
    if (isSatisfied(state.completedModules, targetSet)) {
      console.log(`All target modules satisfied by semester ${semester - 1}.`);
      console.log("Completed modules:", Array.from(state.completedModules));
      for (let i = 0; i < semester - 1; i++) {
        console.log(`Semester ${i + 1}:`, plan.filter(m => m.semester === i + 1).map(m => m.code));
      }
      break;
    }

    const prioritized = prioritizeModules(
      state.availableModules,
      graph,
      targetSet,
      state.completedModules,
    );

    const thisSemester: string[] = [];
    let usedMCs = 0;

    for (const mod of prioritized) {
      const node = graph.nodes[mod.nodeId];
      if (!isModuleData(node)) continue;
      
      const mc = node.credits || 4;

      if (usedMCs + mc <= MAX_MCS_PER_SEMESTER) {
        thisSemester.push(mod.code);
        usedMCs += mc;
      }
    }

    if (thisSemester.length === 0) {
      console.warn("No modules can be scheduled. Check for circular dependencies.");
      break;
    }

    // Add modules to plan with their semester number
    for (const code of thisSemester) {
      plan.push({ code, semester });
    }

    applySemester(thisSemester, state, graph);
  }

  return plan;
}

// function findEndGoals(graph: NormalisedGraph): string[] {
//   const hasOutgoing = new Set<string>();
  
//   for (const edge of graph.edges) {
//     hasOutgoing.add(edge.from);
//   }
  
//   const endGoals: string[] = [];
//   for (const [id, node] of Object.entries(graph.nodes)) {
//     if (isModuleData(node) && !hasOutgoing.has(id)) {
//       endGoals.push(node.code);
//     }
//   }
  
//   return endGoals;
// }

function isSatisfied(completed: Set<string>, target: Set<string>): boolean {
  for (const code of target) {
    if (!completed.has(code)) return false;
  }
  return true;
}