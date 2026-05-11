import { Plugin } from "obsidian";
import { Patcher } from "./patcher";

export default class BetterBacklinksPlugin extends Plugin {
  async onload() {
    const patcher = new Patcher(this);
    const patchAllSearchResultHolders = () => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        patcher.patchSearchResultHolder(leaf?.view);
      });
    };
    const patchAllSoon = () => {
      patchAllSearchResultHolders();
      window.setTimeout(patchAllSearchResultHolders, 100);
      window.setTimeout(patchAllSearchResultHolders, 250);
      window.setTimeout(patchAllSearchResultHolders, 500);
      window.setTimeout(patchAllSearchResultHolders, 1000);
      window.setTimeout(patchAllSearchResultHolders, 2000);
      window.setTimeout(patchAllSearchResultHolders, 5000);
    };

    patcher.patchComponent();
    patchAllSoon();
    this.app.workspace.onLayoutReady(patchAllSoon);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", patchAllSoon),
    );
    this.registerEvent(this.app.workspace.on("file-open", patchAllSoon));
  }
}
