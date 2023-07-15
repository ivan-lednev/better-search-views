import { Component, MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import { BetterBacklinksView } from "./sidebar";
import { BetterBacklinksSettingTab } from "./setting-tab";
import * as patch from "monkey-around";
import { mountContextTree } from "./ui/mount-context-tree";

interface BetterBacklinksSettings {
  mySetting: string;
}

const defaultSettings: BetterBacklinksSettings = {
  mySetting: "default",
};

export default class BetterBacklinksPlugin extends Plugin {
  settings: BetterBacklinksSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new BetterBacklinksSettingTab(this.app, this));

    this.registerView(
      BetterBacklinksView.VIEW_TYPE,
      (leaf) => new BetterBacklinksView(leaf, this.app.workspace, this)
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", async () => {
        const activeMarkdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);

        if (!activeMarkdownView) {
          return;
        }

        this.app.workspace
          .getLeavesOfType(BetterBacklinksView.VIEW_TYPE)
          .forEach(({ view }) => {
            if (view instanceof BetterBacklinksView) {
              view.updateView(activeMarkdownView.file.path);
            }
          });
      })
    );

    const plugin = this;

    this.register(
      // todo: use Proxy trap terminology for this
      patch.around(Component.prototype, {
        load(old: any) {
          return function (...args: any[]) {
            if (this.backlinksEl) {
              // todo: fix timeout
              setTimeout(() => {
                // const mountPoint = createDiv({ cls: "better-backlinks" });
                // this.backlinksEl.before(mountPoint);

                this.backlinksEl.empty();
                // todo: don't hardcode this
                mountContextTree({
                  path: this.file.path,
                  el: this.backlinksEl,
                  plugin,
                });
              }, 1000);
            }
            old.call(this, ...args);
          };
        },
      })
    );

    this.addCommand({
      id: "show-backlinks",
      name: "Show Backlinks",
      callback: () => this.activateView(),
    });
  }

  onunload() {}

  async activateView() {
    this.app.workspace.detachLeavesOfType(BetterBacklinksView.VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: BetterBacklinksView.VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(BetterBacklinksView.VIEW_TYPE)[0]
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, defaultSettings, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
