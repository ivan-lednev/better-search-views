import { createEffect, createSignal, For, Show } from "solid-js";
import { Title } from "./title";
import { AnyTree } from "./tree";
import { MatchSection } from "./match-section";
import { CircleIcon } from "./icons/circle-icon";

interface BranchProps {
  contextTree?: AnyTree;
  type?: "list" | "heading";
}

export function Branch(props: BranchProps) {
  const breadcrumbs = () => {
    const breadcrumbForBranch = {
      text: props.contextTree.text,
      // todo: replace with .cache
      position:
        props.contextTree?.headingCache?.position ||
        props.contextTree?.listItemCache?.position,
    };
    return props.contextTree.breadcrumbs
      ? [...props.contextTree.breadcrumbs, breadcrumbForBranch]
      : [breadcrumbForBranch];
  };

  return (
    <Show when={props.contextTree}>
      <div class="tree-item search-result better-search-views-tree">
        {/* TODO: fix this hack for file names */}
        <Show when={breadcrumbs().some((b) => b.text.length > 0)}>
          <div class="tree-item-self search-result-file-title is-clickable">
            <div class={`tree-item-icon collapse-icon`}>
              <CircleIcon />
            </div>
            <Title
              breadcrumbs={breadcrumbs()}
              type={props.type}
              contextTree={props.contextTree}
            />
          </div>
        </Show>
        <div class="better-search-views-tree-item-children">
          <MatchSection
            sectionsWithMatches={props.contextTree.sectionsWithMatches}
          />
          <For each={props.contextTree.childLists}>
            {(list) => (
              <Branch
                contextTree={list}
                type="list"
                initialCollapseResults={props.initialCollapseResults}
              />
            )}
          </For>
          <For each={props.contextTree.childHeadings}>
            {(list) => (
              <Branch
                contextTree={list}
                type="heading"
                initialCollapseResults={props.initialCollapseResults}
              />
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
