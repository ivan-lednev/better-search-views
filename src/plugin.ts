import { Plugin } from "obsidian";
import { Patcher } from "./patcher";

export default class BetterBacklinksPlugin extends Plugin {
  async onload() {
    const patcher = new Patcher(this);
    // patcher.patchViewRegistry();
    patcher.patchSearchView();
  }
}
