import { For, Show } from "solid-js";
import { MarkdownRenderer } from "obsidian";
import { usePluginContext } from "./plugin-context";
import { SectionWithMatch } from "../../context-tree/types";

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

export function MatchSection(props: MatchSectionProps) {
  const { handleClick, handleMouseover, plugin } = usePluginContext();

  return (
    <Show when={props.sectionsWithMatches.length > 0}>
      <div class="search-result-file-matches better-search-views-ref-item-collection-items">
        <For each={props.sectionsWithMatches}>
          {(section, index) => {
            const filePath = props.sectionsWithMatches[index()].filePath;
            const line =
              props.sectionsWithMatches[index()].cache.position.start.line;

            return (
              <div
                class="search-result-file-match better-search-views-file-match markdown-preview-view"
                ref={async (el) => {
                  await MarkdownRenderer.renderMarkdown(
                    section.text,
                    el,
                    filePath,
                    plugin
                  );
                }}
                onClick={async () => {
                  await handleClick(filePath, line);
                }}
                onMouseOver={(event) => {
                  // todo: remove
                  // @ts-ignore
                  handleMouseover(event, filePath, line);
                }}
              />
            );
          }}
        </For>
      </div>
    </Show>
  );
}
