import { App, Plugin } from "obsidian";
import { ApiService } from "./api-services";
import { CommandService } from "./command-service";
import { TemplaterService } from "./templater-service";
import { SlidesRupStyleService } from "./css-services";
import { SlidesRupSettings } from "../types";
import { VSCodeService } from "./vscode-service";

export function createServices(
	plugin: Plugin,
	app: App,
	settings: SlidesRupSettings
) {
	const templaterService = new TemplaterService(app);
	const apiService = new ApiService(settings);
	const slidesRupStyleService = new SlidesRupStyleService(app, settings);
	const vscodeService = new VSCodeService(app, settings);
	const commandService = new CommandService(
		plugin.addCommand.bind(plugin),
		plugin.addRibbonIcon.bind(plugin),
		app,
		settings,
		templaterService,
		vscodeService
	);

	return {
		templaterService,
		apiService,
		commandService,
		slidesRupStyleService,
	};
}
