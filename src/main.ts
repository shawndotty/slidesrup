import { Plugin } from "obsidian";
import { SettingsManager } from "./models/settings";
import { SlidesRupSettingTab } from "./ui/settings-tab";
import { SlidesRupSettings } from "./types";
import { createServices } from "./services";
import { ClassesSuggest } from "./editor/classes-sugguest";
import { ColumnsSuggest } from "./editor/columns-sugguest";
import { CommentsSuggest } from "./editor/comments-sugguest";
import { BlocksSuggest } from "./editor/blocks-sugguest";

import { PlaceHoldersSuggest } from "./editor/place-holders-sugguest";
import { DESIGN_MAKER_VIEW_TYPE } from "./types/design-maker";
import { DesignMakerView } from "./ui/views/design-maker-view";
import { CUSTOM_STYLE_EDITOR_VIEW_TYPE } from "./types/custom-style-editor";
import { CustomStyleEditorView } from "./ui/views/custom-style-editor-view";
import { LEGACY_PLUGIN_ID } from "./constants";

export default class SlidesRup extends Plugin {
	settings: SlidesRupSettings;
	settingsManager: SettingsManager;

	services: ReturnType<typeof createServices>;

	async onload() {
		await this.migrateFromLegacyId();

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

		this.registerView(
			DESIGN_MAKER_VIEW_TYPE,
			(leaf) => new DesignMakerView(leaf, this),
		);
		this.registerView(
			CUSTOM_STYLE_EDITOR_VIEW_TYPE,
			(leaf) => new CustomStyleEditorView(leaf, this),
		);

		await this.services.slidesRupStyleService.updateUserDesignCssSettings();

		// Add settings tab
		this.addSettingTab(new SlidesRupSettingTab(this.app, this));

		this.registerEditorSuggest(new ClassesSuggest(this.app, this.settings));
		this.registerEditorSuggest(new ColumnsSuggest(this.app, this.settings));

		this.registerEditorSuggest(new PlaceHoldersSuggest(this.app));
		this.registerEditorSuggest(new CommentsSuggest(this.app));
		this.registerEditorSuggest(new BlocksSuggest(this.app));

		await this.healLegacyRuntimeConfig();
	}

	/**
	 * 一次性迁移：plugin id 由 `slides-rup` 改为 `slidesrup` 之后，
	 * 安装器会按新 id 建目录，老用户的 data.json 还留在旧目录里。
	 * 必须在 loadSettings() 之前跑，否则读空配置 → 设置/语言偏好静默重置。
	 */
	private async migrateFromLegacyId(): Promise<void> {
		if (this.manifest.id === LEGACY_PLUGIN_ID) return;

		const adapter = this.app.vault.adapter;
		const legacyDir = `${this.app.vault.configDir}/plugins/${LEGACY_PLUGIN_ID}`;
		if (!(await adapter.exists(legacyDir))) return;

		const currentDir =
			this.manifest.dir ??
			`${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		if (legacyDir === currentDir) return;

		// 1) 先禁用旧实例，释放视图类型，避免 registerView 撞名抛错
		const plugins = this.app.plugins;
		if (plugins?.enabledPlugins?.has(LEGACY_PLUGIN_ID)) {
			await plugins.disablePlugin(LEGACY_PLUGIN_ID);
		}

		// 2) 搬 data.json（新目录没有时才搬，幂等）
		const legacyData = `${legacyDir}/data.json`;
		const currentData = `${currentDir}/data.json`;
		if (
			(await adapter.exists(legacyData)) &&
			!(await adapter.exists(currentData))
		) {
			await adapter.write(currentData, await adapter.read(legacyData));
		}

		// 3) 启用列表里旧 id 原位换成新 id（保序）
		if (plugins?.enabledPlugins?.has(LEGACY_PLUGIN_ID)) {
			const next = Array.from(plugins.enabledPlugins).map((id) =>
				id === LEGACY_PLUGIN_ID ? this.manifest.id : id,
			);
			plugins.enabledPlugins = new Set(next);
			await plugins.saveConfig();
		}

		// 4) 删残留旧目录（插件自身的可再生产物；data.json 已搬走）
		await adapter.rmdir(legacyDir, true);
	}

	/**
	 * 运行态配置自愈：清掉 community-plugins / hotkeys 里的旧 id 残项。
	 * 幂等，放在命令与视图都已注册完之后执行。
	 */
	private async healLegacyRuntimeConfig(): Promise<void> {
		const plugins = this.app.plugins;

		// 1) community-plugins.json 里的旧 id 残项（原位替换，保序）
		if (plugins?.enabledPlugins?.has(LEGACY_PLUGIN_ID)) {
			const next = Array.from(plugins.enabledPlugins).map((id) =>
				id === LEGACY_PLUGIN_ID ? this.manifest.id : id,
			);
			plugins.enabledPlugins = new Set(next);
			await plugins.saveConfig();
		}

		// 2) 快捷键前缀迁移（customKeys 是 getter 返回的拷贝，必须走 setHotkeys/save）
		const hm = this.app.hotkeyManager;
		if (!hm?.customKeys) return;
		let touched = false;
		for (const [cmdId, keys] of Object.entries(hm.customKeys)) {
			if (!cmdId.startsWith(LEGACY_PLUGIN_ID + ":")) continue;
			hm.setHotkeys(
				this.manifest.id + cmdId.slice(LEGACY_PLUGIN_ID.length),
				keys,
			);
			hm.removeHotkeys(cmdId);
			touched = true;
		}
		if (touched) await hm.save();
	}

	onunload() {
		// Clean up any resources, listeners, etc.
		console.log("Unloading SlidesRup plugin");
	}

	async loadSettings() {
		this.settings = await this.settingsManager.load();
	}

	async saveSettings() {
		this.settingsManager.update(this.settings);
		await this.settingsManager.save();
	}
}
