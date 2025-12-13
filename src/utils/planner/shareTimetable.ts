// utils/serializeTimetable.ts
import type { TimetableSliceState, Semester } from "@/store/timetableSlice";
import type { TimetableSnapshot } from "@/types/plannerTypes";

export function serializeTimetable(
  modules: TimetableSliceState["modules"],
  semesters: TimetableSliceState["semesters"]
): TimetableSnapshot {
  // 1. semesters → string[][]
  const orderedSemesters = Object.values(semesters.entities)
    .filter(Boolean)
    .sort((a, b) => a!.id - b!.id)
    .map(s => [...s!.moduleCodes]);

  // 2. tags
  const tags: Record<string, string[]> = {};
  Object.values(modules.entities).forEach(mod => {
    if (mod?.tags?.length) {
      tags[mod.code] = [...mod.tags];
    }
  });

  return {
    version: 1,
    semesters: orderedSemesters,
    tags,
  };
}
