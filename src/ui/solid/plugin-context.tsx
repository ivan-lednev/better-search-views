import { JSX, createContext, useContext } from "solid-js";
import SNWPlugin from "../../main";
import { Keymap, MarkdownView } from "obsidian";

interface PluginContextProps {
  plugin: SNWPlugin;
  children: JSX.Element;
}

interface PluginContextValue {
  handleClick: (path: string, line?: number) => Promise<void>;
  handleMouseover: (event: PointerEvent, path: string, line?: number) => void;
}

const PluginContext = createContext<PluginContextValue>();

export function PluginContextProvider(props: PluginContextProps) {
  const handleClick = async (path: string, line: number) => {
    const file = app.metadataCache.getFirstLinkpathDest(path, path);


    // todo
//         thePlugin.app.workspace.getLeaf(Keymap.isModEvent(e)).openFile(fileT);
    await props.plugin.app.workspace.getLeaf(false).openFile(file);

    if (Number.isInteger(line)) {
      props.plugin.app.workspace
        // todo: this is sometimes bitching about null
        .getActiveViewOfType(MarkdownView)
        .setEphemeralState({ line });
    }
  };

  const handleMouseover = (event: PointerEvent, path: string, line: number) => {
    if (
      // todo: extend interface
      // @ts-ignore
      !props.plugin.app.internalPlugins.plugins["page-preview"].enabled
    ) {
      return;
    }

    // todo: fix this crap
    // todo: extend interface
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
        // parameter signature for link-hover parent: HoverParent, targetEl: HTMLElement, linkText: string, sourcePath: string, eState: EphemeralState
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
    <PluginContext.Provider value={{ handleClick, handleMouseover }}>
      {props.children}
    </PluginContext.Provider>
  );
}

export function usePluginContext() {
  return useContext(PluginContext);
}
