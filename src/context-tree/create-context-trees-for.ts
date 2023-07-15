import { LinkCache, MetadataCache, TFile, Vault } from "obsidian";
import { PathsWithLinks } from "../ui/mount-context-tree";
import { createContextTree } from "./create/create-context-tree";

export function createContextTreesFor(
  pathsWithLinks: PathsWithLinks,
  vault: Vault,
  metadataCache: MetadataCache
) {
  return Promise.all(
    Object.entries(pathsWithLinks).map(async ([path, links]) => {
      const file = metadataCache.getFirstLinkpathDest(path, "/");
      if (!file) {
        throw new Error(`Did not find link path destination for ${path}`);
      }

      const resolvedFileContents = await vault.cachedRead(file);
      const fileCache = metadataCache.getFileCache(file);

      return createContextTree({
        filePath: path,
        stat: file.stat,
        fileContents: resolvedFileContents,
        linksToTarget: links,
        ...fileCache,
      });
    })
  );
}
