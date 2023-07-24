import { Accessor, createEffect, For } from "solid-js";
import { Branch } from "./branch";
import { CollapsedContextTree, ContextTree } from "../../types";
import { collapseEmptyNodes } from "../../context-tree/collapse/collapse-empty-nodes";
import Mark from "mark.js";

interface TreeProps {
  fileContextTree: ContextTree;
  highlights: string[];
}

export function Tree(props: TreeProps) {
  const collapsedTree: Accessor<CollapsedContextTree> = () => ({
    ...props.fileContextTree,
    branches: props.fileContextTree.branches.map(collapseEmptyNodes),
  });

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
      <Branch contextTree={collapsedTree()} />
    </div>
  );
}
