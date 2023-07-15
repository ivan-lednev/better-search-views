import { FileContextTree } from "../components/context-tree/types";
import SNWPlugin from "../../main";
import { render } from "solid-js/web";
import { PluginContextProvider } from "./plugin-context";
import { Tree } from "./tree";

interface RenderContextTreeProps {
  contextTrees: FileContextTree[];
  resultCount: number;
  el: HTMLElement;
  plugin: SNWPlugin;
}

export function renderContextTree({
  contextTrees,
  resultCount,
  el,
  plugin,
}: RenderContextTreeProps) {
  render(
    () => (
      <PluginContextProvider plugin={plugin}>
        <Tree fileContextTrees={contextTrees} resultCount={resultCount} />
      </PluginContextProvider>
    ),
    el
  );
}
