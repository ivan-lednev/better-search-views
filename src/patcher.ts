import { Component, Notice } from "obsidian";
import { around } from "monkey-around";
import { createPositionFromOffsets } from "./metadata-cache-util/position";
import { createContextTree } from "./context-tree/create/create-context-tree";
import { renderContextTree } from "./ui/solid/render-context-tree";
import BetterSearchViewsPlugin from "./plugin";
import { wikiLinkBrackets } from "./patterns";
import { DisposerRegistry } from "./disposer-registry";
import { dedupeMatches } from "./context-tree/dedupe/dedupe-matches";

const errorTimeout = 10000;
const patchVersion = 6;

// todo: add types
function getHighlightsFromVChild(vChild: any) {
  const { content, matches } = vChild;
  const firstMatch = matches[0];
  const [start, end] = firstMatch;

  return content
    .substring(start, end)
    .toLowerCase()
    .replace(wikiLinkBrackets, "");
}

export class Patcher {
  private readonly wrappedMatches = new WeakSet();
  private readonly wrappedSearchResultItems = new WeakSet();
  private readonly patchedSearchResultDomConstructors = new WeakSet();
  private readonly patchedSearchResultItemConstructors = new WeakSet();
  private currentNotice: Notice | undefined;
  private readonly disposerRegistry = new DisposerRegistry();

  constructor(private readonly plugin: BetterSearchViewsPlugin) {}

  patchComponent() {
    const patcher = this;
    this.plugin.register(
      around(Component.prototype, {
        addChild(old: Component["addChild"]) {
          return function (child: any, ...args: any[]) {
            const thisIsSearchView = this.hasOwnProperty("searchQuery");
            const hasBacklinks = child?.backlinkDom || child?.unlinkedDom;

            if (thisIsSearchView || hasBacklinks) {
              try {
                patcher.patchSearchResultHolder(child);
              } catch (error) {
                patcher.reportError(
                  error,
                  "Error while patching Obsidian internals",
                );
              }
            }

            return old.call(this, child, ...args);
          };
        },
      }),
    );
  }

  patchSearchResultDom(searchResultDom: any) {
    const patcher = this;

    const searchResultDomConstructor = searchResultDom?.constructor;
    if (!searchResultDomConstructor) {
      return;
    }

    const searchResultDomPrototype = searchResultDomConstructor.prototype;
    if (searchResultDomPrototype.__betterSearchViewsAddResultPatched === patchVersion) {
      this.patchedSearchResultDomConstructors.add(searchResultDomConstructor);
      return;
    }

    this.patchedSearchResultDomConstructors.delete(searchResultDomConstructor);
    const removePatch = around(searchResultDomPrototype, {
      addResult(old: any) {
        return function (...args: any[]) {
          patcher.disposerRegistry.onAddResult(this);

          const result = old.call(this, ...args);

          try {
            patcher.patchSearchResultItem(result);
            if (result?.rendered) {
              result.renderContentMatches();
            }
          } catch (error) {
            patcher.reportError(
              error,
              "Error while patching Obsidian internals",
            );
          }

          return result;
        };
      },
      emptyResults(old: any) {
        return function (...args: any[]) {
          patcher.disposerRegistry.onEmptyResults(this);

          return old.call(this, ...args);
        };
      },
    });

    searchResultDomPrototype.__betterSearchViewsAddResultPatched = patchVersion;
    this.plugin.register(() => {
      removePatch();
      delete searchResultDomPrototype.__betterSearchViewsAddResultPatched;
    });
    this.patchedSearchResultDomConstructors.add(searchResultDomConstructor);
  }

  patchSearchResultItem(searchResultItem: any) {
    const patcher = this;

    const searchResultItemConstructor = searchResultItem?.constructor;
    if (!searchResultItemConstructor) {
      return;
    }

    const searchResultItemPrototype = searchResultItemConstructor.prototype;
    if (
      searchResultItemPrototype.__betterSearchViewsRenderContentMatchesPatched ===
      patchVersion
    ) {
      this.patchedSearchResultItemConstructors.add(searchResultItemConstructor);
      return;
    }

    this.patchedSearchResultItemConstructors.delete(searchResultItemConstructor);
    const removePatch = around(searchResultItemPrototype, {
      renderContentMatches(old: any) {
        return function (...args: any[]) {
          const result = old.call(this, ...args);

          try {
            patcher.mountContextTreeForSearchResultItem(this);
          } catch (e) {
            patcher.reportError(
              e,
              `Failed to mount context tree for file path: ${this.file.path}`,
            );
          }

          return result;
        };
      },
    });

    searchResultItemPrototype.__betterSearchViewsRenderContentMatchesPatched =
      patchVersion;
    this.plugin.register(() => {
      removePatch();
      delete searchResultItemPrototype.__betterSearchViewsRenderContentMatchesPatched;
    });
    this.patchedSearchResultItemConstructors.add(searchResultItemConstructor);
  }

  mountContextTreeForSearchResultItem(searchResultItem: any) {
    const alreadyRenderedTree = searchResultItem?.el.querySelector(
      ".better-search-views-tree",
    );
    if (
      (this.wrappedSearchResultItems.has(searchResultItem) &&
        alreadyRenderedTree) ||
      !searchResultItem?.vChildren?._children ||
      searchResultItem.vChildren._children.length === 0
    ) {
      return;
    }

    const contentMatches = this.getMountableContentMatches(searchResultItem);

    if (contentMatches.length === 0) {
      return;
    }

    const matchPositions = contentMatches.map((child: any) => {
      const { content, matches } = child;
      const [start, end] = matches[0];
      return createPositionFromOffsets(content, start, end);
    });

    const highlights: string[] = contentMatches.map(getHighlightsFromVChild);
    const deduped = [...new Set(highlights)];
    const firstMatch = contentMatches[0];

    this.disposerRegistry.onAddResult(searchResultItem.parentDom);
    this.mountContextTreeOnMatchEl(
      searchResultItem,
      firstMatch,
      matchPositions,
      deduped,
      searchResultItem.parent.infinityScroll,
    );

    searchResultItem.vChildren._children = [firstMatch];
    this.wrappedSearchResultItems.add(searchResultItem);
  }

  reportError(error: any, message: string) {
    this.currentNotice?.hide();
    this.currentNotice = new Notice(
      `Better Search Views: ${message}. Please report an issue with the details from the console attached.`,
      errorTimeout,
    );
    console.error(`${message}. Reason:`, error);
  }

  mountContextTreeOnMatchEl(
    container: any,
    match: any,
    positions: any[],
    highlights: string[],
    infinityScroll: any,
  ) {
    if (
      this.wrappedMatches.has(match) &&
      match?.el.querySelector(".better-search-views-tree")
    ) {
      return;
    }

    this.wrappedMatches.add(match);

    const { cache, content } = match;
    const { file } = container;

    const matchIsOnlyInFileName = !cache.sections || content === "";

    if (file.extension === "canvas" || matchIsOnlyInFileName) {
      return;
    }

    const contextTree = createContextTree({
      positions,
      fileContents: content,
      stat: file.stat,
      filePath: file.path,
      ...cache,
    });

    const mountPoint = createDiv();
    const oldEl = match.el;

    const dispose = renderContextTree({
      highlights,
      contextTree: dedupeMatches(contextTree),
      el: mountPoint,
      plugin: this.plugin,
      infinityScroll,
    });

    this.disposerRegistry.addOnEmptyResultsCallback(dispose);
    if (oldEl?.parentNode) {
      oldEl.replaceWith(mountPoint);
    } else if (container.childrenEl?.isConnected) {
      container.childrenEl.empty();
      container.childrenEl.appendChild(mountPoint);
    }

    match.el = mountPoint;
  }

  patchExistingResults(searchResultDom: any) {
    for (const result of searchResultDom?.vChildren?._children?.slice() || []) {
      this.patchSearchResultItem(result);
      if (
        result?.rendered &&
        !result?.el?.querySelector(".better-search-views-tree") &&
        this.getMountableContentMatches(result).length > 0
      ) {
        result.renderContentMatches();
        this.mountContextTreeForSearchResultItem(result);
      }
    }
  }

  private getMountableContentMatches(searchResultItem: any) {
    return (searchResultItem?.vChildren?._children || []).filter(
      (child: any) => {
        const firstMatch = child?.matches?.[0];
        return child.content && firstMatch && !Object.hasOwn(firstMatch, "key");
      },
    );
  }

  patchSearchResultHolder(holder: any) {
    const searchResultDoms = [
      holder?.dom,
      holder?.backlinkDom,
      holder?.unlinkedDom,
    ];

    for (const searchResultDom of searchResultDoms) {
      if (searchResultDom?.addResult?.call) {
        this.patchSearchResultDom(searchResultDom);
        this.patchExistingResults(searchResultDom);
      }
    }

    for (const child of holder?._children || []) {
      if (child?.backlinkDom?.addResult || child?.unlinkedDom?.addResult || child?.dom) {
        this.patchSearchResultHolder(child);
      }
    }
  }
}
