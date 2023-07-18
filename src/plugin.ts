import {
  Component,
  Notice,
  Plugin,
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
  currentNotice: Notice;

  async onload() {
    await this.loadSettings();

    // TODO: uncomment once we've got some options ready
    // this.addSettingTab(new BetterBacklinksSettingTab(this.app, this));

    this.patchViewRegistry();
  }

  patchViewRegistry() {
    const plugin = this;
    const trap = {
      registerView(old: any) {
        return function (
          type: string,
          viewCreator: ViewCreator,
          ...args: unknown[]
        ) {
          plugin.app.workspace.trigger("view-registered", type, viewCreator);
          return old.call(this, type, viewCreator, ...args);
        };
      },
    };
    this.register(
      // @ts-ignore
      patch.around(this.app.viewRegistry.constructor.prototype, trap)
    );

    let eventRef = this.app.workspace.on(
      // @ts-ignore
      "view-registered",
      (type: string, viewCreator: ViewCreator) => {
        if (type !== "search") {
          return;
        }
        this.app.workspace.offref(eventRef);
        // @ts-ignore we need a leaf before any leafs exists in the workspace, so we create one from scratch
        let leaf = new WorkspaceLeaf(plugin.app);
        let searchView = viewCreator(leaf);
        plugin.patchSearchView(searchView);
      }
    );
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

          try {
            const matchPositions = this.vChildren._children.map(
              // todo: works only for one match per block
              ({ content, matches: [[start, end]] }: any) =>
                createPositionFromOffsets(content, start, end)
            );

            const highlights = this.vChildren._children.map(
              ({ content, matches: [[start, end]] }) => {
                return content.substring(start, end);
              }
            );

            const normalizedHighlights = [
              ...new Set(highlights.map((h: string) => h.toLowerCase())),
            ];

            const firstMatch = this.vChildren._children[0];
            plugin.mountContextTreeOnMatchEl(
              this,
              firstMatch,
              matchPositions,
              normalizedHighlights
            );

            // we already mounted the whole thing to the first child, so discard the rest
            this.vChildren._children = this.vChildren._children.slice(0, 1);
          } catch (e) {
            const message = `Error while mounting Better Search Views tree for file path: ${this.file.path}`;
            plugin.currentNotice?.hide();
            plugin.currentNotice = new Notice(
              `${message}. Please report an issue with the details from the console attached.`,
              10000
            );
            console.error(`${message}. Reason:`, e);
          }

          return result;
        };
      },
    };

    this.register(patch.around(SearchResultItem.prototype, trap));
  }

  mountContextTreeOnMatchEl(
    container: any,
    match: any,
    positions: any[],
    highlights: string[]
  ) {
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

    // todo: remove the hack for file names
    contextTree.text = "";

    renderContextTree({
      highlights,
      contextTrees: [contextTree],
      el: mountPoint,
      plugin: this,
    });

    match.el = mountPoint;
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
