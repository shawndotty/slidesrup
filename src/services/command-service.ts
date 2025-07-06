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

	private async runNocoDBCommand(
		tableConfig: {
			viewID: string;
			targetFolderPath: string;
			baseID?: string;
			tableID?: string;
		},
		apiKey: string = this.settings.updateAPIKey
	): Promise<void> {
		if (!apiKey) {
			new Notice(t("You must provide an API Key to run this command"));
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
		const nocoDBSync = new NocoDBSync(myNocoDB, this.plugin.app);
		const myObsidian = new MyObsidian(this.plugin.app, nocoDBSync);
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
	}

	registerCommands(): void {
		const createNocoDBCommand = (
			id: string,
			name: string,
			tableConfig: {
				viewID: string;
				targetFolderPath: string;
				baseID?: string;
				tableID?: string;
			},
			reloadOB: boolean = false
		) => {
			this.plugin.addCommand({
				id,
				name,
				callback: async () => {
					await this.runNocoDBCommand(tableConfig);
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
				new Notice(t("Starting one-click deployment..."));

				await this.runNocoDBCommand({
					baseID: this.settings.updateIDs.style.baseID,
					tableID: this.settings.updateIDs.style.tableID,
					viewID: this.settings.updateIDs.style.viewID,
					targetFolderPath: this.settings.obasFrameworkFolder,
				});
				new Notice(t("Styles updated."));

				await this.runNocoDBCommand({
					baseID: this.settings.updateIDs.templates.baseID,
					tableID: this.settings.updateIDs.templates.tableID,
					viewID: this.settings.updateIDs.templates.viewID,
					targetFolderPath: this.settings.obasFrameworkFolder,
				});
				new Notice(t("Templates updated."));

				await this.runNocoDBCommand({
					baseID: this.settings.updateIDs.demo.baseID,
					tableID: this.settings.updateIDs.demo.tableID,
					viewID: this.settings.updateIDs.demo.viewID,
					targetFolderPath: this.settings.obasFrameworkFolder,
				});
				new Notice(t("Demo slides updated."));

				new Notice(t("One-click deployment finished!"));
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
