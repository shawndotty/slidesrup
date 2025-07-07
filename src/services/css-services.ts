import { App } from "obsidian";
import { OBASAssistantSettings } from "../types";

export class CssService {
	private obasHslFilePath: string;
	constructor(private app: App, private settings: OBASAssistantSettings) {
		this.obasHslFilePath = `${this.settings.obasFrameworkFolder}/Style/obas-hsl.css`;
	}

	async modifyObasHslFile() {
		const hue = this.settings.obasHue;
		const saturation = this.settings.obasSaturation;
		const lightness = this.settings.obasLightness;
		const hslSettings = `
:root {
    --obas-base-color: hsl(${hue}, ${saturation}%, ${lightness}%);
    --obas-hue: ${hue};
    --obas-saturation: ${saturation}%;
    --obas-lightness: ${lightness}%;
}
`;

		const file = this.app.vault.getFileByPath(this.obasHslFilePath);
		if (file) {
			// 如果文件已存在，则覆盖写入
			await this.app.vault.modify(file, hslSettings);
			await new Promise((r) => setTimeout(r, 100));
		} else {
			// 如果文件不存在，则新建文件并写入
			await this.app.vault.create(this.obasHslFilePath, hslSettings);
		}
	}
}
