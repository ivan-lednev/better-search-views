import { For, Show } from "solid-js";
import { Title } from "./title";
import { MatchSection } from "./match-section";
import { CircleIcon } from "./icons/circle-icon";
import { ContextTree } from "../../context-tree/types";

interface BranchProps {
  contextTree: ContextTree;
}

export function Branch(props: BranchProps) {
  const breadcrumbs = () => {
    const breadcrumbForBranch = {
      text: props.contextTree.text,
      type: props.contextTree.type,
      position: props.contextTree.cacheItem.position,
    };
    // @ts-ignore
    // todo: add breadcrumbs to type
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
              contextTree={props.contextTree}
            />
          </div>
        </Show>
        <div class="better-search-views-tree-item-children">
          <MatchSection
            sectionsWithMatches={props.contextTree.sectionsWithMatches}
          />
          <For each={props.contextTree.branches}>
            {(branch) => <Branch contextTree={branch} />}
          </For>
        </div>
      </div>
    </Show>
  );
}
