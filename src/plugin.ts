import {
  Component,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
  TFile,
  ViewCreator,
  WorkspaceLeaf,
} from "obsidian";
import { BetterBacklinksSettingTab } from "./setting-tab";
import * as patch from "monkey-around";
import { renderContextTree } from "./ui/solid/render-context-tree";
import { createContextTree } from "./context-tree/create/create-context-tree";
import { createPositionFromOffsets } from "./metadata-cache-util/position";

interface BetterBacklinksSettings {
  mySetting: string;
}

const defaultSettings: BetterBacklinksSettings = {
  mySetting: "default",
};

export default class BetterBacklinksPlugin extends Plugin {
  settings: BetterBacklinksSettings;
  wrappedMatches = new WeakSet();
  wrappedFileMatches = new WeakSet();

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new BetterBacklinksSettingTab(this.app, this));

    this.testPatchNativeSearch();

    this.register(
      patch.around(Component.prototype, {
        addChild(old: any) {
          return function (child: unknown, ...args: any[]) {
            if (
              child.constructor.prototype.hasOwnProperty("renderContentMatches")
            ) {
              console.log("patched SearchResultItemClass");
              const SearchResultItemClass = child.constructor;
              patch.around(SearchResultItemClass.prototype, {
                renderContentMatches(old: any) {
                  return function (...args: any[]) {
                    console.log("patched SearchResultItemClass");
                  };
                },
              });
            } else {
              return old.call(this, child, ...args);
            }
          };
        },
      })
    );
  }

  testPatchNativeSearch() {
    const plugin = this;
    const trap = {
      registerView(old: any) {
        return function (
          type: string,
          viewCreator: ViewCreator,
          ...args: unknown[]
        ) {
          plugin.app.workspace.trigger("view-registered", type, viewCreator);
          console.log("view registered", type);
          return old.call(this, type, viewCreator, ...args);
        };
      },
    };
    this.register(
      // @ts-ignore
      patch.around(this.app.viewRegistry.constructor.prototype, trap)
    );

    if (!this.app.workspace.layoutReady) {
      let eventRef = this.app.workspace.on(
        // @ts-ignore
        "view-registered",
        (type: string, viewCreator: ViewCreator) => {
          if (type !== "search") return;
          console.log("search registered");
          this.app.workspace.offref(eventRef);
          // @ts-ignore we need a leaf before any leafs exists in the workspace, so we create one from scratch
          let leaf = new WorkspaceLeaf(plugin.app);
          let searchView = viewCreator(leaf);
          plugin.patchSearchView(searchView);
        }
      );
    }
  }

  patchSearchView(searchView: any) {
    const plugin = this;
    const trap = {
      addChild(old: any) {
        return function (child: any, ...args: any[]) {
          const dom = child.dom;
          if (!dom) {
            return;
          }
          const SearchResult = dom.constructor;
          patch.around(SearchResult.prototype, {
            addResult(old: any) {
              return function (...args: any[]) {
                const result = old.call(this, ...args);
                console.log("patched addResult", { args, result });
                const SearchResultItem = result.constructor;
                plugin.patchSearchResultItem(SearchResultItem);
                return result;
              };
            },
          });
          return old.call(this, child, ...args);
        };
      },
    };
    this.register(patch.around(searchView.constructor.prototype, trap));
  }

  mountContextTreeOnMatchEl(container: any, match: any, positions: any[], highlights: string[]) {
    if (this.wrappedMatches.has(match)) {
      return;
    }

    this.wrappedMatches.add(match);

    const { cache, content } = match;
    const { file } = container;

    const contextTree = createContextTree({
      positions,
      fileContents: content,
      stat: file.stat,
      filePath: file.path,
      ...cache,
    });

    const mountPoint = createDiv();

    // todo: hack for file names
    contextTree.text = "";

    renderContextTree({
      highlights,
      contextTrees: [contextTree],
      el: mountPoint,
      plugin: this,
    });

    match.el = mountPoint;
  }

  patchSearchResultItem(SearchResultItem: any) {
    const plugin = this;
    const trap = {
      renderContentMatches(old: any) {
        return function (...args: any[]) {
          const result = old.call(this, ...args);

          if (
            plugin.wrappedFileMatches.has(this) ||
            !this.vChildren._children ||
            this.vChildren._children.length === 0
          ) {
            return result;
          }

          plugin.wrappedFileMatches.add(this);

          const matchPositions = this.vChildren._children.map(
            // todo: works only for one match per block
            ({ content, matches: [[start, end]] }: any) =>
              createPositionFromOffsets(content, start, end)
          );

          const highlightedTerms = this.vChildren._children.map(({ content, matches: [[start, end]]}) => {
            return content.substring(start, end)
          })

          const firstMatch = this.vChildren._children[0];
          plugin.mountContextTreeOnMatchEl(this, firstMatch, matchPositions, highlightedTerms);

          // we already mounted the whole thing to the first child, so discard the rest
          this.vChildren._children = this.vChildren._children.slice(0, 1);

          return result;
        };
      },
    };

    this.register(patch.around(SearchResultItem.prototype, trap));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
