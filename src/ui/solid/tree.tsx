import { createSignal, For, Show } from "solid-js";
import { Branch } from "./branch";
import { produce } from "immer";
import Mark from "mark.js";
import { CacheItem, debounce, FileStats } from "obsidian";
import { createInfiniteScroll } from "@solid-primitives/pagination";
import { SlidersHorizontalIcon } from "./icons/sliders-horizontal-icon";
import {
  HeadingContextTree,
  ListContextTree,
  SectionWithMatch,
} from "../../context-tree/types";
import { sortFiles, sortOptions } from "../../context-tree/sort-files";
import { searchContextTree } from "../../context-tree/search/search-context-tree";
import { collapseEmptyNodes } from "../../context-tree/collapse/collapse-empty-nodes";

export interface AnyTree {
  breadcrumbs?: string[];
  text: string;
  sectionsWithMatches: SectionWithMatch[];
  childLists?: ListContextTree[];
  childHeadings?: HeadingContextTree[];
  filePath?: string;
  cache?: CacheItem;
  stat?: FileStats;
}

interface TreeProps {
  fileContextTrees: AnyTree[];
}

// todo: set this to a smaller number; if the intersection observer is in view after first render and there are more
//  pages to show, do that
const pageSize = 15;

function getCountMessage(count: number) {
  return `${count} ${count === 1 ? "reference" : "references"}`;
}

export function Tree(props: TreeProps) {
  const [filter, setFilter] = createSignal("");
  const [sortOption, setSortOption] =
    createSignal<keyof typeof sortOptions>("byModifiedTime");

  const [showSearchParams, setShowSearchParams] = createSignal(false);
  const [collapseResults, setCollapseResults] = createSignal(false);

  // todo: this is a mess
  const sortedFilteredCollapsedTrees = () =>
    sortFiles(props.fileContextTrees, sortOption())
      .map((tree) => {
        const ref = { tree };
        return produce(ref, (draft) => {
          if (filter()) {
            draft.tree = searchContextTree(draft.tree, filter());
          }
        }).tree;
      })
      .filter(Boolean)
      .map((tree) =>
        produce(tree, (draft) => {
          collapseEmptyNodes(draft);
        })
      );

  const getNextPage = (page: number) => {
    const pageStart = pageSize * page;
    const pageEnd = pageSize * page + pageSize;
    const nextPage = sortedFilteredCollapsedTrees().slice(pageStart, pageEnd);
    return Promise.resolve(nextPage);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pages, infiniteScrollLoader, { end, setPages }] =
    createInfiniteScroll(getNextPage);
  const resetInfiniteScroll = async () => setPages(await getNextPage(0));

  let markContextRef: HTMLDivElement;

  const handleFilterInput = async (value: string) => {
    setFilter(value);
    await resetInfiniteScroll();
    if (value) {
      new Mark(markContextRef).mark(value, { separateWordSearch: false });
    }
  };

  const debouncedHandleFilterInput = debounce(handleFilterInput, 100, true);

  const handleSortInput = async (event: {
    currentTarget: HTMLSelectElement;
  }) => {
    setSortOption(event.currentTarget.value as keyof typeof sortOptions);
    await resetInfiniteScroll();
  };

  return (
    <>
      <div class="search-row">
        <div class="search-input-container global-search-input-container">
          <input
            type="search"
            placeholder="Filter..."
            spellcheck={false}
            value={filter()}
            onInput={async (event: { currentTarget: HTMLInputElement }) =>
              await debouncedHandleFilterInput(event.currentTarget.value)
            }
          />
          <div
            class="search-input-clear-button"
            aria-label="Clear search"
            onClick={() => handleFilterInput("")}
          />
        </div>
        <div
          class={`clickable-icon ${showSearchParams() ? "is-active" : ""}`}
          aria-label="Search settings"
          onClick={() => setShowSearchParams(!showSearchParams())}
        >
          <SlidersHorizontalIcon />
        </div>
      </div>
      <Show when={showSearchParams()}>
        <div class="search-params" style="">
          <div class="setting-item mod-toggle">
            <div class="setting-item-info">
              <div class="setting-item-name">Collapse results</div>
              <div class="setting-item-description"></div>
            </div>
            <div class="setting-item-control">
              <div
                class={`checkbox-container mod-small ${
                  collapseResults() ? "is-enabled" : ""
                }`}
                onClick={async () => {
                  setCollapseResults(!collapseResults());
                  await resetInfiniteScroll();
                }}
              >
                <input type="checkbox" tabindex="0" />
              </div>
            </div>
          </div>
        </div>
      </Show>
      <div class="search-results-info" style="">
        <div class="clickable-icon search-results-result-count">
          <span>{getCountMessage(props.fileContextTrees.length)}</span>
        </div>
        <select class="dropdown" onChange={handleSortInput}>
          <For each={Object.entries(sortOptions)}>
            {([value, text]) => (
              <option value={value} selected={value === sortOption()}>
                {text}
              </option>
            )}
          </For>
        </select>
      </div>
      <div
        ref={markContextRef}
        class="better-backlinks-results-container search-result-container"
      >
        <For each={pages()}>
          {(tree) => (
            <Branch
              contextTree={tree}
              initialCollapseResults={collapseResults()}
            />
          )}
        </For>
        <Show when={!end()}>
          <div use:infiniteScrollLoader style={{ height: "100px" }} />
        </Show>
      </div>
    </>
  );
}
