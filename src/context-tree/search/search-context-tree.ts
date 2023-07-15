import {AnyTree} from "../../ui/solid/tree";

function includesIgnoreCase(str: string, substr: string) {
  return str.toLowerCase().includes(substr.toLowerCase());
}

export function searchContextTree(tree: AnyTree, filter: string) {
  if (includesIgnoreCase(tree.text, filter)) {
    return tree;
  }

  tree.sectionsWithMatches = tree.sectionsWithMatches.filter((section) =>
    includesIgnoreCase(section.text, filter)
  );

  if (tree.sectionsWithMatches.length > 0) {
    return tree;
  }

  // todo: remove when headingCache is removed
  // @ts-ignore
  tree.childLists = tree?.childLists
    ?.map((list) => searchContextTree(list, filter))
    .filter(Boolean);

  // todo: remove when headingCache is removed
  // @ts-ignore
  tree.childHeadings = tree?.childHeadings
    ?.map((heading) => searchContextTree(heading, filter))
    .filter(Boolean);

  if (tree.childHeadings?.length > 0 || tree.childLists?.length > 0) {
    return tree;
  }

  return null;
}
