import { App } from "obsidian";
import { SlidesRupSettings } from "../types";
import { createPathIfNeeded } from "../utils";
export class VSCodeService {
	private app: App;
	private settings: SlidesRupSettings;
	private vscodeConfigFolder: string;
	private marpThemesFolder: string;
	constructor(app: App, settings: SlidesRupSettings) {
		this.app = app;
		this.settings = settings;
		this.vscodeConfigFolder = ".vscode";
		this.marpThemesFolder = `${this.settings.slidesRupFrameworkFolder}/MarpThemes`;
	}

	async addDefaultMarpThemesForVSCode() {
		await createPathIfNeeded(this.app, this.vscodeConfigFolder);
		// 定义VSCode的配置内容
		// 定义主题文件名数组
		const themeFiles = ["base", "a", "b", "c", "d", "e", "f", "g", "h"].map(
			(suffix) =>
				`./${this.marpThemesFolder}/sr-${
					suffix === "base" ? suffix : `design-${suffix}`
				}.css`
		);

		const vscodeSettings = {
			"markdown.marp.html": "default",
			"markdown.marp.themes": themeFiles,
		};

		// 将配置内容转换为JSON字符串
		const settingsJson = JSON.stringify(vscodeSettings, null, 4);

		// 构建settings.json的完整路径
		const settingsPath = `${this.vscodeConfigFolder}/settings.json`;

		// 写入配置文件
		await this.app.vault.adapter.write(settingsPath, settingsJson);
	}

	async addNewMarpThemeForVSCode(designName: string) {
		// 构建新主题文件的路径
		const newThemePath = `./${this.marpThemesFolder}/sr-design-${designName}.css`;

		// 读取现有的settings.json文件
		const settingsPath = `${this.vscodeConfigFolder}/settings.json`;
		let existingSettings = {};

		try {
			const existingContent = await this.app.vault.adapter.read(
				settingsPath
			);
			existingSettings = JSON.parse(existingContent);
		} catch (error) {
			// 如果文件不存在，使用默认设置
			existingSettings = {
				"markdown.marp.html": "default",
				"markdown.marp.themes": [],
			};
		}

		// 确保themes数组存在并且是数组类型，避免类型错误
		let themes: string[] = [];
		if (
			typeof existingSettings === "object" &&
			existingSettings !== null &&
			Array.isArray((existingSettings as any)["markdown.marp.themes"])
		) {
			themes = (existingSettings as any)["markdown.marp.themes"];
		} else {
			themes = [];
		}
		// 添加新主题到themes数组（如果不存在）
		if (!themes.includes(newThemePath)) {
			themes.push(newThemePath);
		}
		(existingSettings as any)["markdown.marp.themes"] = themes;

		// 将更新后的配置写回文件
		const updatedSettingsJson = JSON.stringify(existingSettings, null, 4);
		await this.app.vault.adapter.write(settingsPath, updatedSettingsJson);
	}
}
