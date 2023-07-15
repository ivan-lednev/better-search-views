import { SectionWithMatch } from "../components/context-tree/types";
import { For, Show } from "solid-js";
import { MarkdownRenderer } from "obsidian";
import { usePluginContext } from "./plugin-context";

interface MatchSectionProps {
  sectionsWithMatches: SectionWithMatch[];
}

export function MatchSection(props: MatchSectionProps) {
  const { handleClick, handleMouseover, plugin } = usePluginContext();

  return (
    <Show when={props.sectionsWithMatches.length > 0}>
      <div class="search-result-file-matches better-backlinks-ref-item-collection-items">
        <For each={props.sectionsWithMatches}>
          {(section, index) => {
            const filePath = props.sectionsWithMatches[index()].filePath;
            const line =
              props.sectionsWithMatches[index()].cache.position.start.line;

            return (
              <div
                class="search-result-file-match better-backlinks-file-match"
                ref={async (el) =>
                  await MarkdownRenderer.renderMarkdown(
                    section.text,
                    el,
                    "/",
                    plugin
                  )
                }
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
