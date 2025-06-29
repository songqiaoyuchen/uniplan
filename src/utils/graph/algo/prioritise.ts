import { FormattedGraph } from '@/types/graphTypes';

type ScoredModule = {
  code: string;
  score: number;
};

export function prioritizeModules(
  available: Set<string>,
  graph: FormattedGraph,
  targetModules: Set<string>
): ScoredModule[] {
  const scores: ScoredModule[] = [];

  for (const modCode of available) {
    const urgency = computeUrgency(modCode, targetModules);
    const impact = computeImpact(modCode, graph);
    const efficiency = computeEfficiency(modCode, graph);
    const score = urgency * 0.4 + impact * 0.4 + efficiency * 0.2;
    scores.push({ code: modCode, score });
  }

  return scores.sort((a, b) => b.score - a.score);
}

// Dummy placeholders
function computeUrgency(code: string, target: Set<string>): number { return Math.random(); }
function computeImpact(code: string, graph: FormattedGraph): number { return Math.random(); }
function computeEfficiency(code: string, graph: FormattedGraph): number { return Math.random(); }