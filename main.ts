import {
	App,
	Notice,
	normalizePath,
	Plugin,
	TFile,
	moment
} from "obsidian";
import { t } from "./lang/helpers";
import { OBASAssistantSettingTab } from "./settings-tab";
import { slideTemplate } from "./templates/slide-template";
import { SuggesterOption } from "./utils/base-suggester";
import { SlideLocationSuggester, SlideDesignSuggester } from "./utils/suggesters";


// 扩展 App 类型以包含 commands 属性
declare module "obsidian" {
	interface App {
		commands: {
			executeCommandById(id: string): void;
		};
		plugins: {
			plugins: {
				[key: string]: any;
			};
		};
	}
}

interface AirtableIds {
	baseID: string;
	tableID: string;
	viewID: string;
}
interface OBASAssistantSettings {
	updateAPIKey: string;
	updateAPIKeyIsValid: boolean;
	obasFrameworkFolder: string;
	userEmail: string;
	userChecked: boolean;
	newSlideLocationOption: string;
	assignedNewSlideLocation: string;
	updateIDs: {
		style: AirtableIds;
		templates: AirtableIds;
		demo: AirtableIds;
	};
}

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
					const fieldNames = this.buildFieldNames();
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
					"obas-assistant:update-demo-slides"
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
				await this.createSlides();
			},
		});

		// 添加设置标签页
		this.addSettingTab(new OBASAssistantSettingTab(this.app, this));
	}

	onunload() {
		
	}

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

	isValidApiKey(apiKey: string): boolean {
		return Boolean(
			apiKey &&
				apiKey.length >= 82 &&
				apiKey.includes("pat") &&
				apiKey.includes(".")
		);
	}

	isValidEmail(email: string): boolean {
		// 基础格式检查：非空、包含@符号、@后包含点号
		if (
			!email ||
			email.indexOf("@") === -1 ||
			email.indexOf(".", email.indexOf("@")) === -1 ||
			email.length < 10
		) {
			return false;
		}

		// 正则表达式验证（符合RFC 5322标准）
		const emailRegex =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

		return emailRegex.test(email);
	}

	buildFieldNames(forceDefaultFetchFields: boolean = false) {
		const local = moment.locale();
		if (forceDefaultFetchFields) {
			return {
				title: "Title",
				subFolder: "SubFolder",
				content: "MD",
			};
		}
		const fieldNames = {
			zhCN: {
				title: "Title",
				subFolder: "SubFolder",
				content: "MD",
			},
			en: {
				title: "TitleEN",
				subFolder: "SubFolderEN",
				content: "MDEN",
			},
			zhTW: {
				title: "TitleTW",
				subFolder: "SubFolderTW",
				content: "MDTW",
			},
		};
		switch (local) {
			case "zh-cn":
				return fieldNames.zhCN;
			case "en":
				return fieldNames.en;
			case "zh-tw":
				return fieldNames.zhTW;
			default:
				return fieldNames.en;
		}
	}

	private async createSlides(){

		// 在当前文件夹创建新笔记
		const newSlideLocationChoice = this.settings.newSlideLocationOption;
		const currentFolder = this.app.workspace.getActiveFile()?.parent?.path || '';
		let newSlideLocation = currentFolder;
		switch(newSlideLocationChoice) {
			case "current":
				break;
			case "decideByUser":
				const locationSuggester = new SlideLocationSuggester(this.app, currentFolder, this.settings.assignedNewSlideLocation);
				const locationOption = await new Promise<SuggesterOption>((resolve) => {
				locationSuggester.onChooseItem = (item) => {
					resolve(item);
					return item;
				};
				locationSuggester.open();
				});

				// 如果用户取消了位置选择，直接返回
				if (!locationOption) {
					new Notice(t("Select Location"));
					return;
				}
				newSlideLocation = locationOption.value;
				break;
			case "assigned":
				newSlideLocation = this.settings.assignedNewSlideLocation;
				break;
		}
		
		

		const template = slideTemplate.replace("{{OBASPath}}", this.settings.obasFrameworkFolder);

		
		// 使用时间戳和计数器生成文件名
		const now = new Date();
		const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
		const fileName = `${t("Untitled Slide")}-${timestamp}`;
		
		let designOption: SuggesterOption | null = null;
		const suggester = new SlideDesignSuggester(this.app);
		// 创建一个弹出窗口让用户选择设计
		designOption = await new Promise<SuggesterOption>((resolve) => {
			suggester.onChooseItem = (item) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});

		// 如果用户取消了选择，直接返回
		if (!designOption) {
			new Notice(t("Please select a slide design"));
			return;
		}

		// 将选中的设计替换到模板中
		// 使用正则表达式全局替换所有匹配的占位符
		const finalTemplate = template.replace(/\{\{design\}\}/g, designOption.value);
		const filePath = newSlideLocation !== "/" ? `${newSlideLocation}/${fileName}.md` : `${fileName}.md`;
		
		// 使用模板内容创建新文件
		await this.app.vault.create(
			filePath,
			finalTemplate.trim().replace("{{title}}", fileName)
		);

		console.log(filePath);

		// 打开新创建的文件
		const newFile = this.app.vault.getAbstractFileByPath(filePath);
		console.dir(newFile);
		if (newFile) {
			console.log("here");
			if (newFile instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(newFile);
			}
		}
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
		const getUpdateIDsUrl = `https://api.airtable.com/v0/appxQqkHaEkjUQnBf/EmailSync?view=OBAS&maxRecords=1&filterByFormula=${encodeURI(
			"{Email} = '" + userEmail + "'"
		)}&fields%5B%5D=OBASUpdateIDs`;
		const getUpdateIDsToken =
			"patCw7AoXaktNgHNM.bf8eb50a33da820fde56b1f5d4cf5899bc8c508096baf36b700e94cd13570000";

		const response = await requestUrl({
			url: getUpdateIDsUrl,
			method: "GET",
			headers: { Authorization: "Bearer " + getUpdateIDsToken },
		});

		if (
			response.json.records.length &&
			response.json.records[0].fields.OBASUpdateIDs
		) {
			this.settings.updateIDs = JSON.parse(
				response.json.records[0].fields.OBASUpdateIDs.first()
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
		const checkApiWebHookUrl =
			"https://hooks.airtable.com/workflows/v1/genericWebhook/appq9k6KwHV3lEIJZ/wfl2uT25IPEljno9w/wtrFUIEC8SXlDsdIu";
		const checkApiValidUrl = `https://api.airtable.com/v0/appq9k6KwHV3lEIJZ/UpdateLogs?maxRecords=1&view=viweTQ2YarquoqZUT&filterByFormula=${encodeURI(
			"{UUID} = '" + updateUUID + "'"
		)}&fields%5B%5D=Match`;
		const checkApiValidToken =
			"patCw7AoXaktNgHNM.bf8eb50a33da820fde56b1f5d4cf5899bc8c508096baf36b700e94cd13570000";
		let validKey = 0;
		try {
			await requestUrl({
				url: checkApiWebHookUrl,
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
					headers: { Authorization: "Bearer " + checkApiValidToken },
				});
				validKey = matchRes.json.records[0].fields.Match;
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



// 类型定义
interface NocoDBTable {
	viewID: string;
	baseID?: string;
	tableID?: string;
	targetFolderPath: string;
}

interface NocoDBSettings {
	apiKey: string;
	tables: NocoDBTable[];
	iotoUpdate?: boolean;
	syncSettings?: {
		recordFieldsNames?: {
			title?: string;
			content?: string;
			subFolder?: string;
			extension?: string;
		};
	};
}

interface RecordFields {
	[key: string]: any;
	Title?: string;
	MD?: string;
	SubFolder?: string;
	Extension?: string;
}

interface Record {
	fields: RecordFields;
}

declare function requestUrl(options: any): Promise<any>;

class MyObsidian {
	app: any;
	vault: any;
	nocoDBSyncer: NocoDBSync;

	constructor(app: any, nocoDBSyncer: NocoDBSync) {
		this.app = app;
		this.vault = app.vault;
		this.nocoDBSyncer = nocoDBSyncer;
	}

	async onlyFetchFromNocoDB(
		sourceTable: NocoDBTable,
		updateAPIKeyIsValid: boolean = false
	): Promise<string | undefined> {
		if (!updateAPIKeyIsValid) {
			new Notice(
				this.buildFragment(
					t("Your API Key was expired. Please get a new one."),
					"#ff0000"
				),
				4000
			);
			return;
		}

		await this.nocoDBSyncer.createOrUpdateNotesInOBFromSourceTable(
			sourceTable
		);
	}

	/**
	 * 创建一个带有指定文本内容和颜色的文档片段
	 * @param {string} content - 要显示的文本内容
	 * @param {string} color - 文本颜色，支持CSS颜色值（如'#ff0000'、'red'等）
	 * @returns {DocumentFragment} 返回包含样式化文本的文档片段
	 */
	buildFragment(content: string, color: string): DocumentFragment {
		const fragment = document.createDocumentFragment();
		const div = document.createElement("div");
		div.textContent = content;
		div.style.color = color;
		fragment.appendChild(div);
		return fragment;
	}
}

class MyNocoDB {
	apiKey: string;
	tables: NocoDBTable[];
	apiUrlRoot: string;
	apiUrlBase: string;
	apiUrl: string;
	recordUrlBase: string;
	iotoUpdate: boolean;
	recordFieldsNames: {
		title: string;
		content: string;
		subFolder: string;
		extension: string;
		[key: string]: string;
	};

	constructor(nocoDBSettings: NocoDBSettings) {
		this.apiKey = nocoDBSettings.apiKey;
		this.tables = nocoDBSettings.tables || [];
		this.apiUrlRoot = "https://api.airtable.com/v0/";
		this.iotoUpdate = nocoDBSettings.iotoUpdate || false;
		this.recordFieldsNames = {
			...{
				title: "Title",
				content: "MD",
				subFolder: "SubFolder",
				extension: "Extension",
			},
			...(nocoDBSettings.syncSettings?.recordFieldsNames || {}),
		};
	}

	makeApiUrl(sourceTable: NocoDBTable): string {
		return `${this.apiUrlRoot}${sourceTable.baseID}/${sourceTable.tableID}`;
	}
}

class NocoDBSync {
	nocodb: MyNocoDB;
	app: any;
	vault: any;
	notesToCreate: any[];
	notesToUpdate: any[];
	fetchTitleFrom: string;
	fetchContentFrom: string;
	subFolder: string;
	extension: string;

	constructor(nocodb: MyNocoDB, app: any) {
		this.nocodb = nocodb;
		this.app = app;
		this.vault = app.vault;
		this.notesToCreate = [];
		this.notesToUpdate = [];
		this.fetchTitleFrom = this.nocodb.recordFieldsNames.title;
		this.fetchContentFrom = this.nocodb.recordFieldsNames.content;
		this.subFolder = this.nocodb.recordFieldsNames.subFolder;
		this.extension = this.nocodb.recordFieldsNames.extension;
	}

	getFetchSourceTable(sourceViewID: string): NocoDBTable | undefined {
		// @ts-ignore
		return this.nocodb.tables
			.filter((table) => sourceViewID == table.viewID)
			.first();
	}

	async fetchRecordsFromSource(sourceTable: NocoDBTable): Promise<any[]> {
		const fields = [
			this.fetchTitleFrom,
			this.fetchContentFrom,
			this.subFolder,
			this.extension,
		];

		let url = `${this.nocodb.makeApiUrl(sourceTable)}?view=${
			sourceTable.viewID
		}&${fields
			.map((f) => `fields%5B%5D=${encodeURIComponent(f)}`)
			.join("&")}&offset=`;

		let records = await this.getAllRecordsFromTable(url);

		if (!records || records.length === 0) {
			//new Notice(t("No records found"));
			return [];
		}
		// 将 records 中的 fields 映射到 mappedRecords 中
		const mappedRecords = records.map((record) => {
			const fields = record.fields;
			const mappedFields: any = {};

			for (const key in fields) {
				if (key.includes("Title")) {
					mappedFields.Title = fields[key];
				} else if (key.includes("SubFolder")) {
					mappedFields.SubFolder = fields[key];
				} else if (key.includes("MD")) {
					mappedFields.MD = fields[key];
				} else {
					mappedFields[key] = fields[key];
				}
			}

			record.fields = mappedFields;

			return record;
		});

		return mappedRecords;
	}

	async getAllRecordsFromTable(url: string): Promise<any[]> {
		let records: any[] = [];
		let offset = "";

		do {
			try {
				// 使用 fetch 替换 requestUrl
				const response = await fetch(url + offset, {
					method: "GET",
					headers: {
						Authorization: "Bearer " + this.nocodb.apiKey,
					},
				});
				// fetch 返回的是 Response 对象，需要调用 .json() 获取数据
				const responseData = await response.json();
				// 为了兼容后续代码，将 responseData 包装成与 requestUrl 返回结构一致
				const responseObj = { json: responseData };

				const data = responseObj.json;
				records = records.concat(data.records);
				new Notice(`${t("Got")} ${records.length} ${t("records")}`);

				offset = data.offset || "";
			} catch (error) {
				console.dir(error);
			}
		} while (offset !== "");

		return records;
	}

	convertToValidFileName(fileName: string): string {
		return fileName.replace(/[\/|\\:'"()（）{}<>\.\*]/g, "-").trim();
	}

	async createPathIfNeeded(folderPath: string): Promise<void> {
		const { vault } = this.app;
		const directoryExists = await vault.exists(folderPath);
		if (!directoryExists) {
			await vault.createFolder(normalizePath(folderPath));
		}
	}

	async createOrUpdateNotesInOBFromSourceTable(
		sourceTable: NocoDBTable
	): Promise<void> {
		new Notice(t("Getting Data ……"));

		const { vault } = this.app;

		const directoryRootPath = sourceTable.targetFolderPath;

		let notesToCreateOrUpdate: RecordFields[] = (
			await this.fetchRecordsFromSource(sourceTable)
		).map((note: Record) => note.fields);

		new Notice(
			`${t("There are")} ${notesToCreateOrUpdate.length} ${t(
				"files needed to be updated or created."
			)}`
		);

		let configDirModified = 0;

		while (notesToCreateOrUpdate.length > 0) {
			let toDealNotes = notesToCreateOrUpdate.slice(0, 10);
			for (let note of toDealNotes) {
				let validFileName = this.convertToValidFileName(
					note.Title || ""
				);
				let folderPath =
					directoryRootPath +
					(note.SubFolder ? `/${note.SubFolder}` : "");
				await this.createPathIfNeeded(folderPath);
				const noteExtension =
					"Extension" in note ? note.Extension : "md";
				const notePath = `${folderPath}/${validFileName}.${noteExtension}`;
				const noteExists = await vault.exists(notePath);
				if (!noteExists) {
					await vault.create(notePath, note.MD ? note.MD : "");
				} else if (noteExists && notePath.startsWith(".")) {
					await vault.adapter
						.write(notePath, note.MD)
						.catch((r: any) => {
							new Notice(t("Failed to write file: ") + r);
						});
					configDirModified++;
				} else {
					let file = this.app.vault.getFileByPath(notePath);
					await vault.modify(file, note.MD ? note.MD : "");
					await new Promise((r) => setTimeout(r, 100)); // 等待元数据更新
				}
			}

			notesToCreateOrUpdate = notesToCreateOrUpdate.slice(10);
			if (notesToCreateOrUpdate.length) {
				new Notice(
					`${t("There are")} ${notesToCreateOrUpdate.length} ${t(
						"files needed to be processed."
					)}`
				);
			} else {
				new Notice(t("All Finished."));
			}
		}
	}
}