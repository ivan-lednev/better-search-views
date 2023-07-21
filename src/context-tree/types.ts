import {
  CacheItem,
  FileStats,
  HeadingCache,
  LinkCache,
  ListItemCache,
  Pos,
  SectionCache,
} from "obsidian";
import { Tree } from "istanbul-lib-report";

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

export interface Breadcrumb {
  text: string;
  type: TreeType;
  position: Pos;
}
