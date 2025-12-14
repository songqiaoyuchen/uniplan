import { ModuleData, SemesterLabel } from "@/types/plannerTypes";
import moduleDataArray from "@/data/moduleData.json";
import { getModuleRequires } from "./getModuleRequires";

export async function getModuleByCode(
  moduleCode: string,
): Promise<ModuleData | null> {
  // Use static data instead of database query
  const rawModule = (moduleDataArray as any[]).find((m: any) => m.moduleCode === moduleCode);
  
  if (!rawModule) {
    return null;
  }

  // Transform raw module data to match ModuleData type
  const module: ModuleData = {
    id: "", // neo4j node id not available in static data
    code: rawModule.moduleCode,
    title: rawModule.title,
    credits: parseInt(rawModule.moduleCredit || "0", 10),
    semestersOffered: rawModule.semesterData?.map((s: any) => s.semester as SemesterLabel) || [],
    exam: null, // Not in static data
    preclusions: [],
    description: rawModule.description,
    faculty: rawModule.faculty,
    department: rawModule.department,
  };

  // Fetch and attach prerequisites
  const requires = await getModuleRequires(moduleCode);
  if (requires) {
    module.requires = requires;
  }

  return module;
}
