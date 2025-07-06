import { Plugin } from "obsidian";
import { SettingsManager } from "./models/settings";
import { OBASAssistantSettingTab } from "./ui/settings-tab";
import { OBASAssistantSettings } from "./types";
import { createServices } from "./services";

export default class OBASAssistant extends Plugin {
	settings: OBASAssistantSettings;
	settingsManager: SettingsManager;

	private services: ReturnType<typeof createServices>;

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

		// Add settings tab
		this.addSettingTab(new OBASAssistantSettingTab(this.app, this));
	}

	onunload() {
		// Clean up any resources, listeners, etc.
		console.log("Unloading OBASAssistant plugin");
	}

	async loadSettings() {
		this.settings = await this.settingsManager.load();
	}

	async saveSettings() {
		this.settingsManager.update(this.settings);
		await this.settingsManager.save();
	}
}
