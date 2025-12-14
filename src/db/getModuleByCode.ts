import moduleData from "@/data/moduleData.json";
import { Neo4jModuleData, RawSemesterInfo } from "@/types/neo4jTypes";
import { Exam, ModuleData, SemesterLabel } from "@/types/plannerTypes";

type ModuleIndex = Map<string, ModuleData>;

let moduleIndex: ModuleIndex | null = null;

function parseSemesters(
  semesterData?: RawSemesterInfo[],
): { semestersOffered: SemesterLabel[]; exam: Exam | null } {
  const semestersOffered: SemesterLabel[] = [];
  let exam: Exam | null = null;

  if (!Array.isArray(semesterData)) return { semestersOffered, exam };

  for (const entry of semesterData) {
    switch (entry.semester) {
      case 1:
        semestersOffered.push(SemesterLabel.First);
        break;
      case 2:
        semestersOffered.push(SemesterLabel.Second);
        break;
      case 3:
        semestersOffered.push(SemesterLabel.SpecialTerm1);
        break;
      case 4:
        semestersOffered.push(SemesterLabel.SpecialTerm2);
        break;
      default:
        break;
    }

    if (!exam && entry.examDate) {
      exam = {
        startTime: entry.examDate,
        durationMinutes: Number(entry.examDuration ?? 0),
      };
    }
  }

  return { semestersOffered, exam };
}

function mapStaticModule(raw: Neo4jModuleData): ModuleData {
  const { semestersOffered, exam } = parseSemesters(raw.semesterData);

  const preclusions: string[] = [];
  if (typeof raw.preclusion === "string") {
    const matches = raw.preclusion.match(/\b[A-Z]{2,3}\d{4}[A-Z]?\b/g);
    if (matches) preclusions.push(...matches);
  }

  return {
    id: raw.moduleCode.toUpperCase(),
    code: raw.moduleCode.toUpperCase(),
    title: raw.title?.trim() ?? "Untitled Module",
    credits: Number.parseInt(raw.moduleCredit ?? "0", 10),
    semestersOffered,
    exam,
    preclusions,
    description: raw.description || undefined,
    faculty: raw.faculty || undefined,
    department: raw.department || undefined,
  };
}

function getModuleIndex(): ModuleIndex {
  if (moduleIndex) return moduleIndex;

  const index: ModuleIndex = new Map();
  const rawList = moduleData as Neo4jModuleData[];

  for (const raw of rawList) {
    const mapped = mapStaticModule(raw);
    index.set(mapped.code, mapped);
  }

  moduleIndex = index;
  return index;
}

export async function getModuleByCode(
  moduleCode: string,
): Promise<ModuleData | null> {
  const code = moduleCode.toUpperCase();
  const module = getModuleIndex().get(code) ?? null;
  return module;
}
