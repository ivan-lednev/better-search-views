import { Component, Notice } from "obsidian";
import { around } from "monkey-around";
import { createPositionFromOffsets } from "./metadata-cache-util/position";
import { createContextTree } from "./context-tree/create/create-context-tree";
import { renderContextTree } from "./ui/solid/render-context-tree";
import BetterSearchViewsPlugin from "./plugin";
import { wikiLinkBrackets } from "./patterns";
import { DisposerRegistry } from "./disposer-registry";
import { dedupeMatches } from "./context-tree/dedupe/dedupe-matches";
import { getSectionContaining } from "./metadata-cache-util/section";

const errorTimeout = 10000;

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

// Check if a vChild match is inside a code block
function isMatchInCodeBlock(child: any): boolean {
  const { content, matches, cache } = child;
  if (!cache?.sections || !matches?.[0]) {
    return false;
  }
  
  const firstMatch = matches[0];
  // Skip property matches (they have a 'key' property)
  if (Object.hasOwn(firstMatch, "key")) {
    return false;
  }
  
  const [start, end] = firstMatch;
  const matchPos = createPositionFromOffsets(content, start, end);
  const section = getSectionContaining(matchPos.position, cache.sections);
  
  return section?.type === "code";
}

export class Patcher {
  private readonly wrappedMatches = new WeakSet();
  private readonly wrappedSearchResultItems = new WeakSet();
  private currentNotice: Notice;
  private triedPatchingSearchResultItem = false;
  private triedPatchingRenderContentMatches = false;
  private readonly disposerRegistry = new DisposerRegistry();

  constructor(private readonly plugin: BetterSearchViewsPlugin) {}

  patchComponent() {
    const patcher = this;
    this.plugin.register(
      around(Component.prototype, {
        addChild(old: Component["addChild"]) {
          return function (child: any, ...args: any[]) {
            const thisIsSearchView = this.hasOwnProperty("searchQuery");
            const hasBacklinks = child?.backlinkDom;

            if (
              (thisIsSearchView || hasBacklinks) &&
              !patcher.triedPatchingSearchResultItem
            ) {
              patcher.triedPatchingSearchResultItem = true;
              try {
                patcher.patchSearchResultDom(child.dom || child.backlinkDom);
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
    this.plugin.register(
      around(searchResultDom.constructor.prototype, {
        addResult(old: any) {
          return function (...args: any[]) {
            patcher.disposerRegistry.onAddResult(this);

            const result = old.call(this, ...args);

            if (!patcher.triedPatchingRenderContentMatches) {
              patcher.triedPatchingRenderContentMatches = true;
              try {
                patcher.patchSearchResultItem(result);
              } catch (error) {
                patcher.reportError(
                  error,
                  "Error while patching Obsidian internals",
                );
              }
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
      }),
    );
  }

  patchSearchResultItem(searchResultItem: any) {
    const patcher = this;
    this.plugin.register(
      around(searchResultItem.constructor.prototype, {
        renderContentMatches(old: any) {
          return function (...args: any[]) {
            const result = old.call(this, ...args);

            // todo: clean this up
            if (
              patcher.wrappedSearchResultItems.has(this) ||
              !this.vChildren._children ||
              this.vChildren._children.length === 0
            ) {
              return result;
            }

            patcher.wrappedSearchResultItems.add(this);

            try {
              // Separate code block matches from non-code block matches
              const codeBlockChildren: any[] = [];
              const nonCodeBlockChildren: any[] = [];
              
              for (const child of this.vChildren._children) {
                if (isMatchInCodeBlock(child)) {
                  codeBlockChildren.push(child);
                } else {
                  nonCodeBlockChildren.push(child);
                }
              }
              
              // If all matches are in code blocks, let Obsidian handle them all
              if (nonCodeBlockChildren.length === 0) {
                return result;
              }

              let someMatchIsInProperties = false;

              const matchPositions = nonCodeBlockChildren.map(
                // todo: works only for one match per block
                (child: any) => {
                  const { content, matches } = child;
                  const firstMatch = matches[0];

                  if (Object.hasOwn(firstMatch, "key")) {
                    someMatchIsInProperties = true;
                    return null;
                  }

                  const [start, end] = firstMatch;
                  return createPositionFromOffsets(content, start, end);
                },
              );

              if (someMatchIsInProperties) {
                return result;
              }

              // todo: move out
              const highlights: string[] = nonCodeBlockChildren.map(
                getHighlightsFromVChild,
              );

              const deduped = [...new Set(highlights)];

              const firstNonCodeBlockMatch = nonCodeBlockChildren[0];
              patcher.mountContextTreeOnMatchEl(
                this,
                firstNonCodeBlockMatch,
                matchPositions,
                deduped,
                this.parent.infinityScroll,
              );

              // Keep only the first non-code-block child (for our custom rendering)
              // plus all code block children (for Obsidian's default rendering)
              this.vChildren._children = [nonCodeBlockChildren[0], ...codeBlockChildren];
            } catch (e) {
              patcher.reportError(
                e,
                `Failed to mount context tree for file path: ${this.file.path}`,
              );
            }

            return result;
          };
        },
      }),
    );
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
    if (this.wrappedMatches.has(match)) {
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

    const dispose = renderContextTree({
      highlights,
      contextTree: dedupeMatches(contextTree),
      el: mountPoint,
      plugin: this.plugin,
      infinityScroll,
    });

    this.disposerRegistry.addOnEmptyResultsCallback(dispose);

    // Instead of replacing match.el entirely, we preserve the original element
    // and append our custom content to it. This is important because Obsidian
    // adds the "Link" button for unlinked mentions to match.el on hover.
    // If we replace match.el, Obsidian can no longer find the element to add
    // the button to.
    
    // Clear existing content from match.el while preserving the element itself
    // We need to preserve any buttons that Obsidian might have already added
    const existingLinkButton = match.el.querySelector('.search-result-file-match-replace-button');
    const existingHoverButtons = match.el.querySelectorAll('.search-result-hover-button');
    
    match.el.empty();
    
    // Append our custom rendered content
    match.el.appendChild(mountPoint);
    
    // Re-append the Link button if it exists (for unlinked mentions)
    if (existingLinkButton) {
      match.el.appendChild(existingLinkButton);
    }
    
    // Re-append hover buttons if they exist
    existingHoverButtons.forEach((button: Element) => {
      match.el.appendChild(button);
    });
  }
}
