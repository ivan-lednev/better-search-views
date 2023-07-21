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

export type TreeType = "heading" | "list" | "file";

export interface ContextTree {
  text: string;
  filePath: string;
  type: TreeType;
  branches: ContextTree[];
  sectionsWithMatches: SectionWithMatch[];
  cacheItem: CacheItem;
  stat: FileStats;
}

export interface CollapsedContextTree extends ContextTree {
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  text: string;
  type: TreeType;
  position: Pos;
}

export type MouseOverEvent = MouseEvent & {
  currentTarget: Element;
  target: Element;
};
