import { JSX, createContext, useContext } from "solid-js";
import { App, Keymap, MarkdownView, Notice } from "obsidian";
import BetterBacklinksPlugin from "../../plugin";
import { MouseOverEvent } from "../../types";

interface PluginContextProps {
  plugin: BetterBacklinksPlugin;
  infinityScroll: any;
  children: JSX.Element;
}

interface PluginContextValue {
  handleClick: (
    event: MouseEvent,
    path: string,
    line?: number,
  ) => Promise<void>;
  handleMouseover: (event: MouseOverEvent, path: string, line?: number) => void;
  handleHeightChange: () => void;
  plugin: BetterBacklinksPlugin;
  app: App;
}

const PluginContext = createContext<PluginContextValue>();

export function PluginContextProvider(props: PluginContextProps) {
  const handleClick = async (event: MouseEvent, path: string, line: number) => {
    if (event.target instanceof HTMLAnchorElement) {
      return;
    }

    const file = props.plugin.app.metadataCache.getFirstLinkpathDest(
      path,
      path,
    );

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
    line: number,
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
        props.plugin.app.workspace.trigger(
          "link-hover",
          {},
          target,
          path,
          "",
          previewLocation,
        );
      }
    }
  };

  const handleHeightChange = () => {
    props.infinityScroll.invalidateAll();
  };

  return (
    <PluginContext.Provider
      value={{
        handleClick,
        handleMouseover,
        handleHeightChange,
        plugin: props.plugin,
        app: props.plugin.app,
      }}
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
