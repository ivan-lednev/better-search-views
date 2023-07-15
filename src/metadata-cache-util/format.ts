import { ListItemCache } from "obsidian";
import { getTextFromLineStartToPositionEnd } from "./position";

export const formatListWithDescendants = (
  textInput: string,
  listItems: ListItemCache[]
) => {
  const root = listItems[0];
  const leadingSpacesCount = root.position.start.col;
  return listItems
    .map((itemCache) =>
      getTextFromLineStartToPositionEnd(textInput, itemCache.position).slice(
        leadingSpacesCount
      )
    )
    .join("\n");
};
