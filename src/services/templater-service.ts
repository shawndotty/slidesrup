import { App } from "obsidian";
import { createPathIfNeeded } from "src/utils";

export class TemplaterService {
	constructor(private app: App) {}

	private getTemplater() {
		const templater = this.app.plugins.plugins["templater-obsidian"];
		return templater || null;
	}

	getTemplaterSetting(settingName: string) {
		const templater = this.getTemplater();
		if (templater) {
			return templater.settings[settingName];
		}
		return null;
	}

	async setTemplaterSetting(settingName: string, value: any) {
		const templater = this.getTemplater();
		if (templater) {
			templater.settings[settingName] = value;
			await templater.save_settings();
			if (settingName === "trigger_on_file_creation") {
				await templater.event_handler.update_trigger_file_on_creation();
			}
		}
	}
}
