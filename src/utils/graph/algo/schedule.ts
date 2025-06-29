import { FormattedGraph } from '@/types/graphTypes';
import { initialise } from './initialise';
import { prioritizeModules } from './prioritise';
import { applySemester } from './update';

const MAX_MCS = 20;

export function runScheduler(graph: FormattedGraph, targetModules: string[]): string[][] {
  const state = initialise(graph);
  const targetSet = new Set(targetModules);
  const plan: string[][] = [];

  while (!isSatisfied(state.completedModules, targetSet)) {
    const prioritized = prioritizeModules(state.availableModules, graph, targetSet);

    const thisSemester: string[] = [];
    let usedMCs = 0;

    for (const mod of prioritized) {
      const node = Object.values(graph.nodes).find(n => n.type === 'single' && (n as any).info.code === mod.code);
      const mc = (node && node.type === 'single' && 'info' in node && node.info.moduleCredit)
        ? parseInt((node as any).info.moduleCredit)
        : 4;

      if (usedMCs + mc <= MAX_MCS) {
        thisSemester.push(mod.code);
        usedMCs += mc;
      }
    }

    applySemester(thisSemester, state, graph);
    plan.push(thisSemester);
  }

  return plan;
}

function isSatisfied(completed: Set<string>, target: Set<string>): boolean {
  for (const code of target) if (!completed.has(code)) return false;
  return true;
}