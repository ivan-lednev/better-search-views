import { FileStats, HeadingCache, ListItemCache, Stat } from "obsidian";
import {
  createContextTreeProps,
  FileContextTree,
  HeadingContextTree,
  ListContextTree,
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
  const linksWithContext = positions.map((link) => {
    return {
      headingBreadcrumbs: getHeadingBreadcrumbs(link.position, headings),
      listBreadcrumbs: getListBreadcrumbs(link.position, listItems),
      sectionCache: getSectionContaining(link.position, sections),
      link,
    };
  });

  const root = createFileContextTree(filePath, stat);

  for (const {
    headingBreadcrumbs,
    listBreadcrumbs,
    sectionCache,
    link,
  } of linksWithContext) {
    let context = root;

    for (const headingCache of headingBreadcrumbs) {
      const headingFoundInChildren = context.childHeadings.find((tree) =>
        isSamePosition(tree.headingCache.position, headingCache.position)
      );

      if (headingFoundInChildren) {
        // todo: remove
        // @ts-ignore
        context = headingFoundInChildren;
      } else {
        const newHeadingContext: HeadingContextTree = createHeadingContextTree(
          headingCache,
          filePath
        );

        context.childHeadings.push(newHeadingContext);
        // todo: remove
        // @ts-ignore
        context = newHeadingContext;
      }
    }

    for (const listItemCache of listBreadcrumbs) {
      const listItemFoundInChildren = context.childLists.find((tree) =>
        isSamePosition(tree.listItemCache.position, listItemCache.position)
      );

      if (listItemFoundInChildren) {
        // todo: fix
        // @ts-ignore
        context = listItemFoundInChildren;
      } else {
        const newListContext: ListContextTree = createListContextTree(
          listItemCache,
          getTextAtPosition(fileContents, listItemCache.position),
          filePath
        );

        context.childLists.push(newListContext);
        // todo: fix
        // @ts-ignore
        context = newListContext;
      }
    }

    // todo: move to metadata-cache-util
    const headingIndexAtPosition = getHeadingIndexContaining(
      link.position,
      headings
    );
    const linkIsInsideHeading = headingIndexAtPosition >= 0;

    if (isPositionInList(link.position, listItems)) {
      const indexOfListItemContainingLink = getListItemIndexContaining(
        link.position,
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
        // todo: fix
        // @ts-ignore
        cache: listItemCacheWithDescendants[0],
        text,
        filePath,
      });
    } else if (linkIsInsideHeading) {
      const firstSectionUnderHeading = getFirstSectionUnder(
        link.position,
        sections
      );

      context.sectionsWithMatches.push({
        cache: firstSectionUnderHeading,
        text: getTextAtPosition(
          fileContents,
          firstSectionUnderHeading.position
        ),
        filePath,
      });
    } else {
      context.sectionsWithMatches.push({
        cache: sectionCache,
        text: getTextAtPosition(fileContents, sectionCache.position),
        filePath,
      });
    }
  }

  return root;
}

function createFileContextTree(
  filePath: string,
  stat: FileStats
): FileContextTree {
  return {
    text: filePath,
    filePath,
    stat,
    sectionsWithMatches: [],
    childLists: [],
    childHeadings: [],
  };
}

function createHeadingContextTree(
  headingCache: HeadingCache,
  filePath: string
): HeadingContextTree {
  return {
    headingCache,
    text: headingCache.heading,
    filePath,
    sectionsWithMatches: [],
    childHeadings: [], // todo: we can already push all the children here
    childLists: [],
  };
}

function createListContextTree(
  listItemCache: ListItemCache,
  text: string,
  filePath: string
): ListContextTree {
  return {
    text,
    listItemCache,
    filePath,
    sectionsWithMatches: [],
    childLists: [],
  };
}
