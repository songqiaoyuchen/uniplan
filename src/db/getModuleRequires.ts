import { parseStaticPrereq } from "@/utils/planner/parseStaticPrereq";
import { PrereqTree } from "@/types/plannerTypes";
import modulePrereqInfo from "@/data/modulePrereqInfo.json";

export async function getModuleRequires(
  moduleCode: string,
): Promise<PrereqTree | null> {
  // Use static data instead of database query to avoid large graph traversals
  const prereqData = (modulePrereqInfo as Record<string, any>)[moduleCode];
  return parseStaticPrereq(prereqData);
}

