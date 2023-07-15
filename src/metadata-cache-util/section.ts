import { Pos, SectionCache } from "obsidian";
import { doesPositionIncludeAnother } from "./position";

export function getSectionContaining(
  searchedForPosition: Pos,
  sections: SectionCache[]
) {
  return sections.find(({ position }) =>
    doesPositionIncludeAnother(position, searchedForPosition)
  );
}

export function getFirstSectionUnder(position: Pos, sections: SectionCache[]) {
  return sections.find(
    (section) => section.position.start.line > position.start.line
  );
}
