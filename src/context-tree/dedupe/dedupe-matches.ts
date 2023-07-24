import { ContextTree, SectionWithMatch } from "../../types";
import { isSamePosition } from "../../metadata-cache-util/position";

export function dedupeMatches(tree: ContextTree): ContextTree {
  return {
    ...tree,
    sectionsWithMatches: dedupe(tree.sectionsWithMatches),
    branches: tree.branches.map((branch) => dedupeMatches(branch)),
  };
}

function areMatchesInSameSection(a: SectionWithMatch, b: SectionWithMatch) {
  return (
    a.text === b.text && isSamePosition(a.cache.position, b.cache.position)
  );
}

function dedupe(matches: SectionWithMatch[]) {
  return matches.filter(
    (match: SectionWithMatch, index: number, array: SectionWithMatch[]) =>
      index ===
      array.findIndex((inner) => areMatchesInSameSection(inner, match))
  );
}
