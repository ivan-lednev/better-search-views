import { render } from "solid-js/web";
import { PluginContextProvider } from "./plugin-context";
import { Tree } from "./tree";
import { ContextTree } from "../../types";
import BetterBacklinksPlugin from "../../plugin";

interface RenderContextTreeProps {
  contextTree: ContextTree;
  highlights: string[];
  el: HTMLElement;
  plugin: BetterBacklinksPlugin;
  infinityScroll: any;
}

export function renderContextTree({
  contextTree,
  el,
  plugin,
  highlights,
  infinityScroll
}: RenderContextTreeProps) {
  return render(
    () => (
      <PluginContextProvider plugin={plugin} infinityScroll={infinityScroll}>
        <Tree fileContextTree={contextTree} highlights={highlights} />
      </PluginContextProvider>
    ),
    el
  );
}
