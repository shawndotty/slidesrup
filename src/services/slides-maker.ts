import { App, Editor, Notice, TFile, moment } from "obsidian";
import { t } from "../lang/helpers";
import {
	slideChapterTemplate,
	slidePageTemplate,
	slideTemplate,
	baseLayoutWithSteps,
	toc,
	chapterAndPagesTemplate,
} from "../templates/slide-template";
import { SuggesterOption } from "../suggesters/base-suggester";
import {
	SlideLocationSuggester,
	SlideDesignSuggester,
} from "../suggesters/suggesters";
import { OBASAssistantSettings, ReplaceConfig } from "../types";
import {
	getTimeStamp,
	createPathIfNeeded,
	get_active_note_folder_path,
	get_tfiles_from_folder,
	get_list_items_from_note,
} from "src/utils";
import { InputModal } from "src/ui/modals/input-modal";
import { TEMPLATE_PLACE_HOLDERS } from "src/constants";

export class SlidesMaker {
	private app: App;
	private settings: OBASAssistantSettings;
	// 优化：通过遍历 TEMPLATE_PLACE_HOLDERS 动态生成正则表达式映射，减少重复代码
	private static readonly REPLACE_REGEX = Object.fromEntries(
		Object.entries(TEMPLATE_PLACE_HOLDERS).map(([key, value]) => [
			key,
			new RegExp(`{{${value}}}`, "g"),
		])
	);

	constructor(app: App, settings: OBASAssistantSettings) {
		this.app = app;
		this.settings = settings;
	}

	async createSlides(): Promise<void> {
		const newSlideContainer = await this._determineNewSlideLocation();
		if (newSlideContainer === null) {
			new Notice(t("Operation cancelled by user"));
			return;
		}

		let subFolder;

		if (this.settings.customizeSlideFolderName) {
			const modal = new InputModal(
				this.app,
				t("Please input slide folder name"),
				"",
				true,
				newSlideContainer
			);

			subFolder = await modal.openAndGetValue();
		}

		if (!subFolder?.trim()) {
			subFolder = t("Slide");
		}

		const newSlideLocation =
			newSlideContainer === "/"
				? subFolder
				: `${newSlideContainer}/${subFolder}`;

		await createPathIfNeeded(newSlideLocation);

		const { slideName, baseLayoutName, tocName } =
			this._generateNewSlideFilesNames();

		const tocTemplate = await this.getFinalTemplate(
			this.settings.userTocTemplate,
			toc()
		);

		await this._createAndOpenSlide(
			newSlideLocation,
			tocName,
			tocTemplate,
			false
		);

		const baseLayoutTemplate = await this.getFinalTemplate(
			this.settings.userBaseLayoutTemplate,
			baseLayoutWithSteps(),
			{
				toc: tocName,
				tagline: this.settings.tagline,
				slogan: this.settings.slogan,
			}
		);

		await this._createAndOpenSlide(
			newSlideLocation,
			baseLayoutName,
			baseLayoutTemplate,
			false
		);

		const finalTemplate = await this.getFinalTemplate(
			this.settings.userSlideTemplate,
			slideTemplate(),
			{
				baseLayout: baseLayoutName,
				toc: tocName,
				presenter: this.settings.presenter,
				presentDate: moment().format(
					this.settings.dateFormat || "YYYY-MM-DD"
				),
				obasPath: this.settings.obasFrameworkFolder,
				tagline: this.settings.tagline,
				slogan: this.settings.slogan,
			}
		);

		await this._createAndOpenSlide(
			newSlideLocation,
			slideName,
			finalTemplate
		);
	}

	async getUserTemplate(path: string, replaceConfig: ReplaceConfig) {
		let template = "";
		const slideFile = this.app.vault.getAbstractFileByPath(path);
		if (slideFile instanceof TFile) {
			template = await this.app.vault.read(slideFile);
		}
		// 优化：链式调用，减少中间变量，提升可读性
		const config = await this._addDesignSetToReplaceConfig(
			template,
			replaceConfig
		).then(async (cfg) => {
			return await this._fillTemplateConfig(template, cfg);
		});

		return this._finalizeTemplate(template, config);
	}

	private _finalizeTemplate(template: string, replaceConfig: ReplaceConfig) {
		let finalizedTemplate = template;
		for (const [key, value] of Object.entries(replaceConfig)) {
			const regex =
				SlidesMaker.REPLACE_REGEX[
					key as keyof typeof SlidesMaker.REPLACE_REGEX
				];
			if (regex) {
				finalizedTemplate = finalizedTemplate.replace(
					regex,
					value ?? ""
				);
			}
		}
		return finalizedTemplate.trim();
	}

	async getDefaultTemplate(
		template: string,
		replaceConfig: ReplaceConfig
	): Promise<string> {
		const config = await this._addDesignSetToReplaceConfig(
			template,
			replaceConfig
		).then(async (cfg) => {
			return await this._fillTemplateConfig(template, cfg);
		});

		return this._finalizeTemplate(template, config);
	}

	async getFinalTemplate(
		userTemplate: string,
		defaultTemplate: string | (() => string),
		replaceConfig: ReplaceConfig = {}
	) {
		if (this.settings.enableUserTemplates && userTemplate) {
			return await this.getUserTemplate(userTemplate, replaceConfig);
		} else {
			const template =
				typeof defaultTemplate === "function"
					? defaultTemplate()
					: defaultTemplate;
			return await this.getDefaultTemplate(template, replaceConfig);
		}
	}

	async addSlideChapter(): Promise<void> {
		// 并行获取章节名称和编号，提高效率
		const [cName, cIndex] = await Promise.all([
			this._getChapterName(),
			this._getChapterIndex(),
		]);

		const tocItem = `+ [${cName}](#c-${cIndex})`;
		await this._appendItemToTocFile(tocItem);

		const templateConfig = { cIndex, cName };
		const [userTemplate, defaultTemplate] = this.settings
			.addChapterWithSubPages
			? [
					this.settings.userChapterAndPagesTemplate,
					chapterAndPagesTemplate(),
			  ]
			: [this.settings.userChapterTemplate, slideChapterTemplate()];

		const finalTemplate = await this.getFinalTemplate(
			userTemplate,
			defaultTemplate,
			templateConfig
		);

		await this.addSlidePartial(finalTemplate);
	}

	async addSlidePage(): Promise<void> {
		const finalTemplate = await this.getFinalTemplate(
			this.settings.userPageTemplate,
			slidePageTemplate()
		);
		await this.addSlidePartial(finalTemplate);
	}

	async addSlidePartial(content: string): Promise<void> {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice(
				t("No active editor. Please open a file to add a slide.")
			);
			return;
		}

		this._insertAtCursor(editor, content.trim() + "\n\n");
	}

	private _insertAtCursor(editor: Editor, content: string): void {
		const cursor = editor.getCursor();
		editor.replaceRange(content, cursor);
		editor.setCursor(cursor.line + content.split("\n").length);
	}

	private async _getSlideName(): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input slide name"),
			""
		);
		return (await modal.openAndGetValue()) || "";
	}

	private async _getChapterIndex(): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input chapter index number"),
			""
		);
		return (await modal.openAndGetValue()) || "";
	}

	private async _getPageIndex(): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input page index number"),
			""
		);
		return (await modal.openAndGetValue()) || "";
	}

	private async _getChapterName(): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input chapter name"),
			""
		);
		return (await modal.openAndGetValue()) || "";
	}

	private async _addDesignSetToReplaceConfig(
		template: string,
		replaceConfig: ReplaceConfig
	): Promise<ReplaceConfig> {
		// 优化：减少变量声明，合并逻辑，提升可读性
		const config: ReplaceConfig = { ...replaceConfig };

		if (SlidesMaker.REPLACE_REGEX.design.test(template)) {
			let design = this.settings.defaultDesign;
			if (!design || design === "none") {
				const designOption = await this._selectSlideDesign();
				if (!designOption) {
					new Notice(t("Please select a slide design"));
					return replaceConfig;
				}
				design = designOption.value;
			}
			config.design = design?.toUpperCase?.() || "";
		}

		return config;
	}

	/**
	 * Fills the template configuration by detecting and prompting for missing values.
	 * This optimized version consolidates multiple methods into a single, declarative function.
	 */
	private async _fillTemplateConfig(
		template: string,
		cfg: ReplaceConfig
	): Promise<ReplaceConfig> {
		const newConfig = { ...cfg };

		const rules: ReadonlyArray<{
			key: keyof ReplaceConfig;
			regex: RegExp;
			getValue: () => Promise<string>;
		}> = [
			{
				key: "cIndex",
				regex: SlidesMaker.REPLACE_REGEX.cIndex,
				getValue: this._getChapterIndex.bind(this),
			},
			{
				key: "pIndex",
				regex: SlidesMaker.REPLACE_REGEX.pIndex,
				getValue: this._getPageIndex.bind(this),
			},
			{
				key: "slideName",
				regex: SlidesMaker.REPLACE_REGEX.slideName,
				getValue: this._getSlideName.bind(this),
			},
		];

		for (const rule of rules) {
			if (!newConfig[rule.key] && rule.regex.test(template)) {
				const value = await rule.getValue();
				if (value) {
					(newConfig as any)[rule.key] = value;
				}
			}
		}
		return newConfig;
	}

	private async _determineNewSlideLocation(): Promise<string | null> {
		const { newSlideLocationOption, assignedNewSlideLocation } =
			this.settings;
		const currentFolder =
			this.app.workspace.getActiveFile()?.parent?.path || "";

		switch (newSlideLocationOption) {
			case "current":
				return currentFolder;
			case "decideByUser": {
				const locationSuggester = new SlideLocationSuggester(
					this.app,
					currentFolder,
					assignedNewSlideLocation
				);
				const locationOption = await new Promise<SuggesterOption>(
					(resolve) => {
						locationSuggester.onChooseItem = (
							item: SuggesterOption,
							evt: MouseEvent | KeyboardEvent
						) => {
							resolve(item);
							return item;
						};
						locationSuggester.open();
					}
				);
				return locationOption ? locationOption.value : null;
			}
			case "assigned":
				return assignedNewSlideLocation;
			default:
				return currentFolder;
		}
	}

	private async _selectSlideDesign(): Promise<SuggesterOption | null> {
		const suggester = new SlideDesignSuggester(this.app);
		return new Promise((resolve) => {
			suggester.onChooseItem = (item: SuggesterOption) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});
	}

	private _getSlideFiles() {
		const currentFolderPath = get_active_note_folder_path(this.app);
		return currentFolderPath
			? get_tfiles_from_folder(this.app, currentFolderPath)
			: [];
	}

	private _getSlideTocFile(): TFile | null {
		const slideFiles = this._getSlideFiles();
		// 直接查找第一个包含“TOC”关键字的文件
		for (const file of slideFiles) {
			if (file instanceof TFile && file.basename.includes(t("TOC"))) {
				return file;
			}
		}
		return null;
	}

	private async _getSlideTocItems(): Promise<string[]> {
		const tocFile = this._getSlideTocFile();
		return tocFile ? await get_list_items_from_note(this.app, tocFile) : [];
	}

	private async _appendItemToTocFile(item: string) {
		const tocFile = this._getSlideTocFile();
		if (!tocFile) return;

		let content = await this.app.vault.read(tocFile);
		// 去除末尾多余空行，保证追加格式整洁
		content = content.replace(/\s+$/, "");
		const newContent = content ? `${content}\n${item}` : item;

		await this.app.vault.modify(tocFile, newContent);
		// 等待元数据更新
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	private _generateNewSlideFilesNames(): {
		slideName: string;
		baseLayoutName: string;
		tocName: string;
	} {
		const timestamp = getTimeStamp();
		return {
			slideName: `${timestamp}-${t("Slide")}`,
			baseLayoutName: `${timestamp}-${t("BaseLayout")}`,
			tocName: `${timestamp}-${t("TOC")}`,
		};
	}

	private async _createAndOpenSlide(
		location: string,
		fileName: string,
		content: string,
		open: boolean = true
	): Promise<void> {
		const filePath = `${location}/${fileName}.md`;

		const newFile = await this.app.vault.create(filePath, content);

		if (open && newFile instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(newFile);
		}
	}
}
