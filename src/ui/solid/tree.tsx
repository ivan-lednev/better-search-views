import { createSignal, For } from "solid-js";
import { Branch } from "./branch";
import { produce } from "immer";
import { CacheItem, FileStats } from "obsidian";
import {
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../../context-tree/types";
import { collapseEmptyNodes } from "../../context-tree/collapse/collapse-empty-nodes";

export interface AnyTree {
  breadcrumbs?: string[];
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists?: ListContextTree[];
  childHeadings?: HeadingContextTree[];
  filePath?: string;
  cache?: CacheItem;
  stat?: FileStats;
}

interface TreeProps {
  fileContextTrees: AnyTree[];
}

export function Tree(props: TreeProps) {
  const collapsedTrees = () =>
    props.fileContextTrees.map((tree) =>
      produce(tree, (draft) => {
        collapseEmptyNodes(draft);
      })
    );

  return (
    <For each={collapsedTrees()}>
      {(tree) => (
        <Branch contextTree={tree} />
      )}
    </For>
  );
}
