import { CacheItem, FileStats, HeadingCache, ListItemCache } from "obsidian";
import {
  createContextTreeProps,
  FileContextTree,
  FileTree,
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
  Tree,
  TreeType,
  TreeWithoutCache,
} from "../types";
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

  const root = createFileContextTree(filePath, stat);

  for (const {
    headingBreadcrumbs,
    listBreadcrumbs,
    sectionCache,
    position,
  } of positionsWithContext) {
    let context: TreeWithoutCache = root;

    for (const headingCache of headingBreadcrumbs) {
      const headingFoundInChildren = context.branches.find((tree) =>
        isSamePosition(tree.cacheItem.position, headingCache.position)
      );

      if (headingFoundInChildren) {
        context = headingFoundInChildren;
      } else {
        const newContext: Tree = createContextTreeBranch(
          "heading",
          headingCache,
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
        const newListContext: Tree = createContextTreeBranch(
          "list",
          listItemCache,
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
        // todo: replace with cacheItem with more generic type
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

function createFileContextTree(filePath: string, stat: FileStats): FileTree {
  return {
    type: "file",
    text: filePath,
    filePath,
    stat,
    sectionsWithMatches: [],
    branches: [],
  };
}

function createContextTreeBranch(
  type: TreeType,
  cacheItem: CacheItem,
  filePath: string,
  text: string
) {
  return {
    type,
    cacheItem,
    filePath,
    text,
    branches: [],
    sectionsWithMatches: [],
  };
}
