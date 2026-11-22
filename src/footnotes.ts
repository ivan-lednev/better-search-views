import { Pos, SectionCache } from "obsidian";
import {
  createPositionFromOffsets,
  getTextAtPosition,
} from "./metadata-cache-util/position";

// A footnote definition: "[^id]: body", optionally indented by up to 3 spaces.
const footnoteDefinitionToken = /^ {0,3}\[\^([^\]\s]+)]:[ \t]*/;

// A footnote reference: "[^id]" not followed by a colon.
const footnoteReferenceToken = /\[\^([^\]\s]+)](?!:)/g;

// Inline code spans, so that `[^1]` inside code is left alone.
const inlineCodeSpan = /(`+)(?:[\s\S]*?[^`])?\1(?!`)/g;

// Fenced code blocks.
const fenceStart = /^ {0,3}(```|~~~)/;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function footnoteMarker(id: string, kind: "definition" | "reference") {
  const safeId = escapeHtml(id);
  return `<sup class="better-search-views-footnote better-search-views-footnote-${kind}" data-footnote-id="${safeId}">${safeId}</sup>`;
}

/**
 * The id of the footnote definition this section is, or null if it isn't one.
 */
export function getFootnoteDefinitionId(
  fileContents: string,
  section?: SectionCache,
): string | null {
  if (!section) {
    return null;
  }

  const text = getTextAtPosition(fileContents, section.position);
  const match = text.match(footnoteDefinitionToken);

  return match ? match[1] : null;
}

/**
 * Where a footnote is *referenced*. Definitions usually live at the bottom of
 * a note, so the headings above them say nothing about what the footnote is
 * about; the headings above the reference do.
 */
export function getFirstReferencePosition(
  fileContents: string,
  id: string,
): Pos | null {
  const pattern = new RegExp(`\\[\\^${escapeRegExp(id)}](?!:)`, "g");
  const match = pattern.exec(fileContents);

  if (!match) {
    return null;
  }

  return createPositionFromOffsets(
    fileContents,
    match.index,
    match.index + match[0].length,
  ).position;
}

/**
 * If the match sits inside a footnote definition, build breadcrumbs from the
 * first reference to that footnote instead. Falls back to the match itself.
 */
export function getPositionForBreadcrumbs(
  fileContents: string,
  matchPosition: Pos,
  section?: SectionCache,
): Pos {
  const id = getFootnoteDefinitionId(fileContents, section);

  if (!id) {
    return matchPosition;
  }

  return getFirstReferencePosition(fileContents, id) || matchPosition;
}

function dedentContinuationLines(text: string) {
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : line.replace(/^(?: {1,4}|\t)/, "")))
    .join("\n");
}

function replaceOutsideCode(text: string, transform: (chunk: string) => string) {
  let result = "";
  let lastIndex = 0;

  inlineCodeSpan.lastIndex = 0;

  for (
    let match = inlineCodeSpan.exec(text);
    match !== null;
    match = inlineCodeSpan.exec(text)
  ) {
    result += transform(text.slice(lastIndex, match.index)) + match[0];
    lastIndex = match.index + match[0].length;
  }

  return result + transform(text.slice(lastIndex));
}

/**
 * MarkdownRenderer swallows footnote definitions whose reference is not in the
 * same snippet (they render as nothing), and renders orphaned references as a
 * bare number that reads like a typo. Turn both into explicit markers before
 * rendering.
 */
export function expandFootnoteSyntax(text: string) {
  if (fenceStart.test(text)) {
    return text;
  }

  let result = text;

  const definitionMatch = result.match(footnoteDefinitionToken);

  if (definitionMatch) {
    const body = dedentContinuationLines(
      result.slice(definitionMatch[0].length),
    );
    result = `${footnoteMarker(definitionMatch[1], "definition")} ${body}`;
  }

  return replaceOutsideCode(result, (chunk) =>
    chunk.replace(footnoteReferenceToken, (_match, id: string) =>
      footnoteMarker(id, "reference"),
    ),
  );
}
