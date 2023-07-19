import {createEffect, createSignal, For, Show} from "solid-js";
import { CollapseIcon } from "./icons/collapse-icon";
import { Title } from "./title";
import { AnyTree } from "./tree";
import { MatchSection } from "./match-section";
import { usePluginContext } from "./plugin-context";
import { CircleIcon } from "./icons/circle-icon";

interface BranchProps {
  contextTree?: AnyTree;
  type?: "list" | "heading";
}

export function Branch(props: BranchProps) {
  const { handleClick, handleMouseover } = usePluginContext();
  const [childrenShown, setChildrenShown] = createSignal(true);

  const breadcrumbs = () =>
    props.contextTree.breadcrumbs
      ? [...props.contextTree.breadcrumbs, props.contextTree.text]
      : [props.contextTree.text];

  const line = () => {
    let line = null;

    if (props.type === "list") {
      // todo: simply replace with cacheItem
      // @ts-ignore
      line = props.contextTree.listItemCache.position.start.line;
    } else if (props.type === "heading") {
      // @ts-ignore
      line = props.contextTree.headingCache.position.start.line;
    }

    return line;
  };

  const handleTitleClick = () =>
    handleClick(props.contextTree.filePath, line());

  const handleTitleMouseOver = (event: PointerEvent) =>
    handleMouseover(
      // @ts-ignore
      event,
      props.contextTree.filePath,
      line()
    );

  return (
    <Show when={props.contextTree}>
      <div class="tree-item search-result better-backlinks-ref-item-container">
        {/* TODO: fix this hack for file names */}
        <Show when={breadcrumbs().some((b) => b.length > 0)}>
          <div class="tree-item-self search-result-file-title is-clickable">
            <div
              class={`tree-item-icon collapse-icon ${
                childrenShown() ? "" : "is-collapsed"
              }`}
              // onClick={() => setChildrenShown(!childrenShown())}
            >
              {/*<CollapseIcon />*/}
              <CircleIcon />
            </div>
            {/*<div*/}
            {/*  class="tree-item-inner"*/}
            {/*  onClick={handleTitleClick}*/}
            {/*  // @ts-ignore*/}
            {/*  onMouseOver={handleTitleMouseOver}*/}
            {/*>*/}
              <Title
                breadcrumbs={breadcrumbs()}
                type={props.type}
                contextTree={props.contextTree}
              />
            {/*</div>*/}
          </div>
        </Show>
        <Show when={childrenShown()}>
          <div class="better-backlinks-tree-item-children">
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
        </Show>
      </div>
    </Show>
  );
}
