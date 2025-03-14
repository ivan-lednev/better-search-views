import { Plugin, PluginSettingTab, App, Setting, Notice } from "obsidian";
import { Patcher } from "./patcher";

export interface BetterSearchViewsSettings {
  enhanceSearchView: boolean;
  enhanceBacklinksView: boolean;
}

export const DEFAULT_SETTINGS: BetterSearchViewsSettings = {
  enhanceSearchView: true,
  enhanceBacklinksView: true,
};

export default class BetterSearchViewsPlugin extends Plugin {
  settings: BetterSearchViewsSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new BetterSearchViewsSettingTab(this.app, this));

    const patcher = new Patcher(this);
    patcher.patchComponent();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class BetterSearchViewsSettingTab extends PluginSettingTab {
  plugin: BetterSearchViewsPlugin;

  constructor(app: App, plugin: BetterSearchViewsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Better Search Views Settings' });

    // Add notice about reloading
    containerEl.createEl('p', {
      cls: 'setting-item-description',
      text: 'Note: Changes to these settings require reloading the plugin or restarting Obsidian to take effect.'
    });

    new Setting(containerEl)
      .setName('Enhance Search View')
      .setDesc('Apply improvements to the search view. Note that enabling this may cause performance issues with very large search results.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enhanceSearchView)
        .onChange(async (value) => {
          this.plugin.settings.enhanceSearchView = value;
          await this.plugin.saveSettings();
          new Notice('Please reload the plugin or restart Obsidian for the changes to take effect.');
        }));

    // Add performance warning for search
    containerEl.createEl('div', {
      cls: 'setting-item-description performance-warning',
      text: '⚠️ Performance Warning: Enhanced search can slow down Obsidian when dealing with a large number of search results. Consider disabling this feature if you experience lag during searches.'
    }).style.marginBottom = '1em';

    new Setting(containerEl)
      .setName('Enhance Backlinks View')
      .setDesc('Apply improvements to the backlinks view.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enhanceBacklinksView)
        .onChange(async (value) => {
          this.plugin.settings.enhanceBacklinksView = value;
          await this.plugin.saveSettings();
          new Notice('Please reload the plugin or restart Obsidian for the changes to take effect.');
        }));
  }
}
