import { createSignal, For, Show } from "solid-js";
import { Title } from "./title";
import { MatchSection } from "./match-section";
import { CollapsedContextTree } from "../../types";
import { CollapseIcon } from "./icons/collapse-icon";
import { usePluginContext } from "./plugin-context";

interface BranchProps {
  contextTree: CollapsedContextTree;
}

export function Branch(props: BranchProps) {
  const { handleHeightChange } = usePluginContext();
  const [isHidden, setIsHidden] = createSignal(false);

  const breadcrumbs = () => {
    const breadcrumbForBranch = {
      text: props.contextTree.text,
      type: props.contextTree.type,
      position: props.contextTree.cacheItem.position,
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
            <div
              class={`tree-item-icon collapse-icon ${
                isHidden() ? "is-collapsed" : ""
              }`}
              onClick={() => {
                setIsHidden(!isHidden());
                handleHeightChange();
              }}
            >
              <CollapseIcon />
            </div>
            <Title
              breadcrumbs={breadcrumbs()}
              contextTree={props.contextTree}
            />
          </div>
        </Show>
        <div style={{ display: isHidden() ? "none" : "block" }}>
          <div style={{ "margin-left": "21px" }}>
            <MatchSection
              sectionsWithMatches={props.contextTree.sectionsWithMatches}
            />
          </div>
          <div class="better-search-views-tree-item-children">
            <For each={props.contextTree.branches}>
              {(branch) => <Branch contextTree={branch} />}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
