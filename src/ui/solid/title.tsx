import { Index, Match, Show, Switch } from "solid-js";
import { usePluginContext } from "./plugin-context";
import { AnyTree } from "./tree";
import { ListIcon } from "./icons/list-icon";
import { ArrowRightIcon } from "./icons/arrow-right-icon";
import { HeadingIcon } from "./icons/heading-icon";

interface TitleProps {
  breadcrumbs: string[];
  contextTree: AnyTree;
  type?: "list" | "heading";
}

function removeListToken(text: string) {
  return text.trim().replace(/^-\s+/, "");
}

export function Title(props: TitleProps) {
  const { handleClick } = usePluginContext();

  // todo: clean this up. It can be shorter
  // todo: remove duplication
  return (
    <div class='better-search-views-titles-container'>
      <Index each={props.breadcrumbs}>
        {(breadcrumb, i) => (
          <Switch
            fallback={
              <div>Unknown breadcrumb type: {JSON.stringify(breadcrumb)}</div>
            }
          >
            <Match when={props.type === "list"}>
              <div class="tree-item-inner">
                <div
                  class="better-search-views-breadcrumb-container"
                  onClick={async () =>
                    handleClick(
                      props.contextTree.filePath,
                      // @ts-ignore
                      props.contextTree.listItemCache.position.start.line
                    )
                  }
                >
                  <div class="better-search-views-breadcrumb-token">
                    {i === 0 ? <ListIcon /> : <ArrowRightIcon />}
                  </div>
                  <div>{removeListToken(breadcrumb())}</div>
                </div>
              </div>
            </Match>
            <Match when={props.type === "heading"}>
              <div class="tree-item-inner">
                <div
                  class="better-search-views-breadcrumb-container"
                  onClick={async () =>
                    await handleClick(
                      props.contextTree.filePath,
                      // @ts-ignore
                      props.contextTree.headingCache.position.start.line
                    )
                  }
                >
                  <div class="better-search-views-breadcrumb-token">
                    {i === 0 ? <HeadingIcon /> : <ArrowRightIcon />}
                  </div>
                  <div>{breadcrumb()}</div>
                </div>
              </div>
            </Match>
          </Switch>
        )}
      </Index>
    </div>
  );
}
