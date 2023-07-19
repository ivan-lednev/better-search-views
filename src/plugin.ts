import { App, Notice, Plugin, PluginManifest } from "obsidian";
import { Patcher } from "./patch";

export default class BetterBacklinksPlugin extends Plugin {
  async onload() {
    const patcher = new Patcher(this);
    patcher.patchViewRegistry();
  }
}
