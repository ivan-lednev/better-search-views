import { Pos } from "obsidian";

export const getTextAtPosition = (textInput: string, pos: Pos) =>
  textInput.substring(pos.start.offset, pos.end.offset);

export const getTextFromLineStartToPositionEnd = (
    textInput: string,
    pos: Pos
) => textInput.substring(pos.start.offset - pos.start.col, pos.end.offset);

export const doesPositionIncludeAnother = (container: Pos, child: Pos) =>
    container.start.offset <= child.start.offset &&
    container.end.offset >= child.end.offset;

export function isSamePosition(a?: Pos, b?: Pos) {
  return (
    a && b && a.start.offset === b.start.offset && a.end.offset === b.end.offset
  );
}