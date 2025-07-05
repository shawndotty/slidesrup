import { Notice, Plugin, requestUrl } from "obsidian";
import { t } from "./lang/helpers";
import { OBASAssistantSettingTab } from "./src/settings-tab";
import { OBASAssistantSettings, NocoDBSettings } from "./src/types";
import { buildFieldNames } from "./src/utils";
import { SlidesMaker } from "./src/slides-maker";
import { MyNocoDB, NocoDBSync } from "./src/noco-db";
import { MyObsidian } from "./src/my-obsidian";
import { AIRTABLE_CONFIG } from "./src/constants";

const DEFAULT_SETTINGS: OBASAssistantSettings = {
	updateAPIKey: "",
	updateAPIKeyIsValid: false,
	obasFrameworkFolder: "",
	userEmail: "",
	userChecked: false,
	newSlideLocationOption: "current",
	assignedNewSlideLocation: "",
	updateIDs: {
		style: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		templates: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
		demo: {
			baseID: "",
			tableID: "",
			viewID: "",
		},
	},
};

export default class OBASAssistant extends Plugin {
	settings: OBASAssistantSettings;

	async onload() {
		await this.loadSettings();

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
			this.addCommand({
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
					const templaterTrigerAtCreate = this.getTemplaterSetting(
						"trigger_on_file_creation"
					);

					if (templaterTrigerAtCreate) {
						await this.setTemplaterSetting(
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
					const myNocoDB = new MyNocoDB(nocoDBSettings);
					const nocoDBSync = new NocoDBSync(myNocoDB, this.app);
					const myObsidian = new MyObsidian(this.app, nocoDBSync);
					await myObsidian.onlyFetchFromNocoDB(
						nocoDBSettings.tables[0],
						this.settings.updateAPIKeyIsValid
					);
					if (templaterTrigerAtCreate) {
						await this.setTemplaterSetting(
							"trigger_on_file_creation",
							true
						);
					}
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
			"update-demo-slides",
			t("Get The Latest Version Of Demo Slides"),
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
				// 定义需要执行的命令ID数组
				const commandIds = [
					"obas-assistant:update-style",
					"obas-assistant:update-templates",
					"obas-assistant:update-demo-slides",
				];

				// 依次执行每个命令并等待完成
				for (const commandId of commandIds) {
					await this.app.commands.executeCommandById(commandId);
					// 等待2秒确保更新完成
					await new Promise((r) => setTimeout(r, 2000));
				}
			},
		});

		this.addCommand({
			id: "obas-assistant:create-slides",
			name: t("Create New Slides"),
			callback: async () => {
				const slidesMaker = new SlidesMaker(this.app, this.settings);
				await slidesMaker.createSlides();
			},
		});

		// 添加设置标签页
		this.addSettingTab(new OBASAssistantSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private getTemplater() {
		const templater = this.app.plugins.plugins["templater-obsidian"];
		this.app.plugins.plugins["templater-obsidian"];
		return templater || null;
	}

	private getTemplaterSetting(settingName: string) {
		const templater = this.getTemplater();
		if (templater) {
			return templater.settings[settingName];
		}
		return null;
	}

	private async setTemplaterSetting(settingName: string, value: any) {
		const templater = this.getTemplater();
		if (templater) {
			templater.settings[settingName] = value;
			await templater.save_settings();
			if (settingName === "trigger_on_file_creation") {
				await templater.event_handler.update_trigger_file_on_creation();
			}
		}
	}

	async getUpdateIDs() {
		const userEmail = this.settings.userEmail.trim();
		const config = AIRTABLE_CONFIG.GET_UPDATE_IDS;
		const getUpdateIDsUrl = `https://api.airtable.com/v0/${
			config.BASE_ID
		}/${config.TABLE_ID}?view=${
			config.VIEW_ID
		}&maxRecords=1&filterByFormula=${encodeURI(
			"{Email} = '" + userEmail + "'"
		)}&fields%5B%5D=${config.FIELD_NAME}`;

		const response = await requestUrl({
			url: getUpdateIDsUrl,
			method: "GET",
			headers: { Authorization: "Bearer " + config.TOKEN },
		});

		if (
			response.json.records.length &&
			response.json.records[0].fields[config.FIELD_NAME]
		) {
			this.settings.updateIDs = JSON.parse(
				response.json.records[0].fields[config.FIELD_NAME].first()
			);
			this.settings.userChecked = true;
		} else {
			this.settings.updateIDs = DEFAULT_SETTINGS.updateIDs;
			this.settings.userChecked = DEFAULT_SETTINGS.userChecked;
		}
		await this.saveSettings();
	}

	async checkApiKey() {
		const updateUUID = crypto.randomUUID();
		const config = AIRTABLE_CONFIG.CHECK_API_KEY;
		const checkApiValidUrl = `https://api.airtable.com/v0/${
			config.BASE_ID
		}/${config.TABLE_ID}?maxRecords=1&view=${
			config.VIEW_ID
		}&filterByFormula=${encodeURI(
			"{UUID} = '" + updateUUID + "'"
		)}&fields%5B%5D=${config.FIELD_NAME}`;
		let validKey = 0;
		try {
			await requestUrl({
				url: config.WEBHOOK_URL,
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					uuid: updateUUID,
					userApiKey: this.settings.updateAPIKey,
				}),
			});

			await new Promise((r) => setTimeout(r, 1500));

			try {
				const matchRes = await requestUrl({
					url: checkApiValidUrl,
					method: "GET",
					headers: { Authorization: "Bearer " + config.TOKEN },
				});
				validKey = matchRes.json.records[0].fields[config.FIELD_NAME];
			} catch (error) {
				console.log(error);
			}
		} catch (error) {
			console.log(error);
		}

		if (validKey) {
			this.settings.updateAPIKeyIsValid = true;
		} else {
			this.settings.updateAPIKeyIsValid = false;
		}

		await this.saveSettings();
	}
}
