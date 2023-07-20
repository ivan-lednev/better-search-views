import { For, Index, Match, Show, Switch } from "solid-js";
import { usePluginContext } from "./plugin-context";
import { AnyTree } from "./tree";
import { ListIcon } from "./icons/list-icon";
import { ArrowRightIcon } from "./icons/arrow-right-icon";
import { HeadingIcon } from "./icons/heading-icon";
import { Breadcrumb } from "../../context-tree/types";
import { Pos } from "obsidian";

interface TitleProps {
  breadcrumbs: Breadcrumb[];
  contextTree: AnyTree;
  type?: "list" | "heading";
}

function removeListToken(text: string) {
  return text.trim().replace(/^-\s+/, "");
}

export function Title(props: TitleProps) {
  const { handleClick, handleMouseover } = usePluginContext();

  // todo: clean this up. It can be shorter
  // todo: remove duplication
  return (
    <div class="better-search-views-titles-container">
      <For each={props.breadcrumbs}>
        {(breadcrumb, i) => {
          const handleTitleClick = async () =>
            await handleClick(
              props.contextTree.filePath,
              breadcrumb.position.start.line
            );

          const handleTitleMouseover = (event: PointerEvent) =>
            handleMouseover(
              event,
              props.contextTree.filePath,
              breadcrumb.position.start.line
            );

          return (
            <Switch
              fallback={
                <div>Unknown breadcrumb type: {JSON.stringify(breadcrumb)}</div>
              }
            >
              <Match when={props.type === "list"}>
                <div class="tree-item-inner">
                  <div
                    class="better-search-views-breadcrumb-container"
                    onClick={handleTitleClick}
                    onMouseOver={handleTitleMouseover}
                  >
                    <div class="better-search-views-breadcrumb-token">
                      {i() === 0 ? <ListIcon /> : <ArrowRightIcon />}
                    </div>
                    <div>{removeListToken(breadcrumb.text)}</div>
                  </div>
                </div>
              </Match>
              <Match when={props.type === "heading"}>
                <div class="tree-item-inner">
                  <div
                    class="better-search-views-breadcrumb-container"
                    onClick={handleTitleClick}
                    onMouseOver={handleTitleMouseover}
                  >
                    <div class="better-search-views-breadcrumb-token">
                      {i() === 0 ? <HeadingIcon /> : <ArrowRightIcon />}
                    </div>
                    <div>{breadcrumb.text}</div>
                  </div>
                </div>
              </Match>
            </Switch>
          );
        }}
      </For>
    </div>
  );
}
