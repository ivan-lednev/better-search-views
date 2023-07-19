import { Component, Notice, ViewCreator, WorkspaceLeaf } from "obsidian";
import * as patch from "monkey-around";
import { createPositionFromOffsets } from "./metadata-cache-util/position";
import { createContextTree } from "./context-tree/create/create-context-tree";
import { renderContextTree } from "./ui/solid/render-context-tree";
import BetterSearchViewsPlugin from "./plugin";

export class Patcher {
  private readonly wrappedMatches = new WeakSet();
  private readonly wrappedSearchResultItems = new WeakSet();
  private currentNotice: Notice;
  private searchResultItemPatched = false;
  private renderContentMatchesPatched = false;

  constructor(private readonly plugin: BetterSearchViewsPlugin) {}

  patchViewRegistry() {
    const patcher = this;
    const { plugin } = this;

    const trap = {
      registerView(old: any) {
        return function (
          type: string,
          viewCreator: ViewCreator,
          ...args: unknown[]
        ) {
          old.call(this, type, viewCreator, ...args);

          if (type !== "search") {
            return;
          }

          // @ts-ignore
          const leaf = new WorkspaceLeaf(plugin.app);
          // We create a new view only to get to the SearchView class
          const SearchView = viewCreator(leaf).constructor;
          patcher.patchSearchView(SearchView);
        };
      },
    };

    const ViewRegistry = plugin.app.viewRegistry.constructor;

    plugin.register(patch.around(ViewRegistry.prototype, trap));
  }

  patchSearchView(SearchView: any) {
    if (this.searchResultItemPatched) {
      return;
    }
    const patcher = this;
    const { plugin } = this;

    const trap = {
      addChild(old: any) {
        return function (child: any, ...args: any[]) {
          const dom = child.dom;
          if (!dom) {
            return;
          }

          const SearchResult = dom.constructor;

          patcher.patchSearchResult(SearchResult);
          patcher.searchResultItemPatched = true;

          return old.call(this, child, ...args);
        };
      },
    };

    plugin.register(patch.around(SearchView.prototype, trap));
  }

  patchSearchResult(SearchResult: any) {
    const patcher = this;
    const { plugin } = this;

    const trap = {
      addResult(old: any) {
        return function (...args: any[]) {
          const result = old.call(this, ...args);
          const SearchResultItem = result.constructor;
          patcher.patchSearchResultItem(SearchResultItem);
          return result;
        };
      },
    };

    plugin.register(patch.around(SearchResult.prototype, trap));
  }

  patchSearchResultItem(SearchResultItem: any) {
    if (this.renderContentMatchesPatched) {
      return;
    }

    const patcher = this;
    const { plugin } = this;
    const trap = {
      renderContentMatches(old: any) {
        // todo: do this one level higher
        console.log(
          "is searchresultitem instanceof component",
          this instanceof Component
        );
        patcher.renderContentMatchesPatched = true;
        return function (...args: any[]) {
          const result = old.call(this, ...args);

          if (
            patcher.wrappedSearchResultItems.has(this) ||
            !this.vChildren._children ||
            this.vChildren._children.length === 0
          ) {
            return result;
          }

          patcher.wrappedSearchResultItems.add(this);

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
            patcher.mountContextTreeOnMatchEl(
              this,
              firstMatch,
              matchPositions,
              normalizedHighlights
            );

            // we already mounted the whole thing to the first child, so discard the rest
            this.vChildren._children = this.vChildren._children.slice(0, 1);
          } catch (e) {
            const message = `Error while mounting Better Search Views tree for file path: ${this.file.path}`;
            patcher.currentNotice?.hide();
            patcher.currentNotice = new Notice(
              `${message}. Please report an issue with the details from the console attached.`,
              10000
            );
            console.error(`${message}. Reason:`, e);
          }

          return result;
        };
      },
    };

    plugin.register(patch.around(SearchResultItem.prototype, trap));
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
      plugin: this.plugin,
    });

    match.el = mountPoint;
  }
}
