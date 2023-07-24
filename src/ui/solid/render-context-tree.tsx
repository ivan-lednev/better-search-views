import { render } from "solid-js/web";
import { PluginContextProvider } from "./plugin-context";
import { Tree } from "./tree";
import { ContextTree } from "../../types";
import BetterBacklinksPlugin from "../../plugin";

interface RenderContextTreeProps {
  contextTrees: ContextTree[];
  highlights: string[];
  el: HTMLElement;
  plugin: BetterBacklinksPlugin;
  infinityScroll: any;
}

export function renderContextTree({
  contextTrees,
  el,
  plugin,
  highlights,
  infinityScroll
}: RenderContextTreeProps) {
  return render(
    () => (
      <PluginContextProvider plugin={plugin} infinityScroll={infinityScroll}>
        <Tree fileContextTrees={contextTrees} highlights={highlights} />
      </PluginContextProvider>
    ),
    el
  );
}
