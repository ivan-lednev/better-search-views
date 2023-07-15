import { render } from "solid-js/web";
import { PluginContextProvider } from "./plugin-context";
import { Tree } from "./tree";
import { FileContextTree } from "../../context-tree/types";
import BetterBacklinksPlugin from "../../plugin";

interface RenderContextTreeProps {
	contextTrees: FileContextTree[];
	resultCount: number;
	el: HTMLElement;
	plugin: BetterBacklinksPlugin;
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
				<Tree
					fileContextTrees={contextTrees}
					resultCount={resultCount}
				/>
			</PluginContextProvider>
		),
		el
	);
}
