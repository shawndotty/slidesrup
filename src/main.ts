import { Plugin } from "obsidian";
import { SettingsManager } from "./models/settings";
import { SlidesRupSettingTab } from "./ui/settings-tab";
import { SlidesRupSettings } from "./types";
import { createServices } from "./services";
import { ClassesSuggest } from "./editor/classes-sugguest";
import { ColumnsSuggest } from "./editor/columns-sugguest";
import { CommentsSuggest } from "./editor/comments-sugguest";
import { PlaceHoldersSuggest } from "./editor/place-holders-sugguest";

export default class SlidesRup extends Plugin {
	settings: SlidesRupSettings;
	settingsManager: SettingsManager;

	services: ReturnType<typeof createServices>;

	async onload() {
		// Initialize settings manager
		this.settingsManager = new SettingsManager(
			() => this.loadData(),
			(data) => this.saveData(data)
		);
		await this.loadSettings();

		// Create services using dependency injection
		this.services = createServices(this, this.app, this.settings);

		// Register all commands
		this.services.commandService.registerCommands();

		await this.services.slidesRupStyleService.updateUserDesignCssSettings();

		// Add settings tab
		this.addSettingTab(new SlidesRupSettingTab(this.app, this));

		this.registerEditorSuggest(new ClassesSuggest(this.app, this.settings));
		this.registerEditorSuggest(new ColumnsSuggest(this.app, this.settings));

		this.registerEditorSuggest(new PlaceHoldersSuggest(this.app));
		this.registerEditorSuggest(new CommentsSuggest(this.app));
	}

	onunload() {
		// Clean up any resources, listeners, etc.
		console.log("Unloading SlidesRup plugin");
	}

	async loadSettings() {
		this.settings = await this.settingsManager.load();
	}

	async saveSettings() {
		this.settingsManager.update(this.settings);
		await this.settingsManager.save();
	}
}
