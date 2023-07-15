import { AnyTree } from "../ui/solid/tree";

export const sortOptions = {
  alphabetical: "File name (A to Z)",
  alphabeticalReverse: "File name (Z to A)",
  byModifiedTime: "Modified time (new to old)",
  byModifiedTimeReverse: "Modified time (old to new)",
  byCreatedTime: "Created time (new to old)",
  byCreatedTimeReverse: " Created time (old to new) ",
};

export function sortFiles(
  files: AnyTree[],
  sortOption: keyof typeof sortOptions
) {
  return files.slice().sort((a, b) => {
    switch (sortOption) {
      case "alphabetical":
        // todo: use name
        return a.filePath.localeCompare(b.filePath);
      case "alphabeticalReverse":
        return b.filePath.localeCompare(a.filePath);
      case "byModifiedTime":
        return b.stat.mtime - a.stat.mtime;
      case "byModifiedTimeReverse":
        return a.stat.mtime - b.stat.mtime;
      case "byCreatedTime":
        return b.stat.ctime - a.stat.ctime;
      case "byCreatedTimeReverse":
        return a.stat.ctime - b.stat.ctime;
      default:
        throw new Error(`Unknown sort option: ${sortOption}`);
    }
  });
}
