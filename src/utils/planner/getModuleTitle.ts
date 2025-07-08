import miniData from '@/data/miniModuleData.json';
import { MiniModuleData } from '@/types/plannerTypes';

// Build a lookup map (code → title)
const titleMap: Record<string, string> = {};
for (const mod of miniData as MiniModuleData[]) {
  titleMap[mod.code.toUpperCase()] = mod.title;
}

export function getModuleTitle(code: string): string | null {
  return titleMap[code.toUpperCase()] ?? null;
}
