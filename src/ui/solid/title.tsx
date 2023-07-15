import { Index, Match, Switch } from "solid-js";
import { usePluginContext } from "./plugin-context";
import { AnyTree } from "./tree";

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
    <Index each={props.breadcrumbs}>
      {(breadcrumb, i) => (
        <Switch
          fallback={
            <div onClick={() => handleClick(props.contextTree.filePath)}>
              {breadcrumb().replace(/\.md$/, "")}
            </div>
          }
        >
          <Match when={props.type === "list"}>
            <div
              class="better-backlinks-breadcrumb-container"
              onClick={async () =>
                handleClick(
                  props.contextTree.filePath,
                  // @ts-ignore
                  props.contextTree.listItemCache.position.start.line
                )
              }
            >
              <div class="better-backlinks-breadcrumb-token">{i === 0 ? "•" : "↳"}</div>
              <div>{removeListToken(breadcrumb())}</div>
            </div>
          </Match>
          <Match when={props.type === "heading"}>
            <div
              class="better-backlinks-breadcrumb-container"
              onClick={async () =>
                await handleClick(
                  props.contextTree.filePath,
                  // @ts-ignore
                  props.contextTree.headingCache.position.start.line
                )
              }
            >
              <div class="better-backlinks-breadcrumb-token">{i === 0 ? "§" : "↳"}</div>
              <div>{breadcrumb()}</div>
            </div>
          </Match>
        </Switch>
      )}
    </Index>
  );
}
