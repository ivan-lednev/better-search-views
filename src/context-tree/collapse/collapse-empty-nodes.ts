import { HeadingContextTree, ListContextTree } from "../types";
import { AnyTree } from "../../../solid/tree";

export function collapseEmptyNodes(contextTree: AnyTree) {
  function recursiveHeadings(
    branch: HeadingContextTree,
    breadcrumbsFromParent?: string[]
  ): HeadingContextTree {
    branch.childLists = branch?.childLists?.map((l) => recursiveLists(l));

    if (
      !branch?.sectionsWithMatches?.length &&
      !branch?.childLists?.length &&
      branch?.childHeadings?.length === 1
    ) {
      if (breadcrumbsFromParent) {
        breadcrumbsFromParent.push(branch.text);
      }
      const breadcrumbs = breadcrumbsFromParent
        ? breadcrumbsFromParent
        : [branch.text];

      return recursiveHeadings(branch.childHeadings[0], breadcrumbs);
    }

    branch.childHeadings = branch.childHeadings.map((h) =>
      recursiveHeadings(h)
    );

    // @ts-ignore
    branch.breadcrumbs = breadcrumbsFromParent;

    return branch;
  }

  function recursiveLists(
    branch: ListContextTree,
    breadcrumbsFromParent?: string[]
  ): ListContextTree {
    if (
      !branch?.sectionsWithMatches?.length &&
      branch?.childLists?.length === 1
    ) {
      if (breadcrumbsFromParent) {
        breadcrumbsFromParent.push(branch.text);
      }
      const breadcrumbs = breadcrumbsFromParent
        ? breadcrumbsFromParent
        : [branch.text];

      return recursiveLists(branch.childLists[0], breadcrumbs);
    }

    branch.childLists = branch?.childLists?.map((l) => recursiveLists(l));

    // @ts-ignore
    branch.breadcrumbs = breadcrumbsFromParent;

    return branch;
  }

  // todo: this is a hack
  contextTree &&
    (contextTree.childHeadings = contextTree?.childHeadings?.map((h) =>
      recursiveHeadings(h)
    ));

  // todo: this is a hack
  contextTree &&
    (contextTree.childLists = contextTree?.childLists?.map((l) =>
      recursiveLists(l)
    ));
  return contextTree;
}
