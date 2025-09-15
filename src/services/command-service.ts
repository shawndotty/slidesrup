import { App, Notice, Command } from "obsidian";
import { t } from "../lang/helpers";
import { SlidesRupSettings, NocoDBSettings } from "../types";
import { buildFieldNames } from "../utils";
import { SlidesMaker } from "./slides-maker";
import { MarpSlidesMaker } from "./marp-maker";
import { DesignMaker } from "./design-maker";
import { NocoDB } from "./db-sync/noco-db";
import { NocoDBSync } from "./db-sync/nocodb-sync";
import { MyObsidian } from "./db-sync/my-obsidian";
import { TemplaterService } from "./templater-service";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "../constants";

export class CommandService {
	private slidesMaker: SlidesMaker;
	private designMaker: DesignMaker;
	private marpSlidesMaker: MarpSlidesMaker;
	private presentationPluginFolder: string;
	private revealAddOnsViewName: string;

	constructor(
		private addCommand: (command: Command) => void,
		private addRibbonIcon: (
			icon: string,
			title: string,
			callback: (evt: MouseEvent) => void
		) => void,
		private app: App,
		private settings: SlidesRupSettings,
		private templaterService: TemplaterService
	) {
		this.slidesMaker = new SlidesMaker(this.app, this.settings);
		this.designMaker = new DesignMaker(this.app, this.settings);
		this.marpSlidesMaker = new MarpSlidesMaker(this.app, this.settings);
		if (this.settings.presentationPlugin === "slidesExtended") {
			this.presentationPluginFolder = SLIDES_EXTENDED_PLUGIN_FOLDER;
			this.revealAddOnsViewName = "reveal";
		} else {
			this.presentationPluginFolder = ADVANCED_SLIDES_PLUGIN_FOLDER;
			this.revealAddOnsViewName = "revealAS";
		}
	}

	private _checkUserType(): boolean {
		if (
			!this.settings.userChecked ||
			!this.settings.updateAPIKeyIsValid ||
			!this.settings.userEmail ||
			!this.settings.updateAPIKey ||
			!this.settings.updateAPIKey.includes("patquQB1Cd93hSAlC")
		) {
			new Notice(t("This Action is only available for Paid Users"));
			return false;
		}
		return true;
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
				this.settings.slidesRupRunningLanguage
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
				targetFolderPath: `${this.app.vault.configDir}/${this.presentationPluginFolder}/dist`,
			}
		);

		createNocoDBCommand(
			"update-templates",
			t("Get The Latest Version Of Templates"),
			{
				baseID: this.settings.updateIDs.templates.baseID,
				tableID: this.settings.updateIDs.templates.tableID,
				viewID: this.settings.updateIDs.templates.viewID,
				targetFolderPath: this.settings.slidesRupFrameworkFolder,
			}
		);

		createNocoDBCommand(
			"update-reveal-addons",
			t("Get The Latest Version SlidesRup Reveal Addons"),
			(() => {
				const update =
					this.settings.updateIDs[
						this.revealAddOnsViewName as "reveal" | "revealAS"
					];
				return {
					baseID: update.baseID,
					tableID: update.tableID,
					viewID: update.viewID,
					targetFolderPath: `${this.app.vault.configDir}/${this.presentationPluginFolder}`,
				};
			})()
		);

		createNocoDBCommand(
			"update-demo-templates",
			t("Get The Latest Version Of User Templates"),
			{
				baseID: this.settings.updateIDs.demo.baseID,
				tableID: this.settings.updateIDs.demo.tableID,
				viewID: this.settings.updateIDs.demo.viewID,
				targetFolderPath: this.settings.slidesRupFrameworkFolder,
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
					targetFolderPath: `${this.app.vault.configDir}/${this.presentationPluginFolder}/dist`,
				});
				new Notice(t("Styles updated."));

				await this.runNocoDBCommand({
					baseID: this.settings.updateIDs.templates.baseID,
					tableID: this.settings.updateIDs.templates.tableID,
					viewID: this.settings.updateIDs.templates.viewID,
					targetFolderPath: this.settings.slidesRupFrameworkFolder,
				});
				new Notice(t("Templates updated."));

				await this.runNocoDBCommand(
					(() => {
						const update =
							this.settings.updateIDs[
								this.revealAddOnsViewName as
									| "reveal"
									| "revealAS"
							];
						return {
							baseID: update.baseID,
							tableID: update.tableID,
							viewID: update.viewID,
							targetFolderPath: `${this.app.vault.configDir}/${this.presentationPluginFolder}`,
						};
					})()
				);
				new Notice(t("Reveal template updated."));

				await this.runNocoDBCommand({
					baseID: this.settings.updateIDs.demo.baseID,
					tableID: this.settings.updateIDs.demo.tableID,
					viewID: this.settings.updateIDs.demo.viewID,
					targetFolderPath: this.settings.slidesRupFrameworkFolder,
				});
				new Notice(t("Demo slides updated."));

				new Notice(t("One-click deployment finished!"));
			},
		});

		this.addCommand({
			id: "slides-rup:create-slides",
			name: t("Create New Slides"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.createSlides()
				);
			},
		});

		this.addCommand({
			id: "slides-rup:add-slide-chapter",
			name: t("Add Chapter"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.addSlideChapter()
				);
			},
		});

		this.addCommand({
			id: "slides-rup:add-slide-page",
			name: t("Add Page"),
			callback: async () => {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.addSlidePage()
				);
			},
		});

		this.addCommand({
			id: "slides-rup:covert-to-slide",
			name: t("Convert to Slide"),
			icon: "file-text",
			callback: async () => {
				if (this._checkUserType()) {
					await this._templaterTriggerSwitch(() =>
						this.slidesMaker.convertMDToSlide()
					);
				}
			},
		});

		// 添加工具栏图标用于快速转换幻灯片
		this.addRibbonIcon("presentation", t("Convert to Slide"), async () => {
			if (this._checkUserType()) {
				await this._templaterTriggerSwitch(() =>
					this.slidesMaker.convertMDToSlide()
				);
			}
		});

		this.addCommand({
			id: "slides-rup:crete-new-design",
			name: t("Create New Design From Blank"),
			callback: async () => {
				if (this._checkUserType()) {
					await this._templaterTriggerSwitch(() =>
						this.designMaker.makeNewBlankDesign()
					);
				}
			},
		});

		this.addCommand({
			id: "slides-rup:crete-new-design-from-current-design",
			name: t("Create New Design From Current Design"),
			callback: async () => {
				if (this._checkUserType()) {
					await this._templaterTriggerSwitch(() =>
						this.designMaker.makeNewDesignFromCurrentDesign()
					);
				}
			},
		});

		this.addCommand({
			id: "slides-rup:convert-to-marp-slides",
			name: t("Convert to Marp Slides"),
			callback: async () => {
				if (this._checkUserType()) {
					await this._templaterTriggerSwitch(() =>
						this.marpSlidesMaker.convertMDToMarpSlide()
					);
				}
			},
		});
	}
}
