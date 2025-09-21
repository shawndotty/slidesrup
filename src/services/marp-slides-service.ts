import { App } from "obsidian";

export class MarpSlidesService {
	constructor(private app: App) {}

	private getPlugin() {
		const ms = this.app.plugins.plugins["marp-slides"];
		return ms || null;
	}

	getPluginSetting(settingName: string) {
		const ms = this.getPlugin();
		if (ms) {
			return ms.settings[settingName];
		}
		return null;
	}

	async setPluginSetting(settingName: string, value: any) {
		const ms = this.getPlugin();
		if (ms) {
			ms.settings[settingName] = value;
			await ms.saveSettings();
		}
	}
}
