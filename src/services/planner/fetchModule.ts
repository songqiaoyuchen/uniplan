import { ModuleData } from "@/types/plannerTypes";

export async function fetchModule(code: string): Promise<ModuleData> {
  try {
    const res = await fetch(`/api/module?moduleCode=${encodeURIComponent(code)}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.error || "Failed to fetch module");
    }

    const data: ModuleData = await res.json();
    return data;
  } catch (err: any) {
    // Log or rethrow
    console.error(`❌ fetchModule error for ${code}:`, err);
    throw new Error(err?.message || "Unexpected error while fetching module");
  }
}
