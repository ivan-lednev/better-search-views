import {
  CacheItem,
  FileStats,
  HeadingCache,
  LinkCache,
  ListItemCache,
  Pos,
  SectionCache,
} from "obsidian";

export interface createContextTreeProps {
  // todo: better naming. Separate metadata cache?
  // todo: this is backlinks. Make it clear that this comes from target, and the other three from referrer
  positions: LinkCache[];
  stat: FileStats;
  fileContents: string;
  filePath: string;
  listItems?: ListItemCache[];
  headings?: HeadingCache[];
  sections?: SectionCache[];
}

export interface SectionWithMatch {
  text: string;
  cache: SectionCache;
  filePath: string;
  match?: { position: Pos };
}

export interface WithListChildren {
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists: ListContextTree[];
}

export interface WithAnyChildren extends WithListChildren {
  childHeadings: HeadingContextTree[];
  branches;
}

export interface FileContextTree extends WithAnyChildren {
  filePath?: string;
  stat: FileStats;
}

export interface HeadingContextTree extends WithAnyChildren {
  headingCache: HeadingCache;
  filePath: string;
}

export type TreeType = "heading" | "list" | "file";

export interface TreeWithoutCache {
  text: string;
  filePath: string;
  type: TreeType;
  branches: Tree[];
  sectionsWithMatches: SectionWithMatch[];
}

// todo: seriously? TreeWithoutCache?
export interface Tree extends TreeWithoutCache {
  cacheItem: CacheItem;
}

export interface FileTree extends TreeWithoutCache {
  type: "file";
  stat: FileStats;
}

export interface Breadcrumb {
  text: string;
  position: Pos;
}

export interface ListContextTree extends WithListChildren {
  listItemCache: ListItemCache;
  filePath: string;
}
