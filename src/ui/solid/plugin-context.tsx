import { JSX, createContext, useContext } from "solid-js";
import { Keymap, MarkdownView } from "obsidian";
import BetterBacklinksPlugin from "../../plugin";

interface PluginContextProps {
  plugin: BetterBacklinksPlugin;
  children: JSX.Element;
}

interface PluginContextValue {
  handleClick: (path: string, line?: number) => Promise<void>;
  handleMouseover: (event: PointerEvent, path: string, line?: number) => void;
  plugin: BetterBacklinksPlugin;
}

const PluginContext = createContext<PluginContextValue>();

export function PluginContextProvider(props: PluginContextProps) {
  const handleClick = async (path: string, line: number) => {
    const file = app.metadataCache.getFirstLinkpathDest(path, path);

    await props.plugin.app.workspace.getLeaf(false).openFile(file);

    if (!Number.isInteger(line)) {
      return;
    }

    // Sometimes it works but still throws errors
    try {
      props.plugin.app.workspace
        .getActiveViewOfType(MarkdownView)
        .setEphemeralState({ line });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMouseover = (event: PointerEvent, path: string, line: number) => {
    if (
      // @ts-ignore
      !props.plugin.app.internalPlugins.plugins["page-preview"].enabled
    ) {
      return;
    }

    // todo: tidy this up
    const hoverMetaKeyRequired =
      // @ts-ignore
      app.internalPlugins.plugins["page-preview"].instance.overrides[
        "obsidian42-strange-new-worlds"
      ] != false;
    if (
      hoverMetaKeyRequired === false ||
      (hoverMetaKeyRequired === true && Keymap.isModifier(event, "Mod"))
    ) {
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
