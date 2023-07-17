import {
  FileStats,
  HeadingCache, LinkCache,
  ListItemCache, Pos,
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
  matchPosition?: { position: Pos }
}

export interface WithListChildren {
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists: ListContextTree[];
}

export interface WithAnyChildren extends WithListChildren {
  childHeadings: HeadingContextTree[];
}

export interface FileContextTree extends WithAnyChildren {
  filePath?: string;
  stat: FileStats;
}

export interface HeadingContextTree extends WithAnyChildren {
  headingCache: HeadingCache;
  filePath: string;
}

export interface ListContextTree extends WithListChildren {
  listItemCache: ListItemCache;
  filePath: string;
}
