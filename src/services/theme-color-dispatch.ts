import { SlidesRupSettings } from "src/types";

type ThemeColorDispatchPlugin = {
	settings: Pick<SlidesRupSettings, "slidesRupThemeColor">;
	saveSettings: () => Promise<void>;
	services: {
		slidesRupStyleService: {
			modifyStyleSection: (section: "hsl") => Promise<void>;
		};
	};
};

export async function dispatchThemeColorChange(
	plugin: ThemeColorDispatchPlugin,
	color: string,
): Promise<void> {
	plugin.settings.slidesRupThemeColor = color;
	await plugin.saveSettings();
	await plugin.services.slidesRupStyleService.modifyStyleSection("hsl");
}
