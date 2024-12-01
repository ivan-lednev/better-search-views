import { For, onCleanup, Show } from "solid-js";
import { Component, MarkdownRenderer } from "obsidian";
import { usePluginContext } from "./plugin-context";
import { SectionWithMatch } from "../../types";

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

export function MatchSection(props: MatchSectionProps) {
  const { handleClick, handleMouseover, app } = usePluginContext();
  const matchLifecycleManager = new Component();

  onCleanup(() => {
    matchLifecycleManager.unload();
  });

  return (
    <Show when={props.sectionsWithMatches.length > 0}>
      <div class="search-result-file-matches">
        <For each={props.sectionsWithMatches}>
          {(section) => {
            const line = section.cache.position.start.line;

            return (
              <div
                class="search-result-file-match better-search-views-file-match markdown-preview-view markdown-rendered"
                ref={async (el) => {
                  await MarkdownRenderer.render(
                    app,
                    section.text,
                    el,
                    section.filePath,
                    matchLifecycleManager
                  );

                  matchLifecycleManager.load();
                }}
                onClick={async (event) => {
                  await handleClick(event, section.filePath, line);
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
