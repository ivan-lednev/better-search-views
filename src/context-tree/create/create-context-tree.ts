import { CacheItem, FileStats } from "obsidian";
import { ContextTree, createContextTreeProps, TreeType } from "../../types";
import {
  getHeadingBreadcrumbs,
  getHeadingIndexContaining,
} from "../../metadata-cache-util/heading";
import {
  getListBreadcrumbs,
  getListItemIndexContaining,
  getListItemWithDescendants,
  isPositionInList,
} from "../../metadata-cache-util/list";
import {
  getFirstSectionUnder,
  getSectionContaining,
} from "../../metadata-cache-util/section";
import {
  getTextAtPosition,
  isSamePosition,
} from "../../metadata-cache-util/position";
import { formatListWithDescendants } from "../../metadata-cache-util/format";

export function createContextTree({
  positions,
  fileContents,
  stat,
  filePath,
  listItems = [],
  headings = [],
  sections = [],
}: createContextTreeProps) {
  const positionsWithContext = positions.map((position) => {
    return {
      headingBreadcrumbs: getHeadingBreadcrumbs(position.position, headings),
      listBreadcrumbs: getListBreadcrumbs(position.position, listItems),
      sectionCache: getSectionContaining(position.position, sections),
      position,
    };
  });

  // todo: remove cache from file tree
  // @ts-ignore
  const root = createContextTreeBranch("file", {}, stat, filePath, filePath);

  for (const {
    headingBreadcrumbs,
    listBreadcrumbs,
    sectionCache,
    position,
  } of positionsWithContext) {
    let context: ContextTree = root;

    for (const headingCache of headingBreadcrumbs) {
      const headingFoundInChildren = context.branches.find((tree) =>
        isSamePosition(tree.cacheItem.position, headingCache.position)
      );

      if (headingFoundInChildren) {
        context = headingFoundInChildren;
      } else {
        const newContext: ContextTree = createContextTreeBranch(
          "heading",
          headingCache,
          stat,
          filePath,
          headingCache.heading
        );

        context.branches.push(newContext);
        context = newContext;
      }
    }

    for (const listItemCache of listBreadcrumbs) {
      const listItemFoundInChildren = context.branches.find((tree) =>
        isSamePosition(tree.cacheItem.position, listItemCache.position)
      );

      if (listItemFoundInChildren) {
        context = listItemFoundInChildren;
      } else {
        const newListContext: ContextTree = createContextTreeBranch(
          "list",
          listItemCache,
          stat,
          filePath,
          getTextAtPosition(fileContents, listItemCache.position)
        );

        context.branches.push(newListContext);
        context = newListContext;
      }
    }

    // todo: move to metadata-cache-util
    const headingIndexAtPosition = getHeadingIndexContaining(
      position.position,
      headings
    );
    const linkIsInsideHeading = headingIndexAtPosition >= 0;

    if (isPositionInList(position.position, listItems)) {
      const indexOfListItemContainingLink = getListItemIndexContaining(
        position.position,
        listItems
      );
      const listItemCacheWithDescendants = getListItemWithDescendants(
        indexOfListItemContainingLink,
        listItems
      );
      const text = formatListWithDescendants(
        fileContents,
        listItemCacheWithDescendants
      );

      context.sectionsWithMatches.push({
        // TODO: add type to the cache
        // @ts-ignore
        cache: listItemCacheWithDescendants[0],
        text,
        filePath,
      });
    } else if (linkIsInsideHeading) {
      const firstSectionUnderHeading = getFirstSectionUnder(
        position.position,
        sections
      );

      if (firstSectionUnderHeading) {
        context.sectionsWithMatches.push({
          cache: firstSectionUnderHeading,
          text: getTextAtPosition(
            fileContents,
            firstSectionUnderHeading.position
          ),
          filePath,
        });
      }
    } else {
      if (!sectionCache) {
        throw new Error(`No section cache found in ${filePath}`);
      }

      const sectionText = getTextAtPosition(
        fileContents,
        sectionCache.position
      );
      context.sectionsWithMatches.push({
        cache: sectionCache,
        text: sectionText,
        filePath,
      });
    }
  }

  return root;
}

function createContextTreeBranch(
  type: TreeType,
  cacheItem: CacheItem,
  stat: FileStats,
  filePath: string,
  text: string
) {
  return {
    type,
    cacheItem,
    filePath,
    text,
    stat,
    branches: [],
    sectionsWithMatches: [],
  };
}
