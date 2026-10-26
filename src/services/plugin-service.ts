import { App } from "obsidian";

export class PluginService {
	private app: App;
	private plugin: any;

	constructor(app: App, id: string) {
		this.app = app;
		this.plugin = this.app.plugins.plugins[id] || null;
	}

	getPluginSetting(settingName: string) {
		if (this.plugin) {
			return this.plugin.settings[settingName];
		}
		return null;
	}

	getPlugin() {
		return this.plugin;
	}

	static async reloadAndEnablePlugin(
		app: App,
		pluginId: string,
		previousId?: string,
	) {
		// @ts-ignore
		const plugins = app.plugins;
		if (!plugins) return;

		// 0. 换 id（插件 id 变更）：不 enable，只改配置 + 整体 reload。
		// 同会话内 enable 新 id 会与旧实例的视图类型撞名，且两个 id 会同时驻留启用列表。
		if (previousId && previousId !== pluginId) {
			await this.replaceInCommunityPlugins(app, previousId, pluginId);
			app.commands.executeCommandById("app:reload");
			return;
		}

		// 1. Refresh manifests
		// @ts-ignore
		if (plugins.loadManifests) {
			// @ts-ignore
			await plugins.loadManifests();
		}

		// 2. Disable if already enabled (to reload)
		// @ts-ignore
		if (plugins.enabledPlugins.has(pluginId)) {
			// @ts-ignore
			await plugins.disablePlugin(pluginId);
		}

		// 3. Enable plugin
		// @ts-ignore
		await plugins.enablePlugin(pluginId);

		// 4. Persist to community-plugins.json
		const configDir = app.vault.configDir;
		const pluginsConfigPath = `${configDir}/community-plugins.json`;
		const adapter = app.vault.adapter;

		let enabledPluginsList: string[] = [];
		if (await adapter.exists(pluginsConfigPath)) {
			try {
				const content = await adapter.read(pluginsConfigPath);
				enabledPluginsList = JSON.parse(content);
			} catch (e) {
				console.error("Failed to parse community-plugins.json", e);
			}
		}

		if (!enabledPluginsList.includes(pluginId)) {
			enabledPluginsList.push(pluginId);
			await adapter.write(
				pluginsConfigPath,
				JSON.stringify(enabledPluginsList, null, 2),
			);
		}
	}

	/**
	 * community-plugins.json 里把 from 原位替换成 to（保序），并同步内存里的启用集合。
	 * 换 id 时不能走「push 追加」，否则新旧两个 id 会同时驻留，重启后视图类型撞名。
	 */
	private static async replaceInCommunityPlugins(
		app: App,
		from: string,
		to: string,
	) {
		const path = `${app.vault.configDir}/community-plugins.json`;
		const adapter = app.vault.adapter;
		if (!(await adapter.exists(path))) return;

		const list: string[] = JSON.parse(await adapter.read(path));
		const next = list.map((id) => (id === from ? to : id));
		if (!next.includes(to)) next.push(to); // 极端情况下旧项已不在，补一条

		await adapter.write(path, JSON.stringify(next, null, 2));
		app.plugins.enabledPlugins = new Set(next);
	}
}
