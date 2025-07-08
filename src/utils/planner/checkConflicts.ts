import { ModuleData, ModuleStatus, SemesterLabel } from "@/types/plannerTypes";
/**
 * @path src/utils/planner/checkConflicts.ts
 * @description Marks modules as conflicted if they have exam clashes, invalid semester placements, or preclusions. If a module was previously Conflicted but is no longer conflicted, set its status to Unlocked.
 */

export function checkConflicts(
  modules: Record<string, ModuleData>,
): Record<string, ModuleData> {
  const moduleArray = Object.values(modules);
  const moduleCodes = new Set(moduleArray.map((m) => m.code));

  const examClashModules = new Set<string>();
  const examsBySemester: Record<number, Map<string, string[]>> = {};

  // Step 1: Collect exam times per semester
  for (const mod of moduleArray) {
    if (mod.plannedSemester !== null && mod.exam) {
      const sem = mod.plannedSemester;
      const time = mod.exam.startTime;

      if (!examsBySemester[sem]) examsBySemester[sem] = new Map();
      const map = examsBySemester[sem];

      if (!map.has(time)) map.set(time, []);
      map.get(time)!.push(mod.code);
    }
  }

  // Step 2: Detect exam clashes
  for (const map of Object.values(examsBySemester)) {
    for (const codes of map.values()) {
      if (codes.length > 1) {
        codes.forEach((code) => examClashModules.add(code));
      }
    }
  }

  // Step 3: Update module statuses
  const updatedModules: Record<string, ModuleData> = {};

  for (const [code, mod] of Object.entries(modules)) {
    if (mod.plannedSemester === null) {
      updatedModules[code] = { ...mod }; // unchanged
      continue;
    }

    const actualSem =
      mod.plannedSemester % 2 === 0
        ? SemesterLabel.First
        : SemesterLabel.Second;

    const hasInvalidSemester = !mod.semestersOffered.includes(actualSem);
    const hasExamClash = examClashModules.has(mod.code);
    const hasPreclusion = mod.preclusions.some((p) => moduleCodes.has(p));

    const isConflicted = hasInvalidSemester || hasExamClash || hasPreclusion;

    let newStatus: ModuleStatus | undefined = mod.status;
    if (isConflicted) {
      newStatus = ModuleStatus.Conflicted;
    } else if (mod.status === ModuleStatus.Conflicted) {
      newStatus = ModuleStatus.Unlocked;
    } else {
      newStatus = mod.status ?? undefined;
    }

    updatedModules[code] = {
      ...mod,
      status: newStatus,
    };
  }

  return updatedModules;
}
