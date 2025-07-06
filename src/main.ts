import { Plugin } from "obsidian";
import { OBASAssistantSettingTab } from "./ui/settings-tab";
import { OBASAssistantSettings } from "./types";
import { DEFAULT_SETTINGS } from "./models/default-settings";
import { ApiService } from "./services/api-services";
import { TemplaterService } from "./services/templater-service";
import { CommandService } from "./services/command-service";

export default class OBASAssistant extends Plugin {
	settings: OBASAssistantSettings;
	private apiService: ApiService;
	private templaterService: TemplaterService;
	private commandService: CommandService;

	async onload() {
		await this.loadSettings();
		this.apiService = new ApiService(this.settings);
		this.templaterService = new TemplaterService(this.app);
		this.commandService = new CommandService(
			this,
			this.settings,
			this.templaterService
		);

		// 注册所有命令
		this.commandService.registerCommands();

		// 添加设置标签页
		this.addSettingTab(new OBASAssistantSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
