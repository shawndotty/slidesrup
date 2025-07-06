import { Notice, Plugin } from "obsidian";
import { t } from "../lang/helpers";
import { OBASAssistantSettings, NocoDBSettings } from "../types";
import { buildFieldNames } from "../utils";
import { SlidesMaker } from "./slides-maker";
import { NocoDB } from "./db-sync/noco-db";
import { NocoDBSync } from "./db-sync/nocodb-sync";
import { MyObsidian } from "./db-sync/my-obsidian";
import { TemplaterService } from "./templater-service";

export class CommandService {
	constructor(
		private plugin: Plugin,
		private settings: OBASAssistantSettings,
		private templaterService: TemplaterService
	) {}

	registerCommands(): void {
		// 优化后的 addCommand 方法，减少重复代码，提升可维护性
		const createNocoDBCommand = (
			id: string,
			name: string,
			tableConfig: {
				viewID: string;
				targetFolderPath: string;
				baseID?: string;
				tableID?: string;
			},
			reloadOB: boolean = false,
			apiKey: string = this.settings.updateAPIKey
		) => {
			this.plugin.addCommand({
				id,
				name,
				callback: async () => {
					if (!apiKey) {
						new Notice(
							t("You must provide an API Key to run this command")
						);
						return;
					}
					if (!this.settings.userEmail) {
						new Notice(
							t(
								"You need to provide the email for your account to run this command"
							)
						);
						return;
					}
					const templaterTrigerAtCreate =
						this.templaterService.getTemplaterSetting(
							"trigger_on_file_creation"
						);

					if (templaterTrigerAtCreate) {
						await this.templaterService.setTemplaterSetting(
							"trigger_on_file_creation",
							false
						);
					}
					const fieldNames = buildFieldNames();
					const nocoDBSettings: NocoDBSettings = {
						apiKey: apiKey,
						tables: [tableConfig],
						syncSettings: {
							recordFieldsNames: fieldNames,
						},
					};
					const myNocoDB = new NocoDB(nocoDBSettings);
					const nocoDBSync = new NocoDBSync(
						myNocoDB,
						this.plugin.app
					);
					const myObsidian = new MyObsidian(
						this.plugin.app,
						nocoDBSync
					);
					await myObsidian.onlyFetchFromNocoDB(
						nocoDBSettings.tables[0],
						this.settings.updateAPIKeyIsValid
					);
					if (templaterTrigerAtCreate) {
						await this.templaterService.setTemplaterSetting(
							"trigger_on_file_creation",
							true
						);
					}
					if (reloadOB) {
						this.plugin.app.commands.executeCommandById(
							"app:reload"
						);
					}
				},
			});
		};

		createNocoDBCommand(
			"update-style",
			t("Get The Latest Version Of Style"),
			{
				baseID: this.settings.updateIDs.style.baseID,
				tableID: this.settings.updateIDs.style.tableID,
				viewID: this.settings.updateIDs.style.viewID,
				targetFolderPath: this.settings.obasFrameworkFolder,
			}
		);

		createNocoDBCommand(
			"update-templates",
			t("Get The Latest Version Of Templates"),
			{
				baseID: this.settings.updateIDs.templates.baseID,
				tableID: this.settings.updateIDs.templates.tableID,
				viewID: this.settings.updateIDs.templates.viewID,
				targetFolderPath: this.settings.obasFrameworkFolder,
			}
		);

		createNocoDBCommand(
			"update-demo-slides",
			t("Get The Latest Version Of Demo Slides"),
			{
				baseID: this.settings.updateIDs.demo.baseID,
				tableID: this.settings.updateIDs.demo.tableID,
				viewID: this.settings.updateIDs.demo.viewID,
				targetFolderPath: this.settings.obasFrameworkFolder,
			}
		);

		this.plugin.addCommand({
			id: "one-click-deploy",
			name: t("One Click to Deploy"),
			callback: async () => {
				// 定义需要执行的命令ID数组
				const commandIds = [
					"obas-assistant:update-style",
					"obas-assistant:update-templates",
					"obas-assistant:update-demo-slides",
				];

				// 依次执行每个命令并等待完成
				for (const commandId of commandIds) {
					await this.plugin.app.commands.executeCommandById(
						commandId
					);
					// 等待2秒确保更新完成
					await new Promise((r) => setTimeout(r, 2000));
				}
			},
		});

		this.plugin.addCommand({
			id: "obas-assistant:create-slides",
			name: t("Create New Slides"),
			callback: async () => {
				const slidesMaker = new SlidesMaker(
					this.plugin.app,
					this.settings
				);
				await slidesMaker.createSlides();
			},
		});
	}
}
