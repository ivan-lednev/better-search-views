import { Breadcrumb, CollapsedContextTree, ContextTree } from "../../types";

export function collapseEmptyNodes(contextTree: ContextTree) {
  function recursive(
    branch: ContextTree,
    breadcrumbsFromParent?: Breadcrumb[]
  ): CollapsedContextTree {
    if (
      !branch?.sectionsWithMatches?.length &&
      branch?.branches?.length === 1
    ) {
      const breadcrumbFromBranch = {
        text: branch.text,
        type: branch.type,
        position: branch.cacheItem.position,
      };

      if (breadcrumbsFromParent) {
        breadcrumbsFromParent.push(breadcrumbFromBranch);
      }
      const breadcrumbs = breadcrumbsFromParent
        ? breadcrumbsFromParent
        : [breadcrumbFromBranch];

      return recursive(branch.branches[0], breadcrumbs);
    }

    branch.branches = branch.branches.map((branch) => recursive(branch));

    return { ...branch, breadcrumbs: breadcrumbsFromParent };
  }

  contextTree.branches = contextTree?.branches?.map((branch) =>
    recursive(branch)
  );

  return contextTree;
}
