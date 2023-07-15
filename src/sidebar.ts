import { ItemView, Workspace, WorkspaceLeaf } from "obsidian";
import { mountContextTree } from "./ui/mount-context-tree";
import BetterBacklinksPlugin from "./plugin";

export class BetterBacklinksView extends ItemView {
  static readonly VIEW_TYPE = "better-backlinks";
  static readonly DISPLAY_TEXT = "Better Backlinks";

  constructor(
    leaf: WorkspaceLeaf,
    private readonly workspace: Workspace,
    private readonly plugin: BetterBacklinksPlugin
  ) {
    super(leaf);
  }

  getViewType() {
    return BetterBacklinksView.VIEW_TYPE;
  }

  getDisplayText() {
    return BetterBacklinksView.DISPLAY_TEXT;
  }

  getIcon() {
    return "links-coming-in";
  }

  async onOpen() {
    const activeFilePath = this.workspace.getActiveFile()?.path;
    if (activeFilePath) {
      await this.updateView(activeFilePath);
    }
  }

  async updateView(path: string) {
    this.containerEl.empty();
    // todo: dispose
    await mountContextTree({
      path,
      el: this.containerEl,
      plugin: this.plugin,
    });
  }

  async onClose() {}
}
