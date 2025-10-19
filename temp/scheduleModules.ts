// A LogicNode represents a logic gate (AND, OR, or NOF) that governs how prerequisites are satisfied.
// - `children` can be module codes (string) or nested LogicNodes
// - `threshold` is used only for NOF(n) gates: at least n of the children must be satisfied
type LogicNode = {
  type: "AND" | "OR" | "NOF";
  children: (LogicNode | string)[];
  threshold?: number;
};

// The structure of the input to the scheduler.
// - moduleMap: contains metadata about each module, including its offered semesters.
// - dependencies: logic gates required to unlock each module.
// - targets: the final modules the user wants to take.
type SchedulingInput = {
  moduleMap: Map<string, { code: string; offeredIn: number[] }>;
  dependencies: Map<string, LogicNode[]>;
  targets: string[];
};

// The result type: maps semester number → list of modules scheduled in that semester
type ScheduleResult = Record<number, string[]>;

// Given a logic gate and a set of already scheduled modules,
// returns whether the gate's condition is currently satisfied.
function evaluateGate(gate: LogicNode, scheduled: Set<string>): boolean {
  const evalChild = (c: LogicNode | string) =>
    typeof c === "string" ? scheduled.has(c) : evaluateGate(c, scheduled);

  if (gate.type === "AND") return gate.children.every(evalChild);
  if (gate.type === "OR") return gate.children.some(evalChild);
  if (gate.type === "NOF") {
    const count = gate.children.filter(evalChild).length;
    return count >= gate.threshold!;
  }
  return false;
}

// Returns the minimal set of modules required to unlock the target modules,
// based on logic gates. This avoids over-scheduling optional branches.
function collectAllRequiredModules(input: SchedulingInput): Set<string> {
  const picked = new Set<string>(); // Set of all modules we know are needed
  const visited = new Set<string>(); // To prevent infinite loops in cyclic graphs (shouldn't happen)

  // Recursively mark a module and all of its minimally-required dependencies
  function dfs(mod: string) {
    if (visited.has(mod)) return;
    visited.add(mod);
    picked.add(mod);

    const gates = input.dependencies.get(mod) ?? [];
    for (const gate of gates) {
      for (const child of flattenGate(gate)) {
        dfs(child);
      }
    }
  }

  // Flatten a gate into the minimal set of module codes needed to satisfy it
  function flattenGate(gate: LogicNode): string[] {
    const result: string[] = [];

    const pick = (node: LogicNode | string) => {
      if (typeof node === "string") {
        result.push(node);
      } else {
        result.push(...flattenGate(node));
      }
    };

    if (gate.type === "AND") {
      // All children are required
      for (const child of gate.children) pick(child);
    } else if (gate.type === "OR") {
      // Pick only one branch (the first one) to minimize scheduling
      if (gate.children.length > 0) pick(gate.children[0]);
    } else if (gate.type === "NOF") {
      // Pick just enough branches (n children) to satisfy the threshold
      const n = gate.threshold ?? gate.children.length;
      for (let i = 0; i < Math.min(n, gate.children.length); i++) {
        pick(gate.children[i]);
      }
    }

    return result;
  }

  for (const mod of input.targets) dfs(mod);
  return picked;
}

// Main scheduler function
export function scheduleModules(
  input: SchedulingInput,
  maxPerSem: number, // max number of modules allowed per semester
  totalSems: number, // how many semesters to plan for (typically 16 = 4 years × 4 terms)
): ScheduleResult | null {
  const scheduled = new Set<string>(); // Modules that have been scheduled so far
  const result: ScheduleResult = {}; // Final plan: semester number → list of modules
  const required = collectAllRequiredModules(input); // Get the minimal required set of modules

  // Loop through each semester
  for (let sem = 1; sem <= totalSems; sem++) {
    let count = 0; // how many modules we've scheduled in this semester
    result[sem] = [];
    const term = ((sem - 1) % 4) + 1; // 1–4 to match offeredIn format

    // Try to schedule any module that:
    // - is required
    // - is not already scheduled
    // - is offered this term
    // - has all logic gates satisfied
    for (const mod of required) {
      if (scheduled.has(mod)) continue;

      const meta = input.moduleMap.get(mod);
      if (!meta || !meta.offeredIn.includes(term)) continue;

      const gates = input.dependencies.get(mod) ?? [];
      const canSchedule = gates.every((g) => evaluateGate(g, scheduled));

      if (canSchedule && count < maxPerSem) {
        scheduled.add(mod);
        result[sem].push(mod);
        count++;
      }
    }
  }

  // After scheduling, check if any required module could not be placed.
  const trulyRequired = collectAllRequiredModules(input); // recompute for safety
  const unscheduled = [...trulyRequired].filter((m) => !scheduled.has(m));

  if (unscheduled.length > 0) {
    console.warn("Some required modules could not be scheduled:", unscheduled);
    // ⚠️ Do not abort — just return partial result
  }

  return result;
}
