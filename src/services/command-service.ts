import { App, Notice, Command } from "obsidian";
import { t } from "../lang/helpers";
import { OBASAssistantSettings, NocoDBSettings } from "../types";
import { buildFieldNames } from "../utils";
import { SlidesMaker } from "./slides-maker";
import { NocoDB } from "./db-sync/noco-db";
import { NocoDBSync } from "./db-sync/nocodb-sync";
import { MyObsidian } from "./db-sync/my-obsidian";
import { TemplaterService } from "./templater-service";

export class CommandService {
	private slidesMaker: SlidesMaker;

	constructor(
		private addCommand: (command: Command) => void,
		private app: App,
		private settings: OBASAssistantSettings,
		private templaterService: TemplaterService
	) {
		this.slidesMaker = new SlidesMaker(this.app, this.settings);
	}

	// 优化：抽取公共逻辑，减少重复代码
	private async _templaterTriggerSwitch(
		action: () => Promise<void>
	): Promise<void> {
		const triggerAtCreate = this.templaterService.getTemplaterSetting(
			"trigger_on_file_creation"
		);
		if (triggerAtCreate) {
			await this.templaterService.setTemplaterSetting(
				"trigger_on_file_creation",
				false
			);
		}
		await action();
		if (triggerAtCreate) {
			await this.templaterService.setTemplaterSetting(
				"trigger_on_file_creation",
				true
			);
		}
	}

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

		await this._templaterTriggerSwitch(async () => {
			const fieldNames = buildFieldNames(
				false,
				this.settings.obasRunningLanguage
			);
			const nocoDBSettings: NocoDBSettings = {
				apiKey: apiKey,
				tables: [tableConfig],
				syncSettings: {
					recordFieldsNames: fieldNames,
				},
			};
			const myNocoDB = new NocoDB(nocoDBSettings);
			const nocoDBSync = new NocoDBSync(myNocoDB, this.app);
			const myObsidian = new MyObsidian(this.app, nocoDBSync);
			await myObsidian.onlyFetchFromNocoDB(
				nocoDBSettings.tables[0],
				this.settings.updateAPIKeyIsValid
			);
		});
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
			this.addCommand({
				id,
				name,
				callback: async () => {
					await this.runNocoDBCommand(tableConfig);
					if (reloadOB) {
						this.app.commands.executeCommandById("app:reload");
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
			"update-reveal-addons",
			t("Get The Latest Version OBAS Reveal Addons"),
			{
				baseID: this.settings.updateIDs.reveal.baseID,
				tableID: this.settings.updateIDs.reveal.tableID,
				viewID: this.settings.updateIDs.reveal.viewID,
				targetFolderPath: `${this.app.vault.configDir}`,
			}
		);

		createNocoDBCommand(
			"update-demo-templates",
			t("Get The Latest Version Of User Templates"),
			{
				baseID: this.settings.updateIDs.demo.baseID,
				tableID: this.settings.updateIDs.demo.tableID,
				viewID: this.settings.updateIDs.demo.viewID,
				targetFolderPath: this.settings.obasFrameworkFolder,
			}
		);

		this.addCommand({
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
					baseID: this.settings.updateIDs.reveal.baseID,
					tableID: this.settings.updateIDs.reveal.tableID,
					viewID: this.settings.updateIDs.reveal.viewID,
					targetFolderPath: `${this.app.vault.configDir}`,
				});
				new Notice(t("Reveal template updated."));

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

		this.addCommand({
			id: "obas-assistant:create-slides",
			name: t("Create New Slides"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.createSlides()
				);
			},
		});

		this.addCommand({
			id: "obas-assistant:add-slide-chapter",
			name: t("Add Chapter"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.addSlideChapter()
				);
			},
		});

		this.addCommand({
			id: "obas-assistant:add-slide-page",
			name: t("Add Page"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.addSlidePage()
				);
			},
		});
	}
}
