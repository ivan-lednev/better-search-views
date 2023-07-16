import { App, Component, TFile } from "obsidian";
import { mountContextTree } from "./ui/mount-context-tree";
import BetterBacklinksPlugin from "./plugin";

export class EmbeddedBacklinksComponent {
  file?: TFile;

  constructor(
    private readonly app: App,
    private readonly plugin: BetterBacklinksPlugin,
    private readonly el: HTMLElement
  ) {}

  async update() {
    if (!this.file?.path) {
      return;
    }

    this.el.empty();
    const path = this.file.path;

    await mountContextTree({
      path,
      plugin: this.plugin,
      el: this.el,
    });
  }

  updateShowBacklinks() {
    throw new Error("Not handled");
  }

  load() {
    throw new Error("Not handled");
  }

  unload() {
    throw new Error("Not handled");
  }

  onload() {
    // todo: make it work
    // this.registerEvent(
    //   e.metadataCache.on("resolve", this.onMetadataChanged, this)
    // );
    // this.registerEvent(t.on("create", this.onFileChanged, this));
    // this.registerEvent(t.on("modify", this.onFileChanged, this));
    // this.registerEvent(t.on("rename", this.onFileRename, this));
    // this.registerEvent(t.on("delete", this.onFileDeleted, this));
  }

  onunload() {
    throw new Error("Not handled");
  }
}
