// utils/planner/flattenPrereqTree.ts
import { PrereqTree } from "@/types/plannerTypes";

export function flattenPrereqTree(tree: PrereqTree | undefined): Set<string> {
  const result = new Set<string>();
  if (!tree) return result;

  function traverse(node: PrereqTree) {
    if (node.type === "module") {
      result.add(node.moduleCode);
    } else if ("children" in node) {
      node.children.forEach(traverse);
    }
  }

  traverse(tree);
  return result;
}
