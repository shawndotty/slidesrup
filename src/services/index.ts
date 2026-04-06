import { App, Plugin } from "obsidian";
import { ApiService } from "./api-services";
import { CommandService } from "./command-service";
import { TemplaterService } from "./templater-service";
import { SlidesRupStyleService } from "./css-services";
import { SlidesRupSettings } from "../types";
import { VSCodeService } from "./vscode-service";
import { SecretStoreService } from "./secret-store-service";
import { InlineStyleAIService } from "./inline-style-ai-service";

export function createServices(
	plugin: Plugin,
	app: App,
	settings: SlidesRupSettings
) {
	const templaterService = new TemplaterService(app);
	const apiService = new ApiService(settings);
	const slidesRupStyleService = new SlidesRupStyleService(app, settings);
	const vscodeService = new VSCodeService(app, settings);
	const saveSettings = async () => {
		const maybePlugin = plugin as any;
		if (typeof maybePlugin.saveSettings === "function") {
			await maybePlugin.saveSettings();
		}
	};
	const secretStoreService = new SecretStoreService(app, settings, saveSettings);
	const inlineStyleAiService = new InlineStyleAIService(
		settings,
		secretStoreService,
	);
	const commandService = new CommandService(
		plugin.addCommand.bind(plugin),
		plugin.addRibbonIcon.bind(plugin),
		app,
		plugin,
		settings,
		templaterService,
		vscodeService,
		apiService
	);

	return {
		templaterService,
		apiService,
		commandService,
		slidesRupStyleService,
		secretStoreService,
		inlineStyleAiService,
	};
}
