import { Breadcrumb, ContextTree } from "../types";

export function collapseEmptyNodes(contextTree: ContextTree) {
  function recursive(
    branch: ContextTree,
    breadcrumbsFromParent?: Breadcrumb[]
  ): ContextTree {
    if (
      !branch?.sectionsWithMatches?.length &&
      branch?.branches?.length === 1
    ) {
      const breadcrumbFromBranch = {
        text: branch.text,
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

    // @ts-ignore
    // todo: add breadcrumbs to types
    branch.breadcrumbs = breadcrumbsFromParent;

    return branch;
  }

  contextTree.branches = contextTree?.branches?.map((branch) =>
    recursive(branch)
  );

  return contextTree;
}
