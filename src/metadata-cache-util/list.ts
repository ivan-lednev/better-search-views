import { ListItemCache, Pos } from "obsidian";
import { doesPositionIncludeAnother } from "./position";

export function getListItemWithDescendants(
  listItemIndex: number,
  listItems: ListItemCache[]
) {
  const rootListItem = listItems[listItemIndex];
  const listItemWithDescendants = [rootListItem];

  for (let i = listItemIndex + 1; i < listItems.length; i++) {
    const nextItem = listItems[i];
    if (nextItem.parent < rootListItem.position.start.line) {
      return listItemWithDescendants;
    }
    listItemWithDescendants.push(nextItem);
  }

  return listItemWithDescendants;
}

export function getListBreadcrumbs(position: Pos, listItems: ListItemCache[]) {
  const listBreadcrumbs: ListItemCache[] = [];

  if (listItems.length === 0) {
    return listBreadcrumbs;
  }

  const thisItemIndex = getListItemIndexContaining(position, listItems);
  const isPositionOutsideListItem = thisItemIndex < 0;

  if (isPositionOutsideListItem) {
    return listBreadcrumbs;
  }

  const thisItem = listItems[thisItemIndex];
  let currentParent = thisItem.parent;

  if (isTopLevelListItem(thisItem)) {
    return listBreadcrumbs;
  }

  for (let i = thisItemIndex - 1; i >= 0; i--) {
    const currentItem = listItems[i];

    const currentItemIsHigherUp = currentItem.parent < currentParent;
    if (currentItemIsHigherUp) {
      listBreadcrumbs.unshift(currentItem);
      currentParent = currentItem.parent;
    }

    if (isTopLevelListItem(currentItem)) {
      return listBreadcrumbs;
    }
  }

  return listBreadcrumbs;
}

function isTopLevelListItem(listItem: ListItemCache) {
  return listItem.parent < 0;
}

export function getListItemIndexContaining(
  searchedForPosition: Pos,
  listItems: ListItemCache[]
) {
  return listItems.findIndex(({ position }) =>
    doesPositionIncludeAnother(position, searchedForPosition)
  );
}

export function isPositionInList(position: Pos, listItems: ListItemCache[]) {
  return getListItemIndexContaining(position, listItems) >= 0;
}
