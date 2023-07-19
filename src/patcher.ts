import {
  Component,
  Notice,
  ViewCreator,
  ViewRegistry,
  WorkspaceLeaf,
} from "obsidian";
import { around } from "monkey-around";
import { createPositionFromOffsets } from "./metadata-cache-util/position";
import { createContextTree } from "./context-tree/create/create-context-tree";
import { renderContextTree } from "./ui/solid/render-context-tree";
import BetterSearchViewsPlugin from "./plugin";

const errorTimeout = 10000;

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

    plugin.register(
      around(plugin.app.viewRegistry.constructor.prototype, {
        registerView(old: ViewRegistry["registerView"]) {
          return function (
            type: string,
            viewCreator: ViewCreator,
            ...args: unknown[]
          ) {
            old.call(this, type, viewCreator, ...args);

            if (type !== "search") {
              return;
            }

            // TODO: figure out how to change/extend constructor signature with typescript
            // @ts-ignore
            const leaf = new WorkspaceLeaf(plugin.app);
            // We create a new view only to get to the SearchView class
            const dummyView = viewCreator(leaf);

            patcher.patchSearchView(dummyView);
          };
        },
      })
    );
  }

  patchSearchView(searchView: Component) {
    if (this.searchResultItemPatched) {
      return;
    }
    const patcher = this;
    const { plugin } = this;

    plugin.register(
      around(searchView.constructor.prototype, {
        addChild(old: Component["addChild"]) {
          return function (child: unknown, ...args: unknown[]) {
            const dom = child.dom;
            if (!dom) {
              return;
            }

            patcher.patchSearchResult(dom);
            patcher.searchResultItemPatched = true;

            return old.call(this, child, ...args);
          };
        },
      })
    );
  }

  patchSearchResult(searchResultDom: unknown) {
    const patcher = this;
    const { plugin } = this;

    plugin.register(
      around(searchResultDom.constructor.prototype, {
        addResult(old: unknown) {
          return function (...args: unknown[]) {
            const result = old.call(this, ...args);
            patcher.patchSearchResultItem(result);
            return result;
          };
        },
      })
    );
  }

  patchSearchResultItem(searchResultItem: unknown) {
    if (this.renderContentMatchesPatched) {
      return;
    }

    const patcher = this;
    const { plugin } = this;

    plugin.register(
      around(searchResultItem.constructor.prototype, {
        renderContentMatches(old: unknown) {
          // todo: do this one level higher
          patcher.renderContentMatchesPatched = true;

          return function (...args: unknown[]) {
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
                ({ content, matches: [[start, end]] }: unknown) =>
                  createPositionFromOffsets(content, start, end)
              );

              const highlights = this.vChildren._children.map(
                ({ content, matches: [[start, end]] }) => {
                  return content.substring(start, end).toLowerCase();
                }
              );

              const deduped = [...new Set(highlights)];

              const firstMatch = this.vChildren._children[0];
              patcher.mountContextTreeOnMatchEl(
                this,
                firstMatch,
                matchPositions,
                deduped
              );

              // we already mounted the whole thing to the first child, so discard the rest
              this.vChildren._children = this.vChildren._children.slice(0, 1);
            } catch (e) {
              patcher.reportError(e, this.file.path);
            }

            return result;
          };
        },
      })
    );
  }

  reportError(error: Error, filePath: string) {
    const message = `Error while mounting Better Search Views tree for file path: ${filePath}`;
    this.currentNotice?.hide();
    this.currentNotice = new Notice(
      `${message}. Please report an issue with the details from the console attached.`,
      errorTimeout
    );
    console.error(`${message}. Reason:`, error);
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
