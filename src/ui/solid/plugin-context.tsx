import { JSX, createContext, useContext } from "solid-js";
import { Keymap, MarkdownView, Notice } from "obsidian";
import BetterBacklinksPlugin from "../../plugin";
import { MouseOverEvent } from "../../types";

interface PluginContextProps {
  plugin: BetterBacklinksPlugin;
  children: JSX.Element;
}

interface PluginContextValue {
  handleClick: (path: string, line?: number) => Promise<void>;
  handleMouseover: (event: MouseOverEvent, path: string, line?: number) => void;
  plugin: BetterBacklinksPlugin;
}

const PluginContext = createContext<PluginContextValue>();

export function PluginContextProvider(props: PluginContextProps) {
  const handleClick = async (path: string, line: number) => {
    const file = app.metadataCache.getFirstLinkpathDest(path, path);

    if (!file) {
      new Notice(`File ${path} does not exist`);
      return;
    }

    await props.plugin.app.workspace.getLeaf(false).openFile(file);

    const activeMarkdownView =
      props.plugin.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeMarkdownView) {
      new Notice(`Failed to open file ${path}. Can't scroll to line ${line}`);
      return;
    }

    // Sometimes it works but still throws errors
    try {
      activeMarkdownView.setEphemeralState({ line });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMouseover = (
    event: MouseOverEvent,
    path: string,
    line: number
  ) => {
    // @ts-ignore
    if (!props.plugin.app.internalPlugins.plugins["page-preview"].enabled) {
      return;
    }

    if (Keymap.isModifier(event, "Mod")) {
      const target = event.target as HTMLElement;
      const previewLocation = {
        scroll: line,
      };
      if (path) {
        app.workspace.trigger(
          "link-hover",
          {},
          target,
          path,
          "",
          previewLocation
        );
      }
    }
  };

  return (
    <PluginContext.Provider
      value={{ handleClick, handleMouseover, plugin: props.plugin }}
    >
      {props.children}
    </PluginContext.Provider>
  );
}

export function usePluginContext() {
  const pluginContext = useContext(PluginContext);
  if (!pluginContext) {
    throw new Error("pluginContext must be used inside a provider");
  }
  return pluginContext;
}
