export async function fetchModuleTitle(code: string): Promise<string> {
  try {
    const res = await fetch(`/api/module-title/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error("Failed to fetch title");

    const data = await res.json();
    return data.title ?? code;
  } catch (err) {
    console.error("fetchModuleTitle error:", err);
    return code; // Fallback
  }
}
