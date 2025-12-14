import moduleData from "@/data/moduleData.json";
import modulePrereqInfo from "@/data/modulePrereqInfo.json";
import { PrereqTree as RawPrereqTree } from "@/types/neo4jTypes";
import { PrereqTree } from "@/types/plannerTypes";

type ModuleCodeList = string[];

let moduleCodesCache: ModuleCodeList | null = null;

function getAllModuleCodes(): ModuleCodeList {
  if (moduleCodesCache) return moduleCodesCache;
  moduleCodesCache = (moduleData as { moduleCode: string }[])
    .map((m) => m.moduleCode?.toUpperCase())
    .filter(Boolean);
  return moduleCodesCache;
}

function parseLeaf(raw: string): PrereqTree | null {
  const [rawCode] = raw.split(":");
  const upper = rawCode.toUpperCase();
  const allCodes = getAllModuleCodes();

  if (upper.includes("%")) {
    const prefix = upper.replace(/%/g, "");
    const matches = allCodes.filter((code) => code.startsWith(prefix));
    if (matches.length === 0) return null;
    if (matches.length === 1) return { type: "module", moduleCode: matches[0] };
    return {
      type: "OR",
      children: matches.map((code) => ({ type: "module", moduleCode: code })),
    };
  }

  return { type: "module", moduleCode: upper };
}

function toPlannerPrereq(tree: RawPrereqTree | null): PrereqTree | null {
  if (!tree) return null;

  if (typeof tree === "string") {
    return parseLeaf(tree);
  }

  if ("and" in tree) {
    const children = tree.and
      .map(toPlannerPrereq)
      .filter(Boolean) as PrereqTree[];
    return children.length ? { type: "AND", children } : null;
  }

  if ("or" in tree) {
    const children = tree.or
      .map(toPlannerPrereq)
      .filter(Boolean) as PrereqTree[];
    return children.length ? { type: "OR", children } : null;
  }

  if ("nOf" in tree) {
    const [n, list] = tree.nOf;
    const children = list.map(toPlannerPrereq).filter(Boolean) as PrereqTree[];
    return children.length ? { type: "NOF", n, children } : null;
  }

  return null;
}

export async function getModuleRequires(
  moduleCode: string,
): Promise<PrereqTree | null> {
  const prereqMap = modulePrereqInfo as unknown as Record<string, unknown>;
  const raw = normalizeRawTree(prereqMap[moduleCode.toUpperCase()]);
  return toPlannerPrereq(raw);
}

// Normalize loosely-typed JSON prereq trees into the RawPrereqTree shape
function normalizeRawTree(value: unknown): RawPrereqTree | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") return value;

  if (typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;

  if (Array.isArray(obj.nOf) && obj.nOf.length === 2) {
    const [nRaw, listRaw] = obj.nOf;
    const n = typeof nRaw === "number" ? nRaw : Number(nRaw);
    const list = Array.isArray(listRaw)
      ? (listRaw.map(normalizeRawTree).filter(Boolean) as RawPrereqTree[])
      : [];
    if (Number.isFinite(n) && list.length) return { nOf: [n, list] };
  }

  if (Array.isArray(obj.and)) {
    const children = obj.and
      .map(normalizeRawTree)
      .filter(Boolean) as RawPrereqTree[];
    if (children.length) return { and: children };
  }

  if (Array.isArray(obj.or)) {
    const children = obj.or
      .map(normalizeRawTree)
      .filter(Boolean) as RawPrereqTree[];
    if (children.length) return { or: children };
  }

  return null;
}

