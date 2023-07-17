import {
  Component,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
  TFile,
  ViewCreator,
  WorkspaceLeaf,
} from "obsidian";
import { BetterBacklinksView } from "./sidebar";
import { BetterBacklinksSettingTab } from "./setting-tab";
import * as patch from "monkey-around";
import { mountContextTree } from "./ui/mount-context-tree";
import { EmbeddedBacklinksComponent } from "./embedded-backlinks-component";
import { getHeadingBreadcrumbs } from "./metadata-cache-util/heading";
import { renderContextTree } from "./ui/solid/render-context-tree";
import { createContextTree } from "./context-tree/create/create-context-tree";

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

    this.registerView(
      BetterBacklinksView.VIEW_TYPE,
      (leaf) => new BetterBacklinksView(leaf, this.app.workspace, this)
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", async () => {
        const activeMarkdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeMarkdownView) {
          return;
        }

        this.app.workspace
          .getLeavesOfType(BetterBacklinksView.VIEW_TYPE)
          .forEach(({ view }) => {
            if (view instanceof BetterBacklinksView) {
              view.updateView(activeMarkdownView.file.path);
            }
          });
      })
    );

    this.testPatchNativeSearch();

    const plugin = this;
    // @ts-ignore
    window.MarkdownRenderer = MarkdownRenderer;

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

    this.addCommand({
      id: "show-backlinks",
      name: "Show Backlinks",
      callback: () => this.activateView(),
    });
  }

  testPatchNativeSearch() {
    const plugin = this;
    this.register(
      // @ts-ignore
      patch.around(this.app.viewRegistry.constructor.prototype, {
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
      })
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

    // this.register(
    //   patch.around(Component.prototype, {
    //     addChild(old: any) {
    //       return function (child: unknown, ...args: any[]) {
    //         if (
    //           child instanceof Component &&
    //           child.hasOwnProperty("backlinkDom") &&
    //           this.getViewType() === "markdown"
    //         ) {
    //           this.backlinksEl.empty();
    //           child.unload();
    //
    //           return new EmbeddedBacklinksComponent(
    //             plugin.app,
    //             plugin,
    //             this.backlinksEl
    //           );
    //         } else {
    //           return old.call(this, child, ...args);
    //         }
    //       };
    //     },
    //   })
    // );
  }

  patchSearchView(searchView: any) {
    const plugin = this;
    this.register(
      patch.around(searchView.constructor.prototype, {
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
      })
    );
  }

  getPosForMatch(content: string, startIndex: number, endIndex: number) {
    const startLine = content.substring(0, startIndex).split("\n").length - 1;
    const endLine = content.substring(0, endIndex).split("\n").length - 1;

    const startLinePos = content.substring(0, startIndex).lastIndexOf("\n") + 1;
    const startCol = content.substring(startLinePos, startIndex).length;

    const endLinePos = content.substring(0, endIndex).lastIndexOf("\n") + 1;
    const endCol = content.substring(endLinePos, endIndex).length;

    return {
      position: {
        start: { line: startLine, col: startCol, offset: startIndex },
        end: { line: endLine, col: endCol, offset: endIndex },
      },
    };
  }

  decorateMatch(container: any, match: any) {
    if (this.wrappedMatches.has(match)) {
      return;
    }
    this.wrappedMatches.add(match);

    // todo: there can be more matches
    const {
      cache,
      content,
      matches: [[start, end]],
    } = match;
    const { file } = container;

    const contextTree = createContextTree({
      positions: [this.getPosForMatch(content, start, end)],
      fileContents: content,
      stat: file.stat,
      filePath: file.path,
      ...cache,
    });

    // todo: why is it rendering so often?
    console.log(contextTree);

    const mountPoint = createDiv();

    // todo: hack for file names
    contextTree.text = "";

    renderContextTree({
      contextTrees: [contextTree],
      el: mountPoint,
      plugin: this,
    });

    match.el = mountPoint;
  }

  createContextTreeFromMatchPositions(
    positions: any,
    cache: any,
    content: any,
    file: TFile
  ) {
    return createContextTree({
      positions,
      fileContents: content,
      stat: file.stat,
      filePath: file.path,
      ...cache,
    });
  }

  patchSearchResultItem(SearchResultItem: any) {
    const plugin = this;
    const trap = {
      renderContentMatches(old: any) {
        return function (...args: any[]) {
          const result = old.call(this, ...args);

          if (plugin.wrappedFileMatches.has(this)) {
            return result;
          }

          plugin.wrappedFileMatches.add(this);

          const matchPositions = this.vChildren._children.map(
            ({ content, matches: [[start, end]] }: any) =>
              plugin.getPosForMatch(content, start, end)
          );

          console.log({ matchPositions });

          this.vChildren._children.forEach((child: any) =>
            plugin.decorateMatch(this, child)
          );

          return result;
        };
      },
    };

    this.register(patch.around(SearchResultItem.prototype, trap));
  }

  onunload() {}

  async activateView() {
    this.app.workspace.detachLeavesOfType(BetterBacklinksView.VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: BetterBacklinksView.VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(BetterBacklinksView.VIEW_TYPE)[0]
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
