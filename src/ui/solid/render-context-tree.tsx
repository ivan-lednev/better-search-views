import { render } from "solid-js/web";
import { PluginContextProvider } from "./plugin-context";
import { Tree } from "./tree";
import { FileContextTree } from "../../context-tree/types";
import BetterBacklinksPlugin from "../../plugin";

interface RenderContextTreeProps {
  contextTrees: FileContextTree[];
  highlights: string[];
  el: HTMLElement;
  plugin: BetterBacklinksPlugin;
}

export function renderContextTree({
  contextTrees,
  el,
  plugin,
  highlights,
}: RenderContextTreeProps) {
  return render(
    () => (
      <PluginContextProvider plugin={plugin}>
        <Tree fileContextTrees={contextTrees} highlights={highlights} />
      </PluginContextProvider>
    ),
    el
  );
}
