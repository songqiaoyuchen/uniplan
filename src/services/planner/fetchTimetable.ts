import { ModuleData } from "@/types/plannerTypes";

export async function fetchTimetable(): Promise<ModuleData[]> {
  try {
    const res = await fetch(
      `/api/timetable`,
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || "Failed to fetch timetable");
    }

    const data: ModuleData[] = await res.json();
    return data;
  } catch (err: any) {
    console.error(`❌ fetchTimetable error for sample data:`, err);
    throw new Error(err?.message || "Unexpected error while fetching timetable");
  }
}
