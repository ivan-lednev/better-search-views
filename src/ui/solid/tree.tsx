import { Accessor, createEffect, For } from "solid-js";
import { Branch } from "./branch";
import { produce } from "immer";
import { CollapsedContextTree, ContextTree } from "../../types";
import { collapseEmptyNodes } from "../../context-tree/collapse/collapse-empty-nodes";
import Mark from "mark.js";

interface TreeProps {
  fileContextTrees: ContextTree[];
  highlights: string[];
}

export function Tree(props: TreeProps) {
  const collapsedTrees: Accessor<CollapsedContextTree[]> = () =>
    props.fileContextTrees.map((tree) =>
      produce(tree, (draft) => {
        collapseEmptyNodes(draft);
      })
    );

  let markContextRef: HTMLDivElement;

  createEffect(() => {
    new Mark(markContextRef).mark(props.highlights, {
      element: "span",
      className: "search-result-file-matched-text",
      separateWordSearch: false,
      diacritics: false,
    });
  });

  return (
    // @ts-ignore
    <div ref={markContextRef}>
      <For each={collapsedTrees()}>
        {(tree) => <Branch contextTree={tree} />}
      </For>
    </div>
  );
}
