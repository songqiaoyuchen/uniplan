import { PrereqTree } from "@/types/plannerTypes";

type StaticPrereqNode =
  | string
  | { and: StaticPrereqNode[] }
  | { or: StaticPrereqNode[] }
  | { nOf: [number, StaticPrereqNode[]] };

/**
 * Parse prerequisite data from static JSON format to PrereqTree format
 * @param data - The prerequisite data from modulePrereqInfo.json
 * @returns PrereqTree or null if no prerequisites
 */
export function parseStaticPrereq(data: StaticPrereqNode | null | undefined): PrereqTree | null {
  if (!data) {
    return null;
  }

  // Handle string (single module code)
  if (typeof data === "string") {
    // Remove grade suffix (e.g., ":D") if present
    const moduleCode = data.split(":")[0];
    return { type: "module", moduleCode };
  }

  // Handle AND logic
  if ("and" in data) {
    const children = data.and.map(parseStaticPrereq).filter((c): c is PrereqTree => c !== null);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    return { type: "AND", children };
  }

  // Handle OR logic
  if ("or" in data) {
    const children = data.or.map(parseStaticPrereq).filter((c): c is PrereqTree => c !== null);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0];
    return { type: "OR", children };
  }

  // Handle N-OF logic
  if ("nOf" in data) {
    const [n, items] = data.nOf;
    const children = items.map(parseStaticPrereq).filter((c): c is PrereqTree => c !== null);
    if (children.length === 0) return null;
    // Keep NOF wrapper even with 1 child to show "at least N of" requirement
    return { type: "NOF", n, children };
  }

  return null;
}
