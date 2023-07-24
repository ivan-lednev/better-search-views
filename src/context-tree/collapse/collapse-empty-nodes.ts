import { CollapsedContextTree } from "../../types";

export function collapseEmptyNodes(
  tree: CollapsedContextTree
): CollapsedContextTree {
  if (!tree?.sectionsWithMatches?.length && tree.branches.length === 1) {
    const firstBranch = tree.branches[0];

    const breadcrumb = {
      text: firstBranch.text,
      type: firstBranch.type,
      position: firstBranch.cacheItem?.position,
    };

    return collapseEmptyNodes({
      ...tree,
      branches: firstBranch.branches,
      breadcrumbs: [...(tree.breadcrumbs || []), breadcrumb],
      sectionsWithMatches: firstBranch.sectionsWithMatches,
    });
  }

  return { ...tree, branches: tree.branches.map(collapseEmptyNodes) };
}
