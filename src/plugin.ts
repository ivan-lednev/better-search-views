import {
  Component,
  MarkdownView,
  Plugin,
  ViewCreator,
  WorkspaceLeaf,
} from "obsidian";
import { BetterBacklinksView } from "./sidebar";
import { BetterBacklinksSettingTab } from "./setting-tab";
import * as patch from "monkey-around";
import { mountContextTree } from "./ui/mount-context-tree";
import { EmbeddedBacklinksComponent } from "./embedded-backlinks-component";
import { getHeadingBreadcrumbs } from "./metadata-cache-util/heading";
import {renderContextTree} from "./ui/solid/render-context-tree";
import {createContextTree} from "./context-tree/create/create-context-tree";

interface BetterBacklinksSettings {
  mySetting: string;
}

const defaultSettings: BetterBacklinksSettings = {
  mySetting: "default",
};

export default class BetterBacklinksPlugin extends Plugin {
  settings: BetterBacklinksSettings;
  wrappedMatches = new WeakSet();

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
    window.ComponentClass = Component;

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

    this.register(
      patch.around(Component.prototype, {
        addChild(old: any) {
          return function (child: unknown, ...args: any[]) {
            if (
              child instanceof Component &&
              child.hasOwnProperty("backlinkDom") &&
              this.getViewType() === "markdown"
            ) {
              this.backlinksEl.empty();
              // todo: do we really need this?
              child.unload();

              return new EmbeddedBacklinksComponent(
                plugin.app,
                plugin,
                this.backlinksEl
              );
            } else {
              return old.call(this, child, ...args);
            }
          };
        },
      })
    );
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
            // patch.around(dom.constructor.prototype, {
            //   addResult(old: any) {
            //     return function (
            //       app: any,
            //       parentDom: any,
            //       file: any,
            //       result: any,
            //       content: any,
            //       showTitle: any
            //     ) {
            //       const searchResultItem = {
            //         file: file,
            //         info: { queued: false },
            //         result,
            //         content,
            //         renderContentMatches() {
            //           return createDiv({ text: "Hren" });
            //         },
            //       };
            //
            //       const vChildren = this.vChildren;
            //       const resultDomLookup = this.resultDomLookup;
            //       this.removeResult(file);
            //       vChildren.addChild(searchResultItem);
            //       resultDomLookup.set(file, searchResultItem);
            //       this.changed();
            //       return searchResultItem;
            //     };
            //   },
            // });
            return old.call(this, child, ...args);
          };
        },
      })
    );
  }

  decorateMatch(container: any, match: any) {
    if (this.wrappedMatches.has(match)) {
      return;
    }
    this.wrappedMatches.add(match);

    const { cache, content, start, end } = match;

    const { file } = container;

    const containingSection = cache.sections?.find(
      (s: any) =>
        s.position.start.offset <= start && s.position.end.offset >= end
    );

    const headingBreadcrumbs = getHeadingBreadcrumbs(
      containingSection.position,
      cache.headings
    )?.map(headingCache => headingCache.heading)?.join(" > ");

    if (containingSection) {
      match.el.setText(
        content.substring(
          containingSection.position.start.offset,
          containingSection.position.end.offset
        )
      );
    }

    const mountPoint = createDiv()

    const contextTree = createContextTree({
      linksToTarget: [containingSection],
      fileContents: content,
      stat: file.stat,
      filePath: file.path,
      ...cache
    })

    renderContextTree({
      contextTrees: [contextTree],
      el: mountPoint,
      plugin: this,
    });

    // const wrapper = createDiv({
    //   text: headingBreadcrumbs ? `H: ${headingBreadcrumbs}` : "",
    //   cls: "better-search-wrapper",
    // });
    // wrapper.appendChild(match.el);

    // match.el = wrapper;
    match.el = mountPoint
  }

  patchSearchResultItem(SearchResultItem: any) {
    const plugin = this;
    const trap = {
      renderContentMatches(old: any) {
        return function (...args: any[]) {
          const result = old.call(this, ...args);

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
