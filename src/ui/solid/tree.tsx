import { createEffect, createSignal, For } from "solid-js";
import { Branch } from "./branch";
import { produce } from "immer";
import { CacheItem, FileStats } from "obsidian";
import {
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../../context-tree/types";
import { collapseEmptyNodes } from "../../context-tree/collapse/collapse-empty-nodes";
import Mark from "mark.js";

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
  highlights: string[];
}

export function Tree(props: TreeProps) {
  const collapsedTrees = () =>
    props.fileContextTrees.map((tree) =>
      produce(tree, (draft) => {
        collapseEmptyNodes(draft);
      })
    );

  let markContextRef: HTMLDivElement;
  const mark = new Mark(markContextRef);

  createEffect(() => {
    // todo: don't dedupe them here
    // new Mark(markContextRef).mark([...new Set(props.highlights)], {
    //   element: "span",
    //   className: "search-result-file-matched-text",
    //   separateWordSearch: false,
    //   diacritics: false,
    // });

    // todo: why does it work?
    mark.unmark({ done: () => mark.mark([...new Set(props.highlights)]) });
  });

  return (
    <div ref={markContextRef}>
      <For each={collapsedTrees()}>
        {(tree) => <Branch contextTree={tree} />}
      </For>
    </div>
  );
}
