import { For, onCleanup, Show } from "solid-js";
import { Component, MarkdownRenderer } from "obsidian";
import { usePluginContext } from "./plugin-context";
import { SectionWithMatch } from "../../types";

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

export function MatchSection(props: MatchSectionProps) {
  const { handleClick, handleMouseover } = usePluginContext();
  const matchLifecycleManager = new Component();

  onCleanup(() => {
    matchLifecycleManager.unload();
  });

  return (
    <Show when={props.sectionsWithMatches.length > 0}>
      <div class="search-result-file-matches better-search-views-ref-item-collection-items">
        <For each={props.sectionsWithMatches}>
          {(section, index) => {
            const line = section.cache.position.start.line;

            return (
              <div
                class="search-result-file-match better-search-views-file-match markdown-preview-view markdown-rendered"
                ref={async (el) => {
                  await MarkdownRenderer.renderMarkdown(
                    section.text,
                    el,
                    section.filePath,
                    matchLifecycleManager
                  );

                  matchLifecycleManager.load();
                }}
                onClick={async () => {
                  await handleClick(section.filePath, line);
                }}
                onMouseOver={(event) => {
                  handleMouseover(event, section.filePath, line);
                }}
              />
            );
          }}
        </For>
      </div>
    </Show>
  );
}
