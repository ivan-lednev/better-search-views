import { For, Match, Switch } from "solid-js";
import { usePluginContext } from "./plugin-context";
import { ListIcon } from "./icons/list-icon";
import { ArrowRightIcon } from "./icons/arrow-right-icon";
import { HeadingIcon } from "./icons/heading-icon";
import { Breadcrumb, ContextTree, MouseOverEvent } from "../../types";
import { listItemToken } from "../../patterns";

interface TitleProps {
  breadcrumbs: Breadcrumb[];
  contextTree: ContextTree;
}

function removeListToken(text: string) {
  return text.trim().replace(listItemToken, "");
}

export function Title(props: TitleProps) {
  const { handleClick, handleMouseover } = usePluginContext();

  return (
    <div class="better-search-views-titles-container">
      <For each={props.breadcrumbs}>
        {(breadcrumb, i) => {
          const handleTitleClick = async () =>
            await handleClick(
              props.contextTree.filePath,
              breadcrumb.position.start.line
            );

          const handleTitleMouseover = (event: MouseOverEvent) =>
            handleMouseover(
              event,
              props.contextTree.filePath,
              breadcrumb.position.start.line
            );

          return (
            <div class="tree-item-inner">
              <div
                class="better-search-views-breadcrumb-container"
                onClick={handleTitleClick}
                onMouseOver={handleTitleMouseover}
              >
                <div class="better-search-views-breadcrumb-token">
                  <Switch fallback={<ArrowRightIcon />}>
                    <Match
                      when={
                        breadcrumb.type === "list" &&
                        (i() === 0 ||
                          props.breadcrumbs[i() - 1]?.type === "heading")
                      }
                    >
                      <ListIcon />
                    </Match>
                    <Match when={i() === 0 && breadcrumb.type === "heading"}>
                      <HeadingIcon />
                    </Match>
                  </Switch>
                </div>
                <div>{removeListToken(breadcrumb.text)}</div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
