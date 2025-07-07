import { App } from "obsidian";
import { OBASAssistantSettings } from "../types";

export class CssService {
	private obasHslFilePath: string;
	constructor(private app: App, private settings: OBASAssistantSettings) {
		this.obasHslFilePath = `${this.settings.obasFrameworkFolder}/Style/my-obas-hsl.css`;
	}

	async modifyObasHslFile() {
		const {
			obasHue: hue,
			obasSaturation: saturation,
			obasLightness: lightness,
		} = this.settings;
		const hslSettings = `
:root {
    --obas-base-color: hsl(${hue}, ${saturation}%, ${lightness}%);
    --obas-hue: ${hue};
    --obas-saturation: ${saturation}%;
    --obas-lightness: ${lightness}%;
}
`;

		// Use vault.adapter.write to simplify creation and modification.
		// This will create the file (and any necessary parent folders) if it doesn't exist,
		// or overwrite it if it does.
		await this.app.vault.adapter.write(this.obasHslFilePath, hslSettings);
	}
}
