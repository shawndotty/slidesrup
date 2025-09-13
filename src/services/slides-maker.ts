import { App, Editor, Notice, TFile, moment, TFolder } from "obsidian";
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
	SlideModeSuggester,
} from "../suggesters/suggesters";
import {
	SlidesRupSettings,
	ReplaceConfig,
	UserSpecificListClassType,
} from "../types";
import {
	getTimeStamp,
	createPathIfNeeded,
	get_active_note_folder_path,
	get_tfiles_from_folder,
	get_list_items_from_note,
	getUserDesigns,
	getAllDesignsOptions,
} from "src/utils";
import { InputModal } from "src/ui/modals/input-modal";
import { TEMPLATE_PLACE_HOLDERS, DEFAULT_DESIGNS } from "src/constants";

export class SlidesMaker {
	private app: App;
	private settings: SlidesRupSettings;
	private defaultDesigns: typeof DEFAULT_DESIGNS = DEFAULT_DESIGNS;
	private userDesigns: Array<string> = [];
	private designOptions: Array<SuggesterOption> = [];
	// 优化：通过遍历 TEMPLATE_PLACE_HOLDERS 动态生成正则表达式映射，减少重复代码
	private static readonly REPLACE_REGEX = Object.fromEntries(
		Object.entries(TEMPLATE_PLACE_HOLDERS).map(([key, value]) => [
			key,
			new RegExp(`{{${value}}}`, "g"),
		])
	);
	// 优化：定义常用的正则表达式常量，避免重复定义
	// 修改正则，使其匹配 %% 后面不是 ! 的注释块
	private static readonly COMMENT_BLOCK_REGEX = /%%(?!\!|\[\[)([\s\S]*?)%%/g;
	private static readonly COMMENT_BLOCK_REPLACE_REGEX = /%%\!(.*?)%%/g;
	private static readonly COMMENT_BLOCK_TEMPLATE_REGEX = /%%\[\[(.*?)%%/g;

	private userSpecificListClass: UserSpecificListClassType = {
		TOCPageListClass: "",
		ChapterPageListClass: "",
		ContentPageListClass: "",
		BlankPageListClass: "",
		BackCoverPageListClass: "",
	};

	constructor(app: App, settings: SlidesRupSettings) {
		this.app = app;
		this.settings = settings;
		this.userDesigns = getUserDesigns(
			this.app,
			this.settings.slidesRupFrameworkFolder
		);
		this.designOptions = getAllDesignsOptions(
			this.userDesigns,
			this.defaultDesigns
		);
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

		await createPathIfNeeded(this.app, newSlideLocation);

		let slideMode = this.settings.slidesRupSlideMode;
		if (!slideMode || slideMode === "none") {
			slideMode = (await this._selectSlideMode())?.value || "light";
		}
		slideMode = slideMode.toLowerCase?.() || "light";

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
			slideTemplate(slideMode),
			{
				baseLayout: baseLayoutName,
				toc: tocName,
				presenter: this.settings.presenter,
				presentDate: moment().format(
					this.settings.dateFormat || "YYYY-MM-DD"
				),
				slidesRupPath: this.settings.slidesRupFrameworkFolder,
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
		replaceConfig: ReplaceConfig = {},
		isContentPage: boolean = false,
		design: string = ""
	) {
		// 优化后的代码，减少重复、提升可读性
		const getTemplate = async (tpl: string) =>
			await this.getUserTemplate(tpl, replaceConfig);

		if (this.settings.enableUserTemplates && userTemplate) {
			return getTemplate(userTemplate);
		}

		const template =
			typeof defaultTemplate === "function"
				? defaultTemplate()
				: defaultTemplate;

		if (isContentPage) {
			const contentTemplateName = `${t("ContentPage")}-${design}.md`;
			const contentTemplateFile = this.app.vault
				.getMarkdownFiles()
				.find((f) => f.name === contentTemplateName);

			if (contentTemplateFile?.path) {
				return getTemplate(contentTemplateFile.path);
			}
		}

		return await this.getDefaultTemplate(template, replaceConfig);
	}

	async addSlideChapter(): Promise<void> {
		// 并行获取章节名称和编号，提高效率
		const [cName, cIndex] = await Promise.all([
			this._getChapterName(),
			this._getChapterIndex(),
		]);

		const tocItem = `+ [${cName}](#c${cIndex})`;
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
			let design = this._getSlideDesign();
			if (!design || design === "none") {
				const designOption = await this._selectSlideDesign(
					this.designOptions
				);
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

	private async _selectSlideDesign(
		options: SuggesterOption[]
	): Promise<SuggesterOption | null> {
		const suggester = new SlideDesignSuggester(this.app, options);
		return new Promise((resolve) => {
			suggester.onChooseItem = (item: SuggesterOption) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});
	}

	private async _selectSlideMode(): Promise<SuggesterOption | null> {
		const suggester = new SlideModeSuggester(this.app);
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

	/**
	 * 优化生成新幻灯片相关文件名的方法，避免重复代码
	 */
	private _generateNewSlideFilesNames(targetSlide: string = ""): {
		slideName: string;
		baseLayoutName: string;
		tocName: string;
	} {
		const base = targetSlide || `${getTimeStamp()}-${t("Slide")}`;
		return {
			slideName: base,
			baseLayoutName: `${base}-${t("BaseLayout")}`,
			tocName: `${base}-${t("TOC")}`,
		};
	}

	/**
	 * 创建或更新幻灯片文件，并根据需要打开
	 * 优化：减少重复判断，简化逻辑
	 */
	private async _createAndOpenSlide(
		location: string,
		fileName: string,
		content: string,
		open: boolean = true
	): Promise<void> {
		const filePath = `${location}/${fileName}.md`;
		let file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
		} else {
			file = await this.app.vault.create(filePath, content);
		}

		if (open && file instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(file);
		}
	}

	/**
	 * Converts a markdown file to a slide presentation
	 */
	async convertMDToSlide() {
		// Get active file
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice(t("No active editor, can't excute this command."));
			return;
		}

		// 3. Process markdown content
		const { content, lines, headingsInfo, targetSlide } =
			await this._extractContentFromFile(activeFile);

		// Check if content already contains slide annotations
		if (content.includes("<!-- slide")) {
			new Notice(t("This file is already a slide presentation"));
			return;
		}

		// Validate document structure
		if (!headingsInfo.length) {
			new Notice(t("Invalid Format: No headings found"));
			return;
		}

		// Check for required heading levels
		const hasH1 = headingsInfo.some((h) => h.level === 1);

		if (!hasH1) {
			new Notice(t("Invalid Format: Document must contain H1 headings"));
			return;
		}

		let newLines = lines;

		// 统计各级标题数量
		const headingCounts = Array.from({ length: 6 }, (_, i) => ({
			level: i + 1,
			count: headingsInfo.filter((h) => h.level === i + 1).length,
		}));

		// 根据标题结构确定幻灯片源模式
		let slideSourceMode = 0;

		const [h1, h2, h3, h4, h5, h6] = headingCounts.map((h) => h.count);

		// 判断文档结构类型
		if (h1 === 1) {
			if (h2 > 0) {
				slideSourceMode = h3 > 0 ? 1 : 2; // 完整章节结构 vs 简单章节结构
			} else if ([h2, h3, h4, h5, h6].every((count) => count === 0)) {
				slideSourceMode = 4; // 仅有一个一级标题
			}
		} else if (h1 > 1) {
			slideSourceMode = 3; // 多个一级标题
		}

		if (slideSourceMode === 3) {
			newLines = this._regularizeHeadingsForContent(
				activeFile.basename,
				lines
			);
		}

		await this._resetUserSpecificListClass(activeFile);

		// 1. Setup slide location and get active file
		const {
			newSlideContainer,
			newSlideLocation,
			design,
			slideMode,
			slideSize,
		} = await this._setupSlideConversion();
		if (newSlideContainer === null) return;

		// 2. Generate file names for slide components
		const { slideName, baseLayoutName, tocName } =
			this._generateNewSlideFilesNames(targetSlide);

		// 简化模式标志,当文档结构为单一一级标题时启用
		const minimizeMode = slideSourceMode === 4;

		if (!minimizeMode) {
			// 4. Create TOC file
			await this._createTocFile(newSlideLocation, tocName, newLines);

			// 5. Create BaseLayout file
			await this._createBaseLayoutFile(
				newSlideLocation,
				baseLayoutName,
				tocName,
				design
			);
		}

		// 6. Process content and create final slide
		const processedContent = await this._processContentForSlide(
			content,
			newLines,
			design,
			tocName,
			baseLayoutName,
			activeFile,
			slideMode,
			slideSize,
			slideSourceMode
		);
		await this._createAndOpenSlide(
			newSlideLocation,
			slideName,
			processedContent
		);
	}

	private _regularizeHeadingsForContent(
		fileName: string,
		lines: string[]
	): string[] {
		// 添加文件名作为 H1 标题
		lines.unshift(`# ${fileName}`);

		// 处理现有标题
		for (let i = 1; i < lines.length; i++) {
			const headingMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
			if (!headingMatch) continue;

			const currentLevel = headingMatch[1].length;
			if (currentLevel === 6) {
				// H6 转换为粗体文本
				const h7 = headingMatch[2].replace(/%%.+%%/g, "");
				lines[
					i
				] = `<h6 id="${h7.toLowerCase()}" class="sr-h7">${h7}</h6>`;
			} else {
				// 其他标题级别 +1，最大不超过 H6
				const newLevel = Math.min(currentLevel + 1, 6);
				lines[i] = `${"#".repeat(newLevel)} ${headingMatch[2]}`;
			}
		}

		return lines;
	}

	/**
	 * 优化：重置 userSpecificListClass，根据 frontmatter 批量设置各类 ListClass。
	 * 进一步优化：减少对象创建次数，提升可读性和性能。
	 */
	private async _resetUserSpecificListClass(file: TFile) {
		const keys: Array<keyof UserSpecificListClassType> = [
			"TOCPageListClass",
			"ChapterPageListClass",
			"ContentPageListClass",
			"BlankPageListClass",
			"BackCoverPageListClass",
		];

		// 统一获取默认值
		const getDefault = (key: keyof UserSpecificListClassType): string => {
			const settingKey = `slidesRupUser${key}` as keyof SlidesRupSettings;
			const value = this.settings[settingKey];
			return typeof value === "string" ? value : "";
		};

		// 如果没有文件，直接用默认值
		if (!file) {
			this.userSpecificListClass = keys.reduce((acc, key) => {
				acc[key] = getDefault(key);
				return acc;
			}, {} as UserSpecificListClassType);
			return;
		}

		const fm = (await this.app.metadataCache.getFileCache(file))
			?.frontmatter;
		// 没有 frontmatter 也用默认值
		if (!fm) {
			this.userSpecificListClass = keys.reduce((acc, key) => {
				acc[key] = getDefault(key);
				return acc;
			}, {} as UserSpecificListClassType);
			return;
		}

		// 优先 frontmatter，其次默认值
		this.userSpecificListClass = keys.reduce((acc, key) => {
			acc[key] = fm[key] ?? getDefault(key);
			return acc;
		}, {} as UserSpecificListClassType);
	}

	/**
	 * Sets up the initial requirements for slide conversion
	 */
	private async _setupSlideConversion(): Promise<{
		newSlideContainer: string | null;
		newSlideLocation: string;
		design: string;
		slideMode: string;
		slideSize: { w: number; h: number };
	}> {
		const activeFile = this.app.workspace.getActiveFile();

		// 优先使用 frontmatter 指定的幻灯片路径和尺寸，否则使用默认设置
		const slideFMLocation = this._getSlideLocation(activeFile);
		const userSlideSize = this._getSlideSize(activeFile);

		const slideSizeMap: Record<string, { w: number; h: number }> = {
			"p16-9": { w: 1920, h: 1080 },
			"p9-16": { w: 1080, h: 1920 },
			a4v: { w: 1240, h: 1754 },
			a4h: { w: 1754, h: 1240 },
		};
		const slideSize =
			userSlideSize ||
			slideSizeMap[this.settings.slidesRupDefaultSlideSize] ||
			slideSizeMap["p16-9"];

		let newSlideLocation = "";
		let newSlideContainer = "";

		if (slideFMLocation) {
			newSlideLocation = slideFMLocation;
		} else {
			const slideContainer = await this._determineNewSlideLocation();
			if (slideContainer === null) {
				new Notice(t("Operation cancelled by user"));
				return {
					newSlideContainer: null,
					newSlideLocation: "",
					design: "",
					slideMode: "",
					slideSize: { w: 1920, h: 1080 },
				};
			}
			let subFolder = this.settings.customizeSlideFolderName
				? await new InputModal(
						this.app,
						t("Please input slide folder name"),
						"",
						true,
						slideContainer
				  ).openAndGetValue()
				: undefined;
			if (!subFolder?.trim()) subFolder = t("Slide");
			newSlideLocation =
				slideContainer === "/"
					? subFolder
					: `${slideContainer}/${subFolder}`;
			newSlideContainer = slideContainer;
		}

		await createPathIfNeeded(this.app, newSlideLocation);

		// 优先级：frontmatter > 用户选择 > 默认
		let design = this._getSlideDesign(activeFile);
		if (!design || design === "none") {
			design =
				(await this._selectSlideDesign(this.designOptions))?.value ||
				"H";
		}

		let slideMode = this.settings.slidesRupSlideMode;
		if (!slideMode || slideMode === "none") {
			slideMode = (await this._selectSlideMode())?.value || "light";
		}
		slideMode = slideMode.toLowerCase?.() || "light";

		return {
			newSlideContainer,
			newSlideLocation,
			design,
			slideMode,
			slideSize,
		};
	}

	/**
	 * Extracts content from a file, removing frontmatter
	 */
	private async _extractContentFromFile(file: TFile): Promise<{
		content: string;
		lines: string[];
		headingsInfo: Array<{
			level: number;
			text: string;
			position: {
				start: { line: number; col: number; offset: number };
				end: { line: number; col: number; offset: number };
			};
		}>;
		targetSlide: string;
	}> {
		const originalContent = await this.app.vault.read(file);
		let content = originalContent;

		// Remove frontmatter if present
		const fileCache = this.app.metadataCache.getFileCache(file);
		const frontmatterPosition =
			fileCache?.frontmatterPosition || fileCache?.frontmatter?.position;

		if (frontmatterPosition) {
			content = originalContent.slice(frontmatterPosition.end.offset + 1);
		}

		// Get headings from file cache
		const headings = fileCache?.headings || [];

		// Extract heading content and levels
		const headingsInfo = headings.map((heading) => ({
			level: heading.level,
			text: heading.heading,
			position: heading.position,
		}));

		content = content.replace(/^\s*\n/, "");

		const lines = content.split("\n");

		const targetSlide = fileCache?.frontmatter?.slideName || "";
		return { content, lines, headingsInfo, targetSlide };
	}

	/**
	 * Creates the TOC file from markdown headings
	 */
	private async _createTocFile(
		location: string,
		tocName: string,
		lines: string[]
	): Promise<void> {
		// Extract H2 headings and create TOC content
		const h2List = lines
			.map((line) => {
				const match = line.match(/^##\s+(.*)/);
				return match ? match[1].trim() : null;
			})
			.filter(Boolean) as string[];

		const tocContent = h2List.length
			? h2List.map((item, idx) => `+ [${item}](#c${idx + 1})`).join("\n")
			: "";

		await this._createAndOpenSlide(location, tocName, tocContent, false);
	}

	/**
	 * Creates the BaseLayout file for the slide
	 */
	private async _createBaseLayoutFile(
		location: string,
		baseLayoutName: string,
		tocName: string,
		design: string
	): Promise<void> {
		const baseLayoutTemplate = await this.getFinalTemplate(
			this.settings.userBaseLayoutTemplate,
			baseLayoutWithSteps(),
			{
				toc: tocName,
				tagline: this.settings.tagline,
				slogan: this.settings.slogan,
			},
			true,
			design
		);
		await this._createAndOpenSlide(
			location,
			baseLayoutName,
			baseLayoutTemplate,
			false
		);
	}

	/**
	 * Processes markdown content for slide presentation
	 */
	private async _processContentForSlide(
		content: string,
		lines: string[],
		design: string,
		tocName: string,
		baseLayoutName: string,
		activeFile: TFile,
		slideMode: string,
		slideSize: {
			w: number;
			h: number;
		},
		slideSourceMode: number
	): Promise<string> {
		// 创建处理管道，每个步骤返回处理后的内容
		type ProcessStep = (content: string) => string | Promise<string>;

		const simpleMode = slideSourceMode === 2;
		const minimizeMode = slideSourceMode === 4;

		// 定义处理步骤
		const processPipeline: ProcessStep[] = [
			// 1. 添加空页注释
			(content) => this._addEmptyPageAnnotation(lines, design).join("\n"),

			// 2. 添加页面分隔符
			(content) => this._addPageSeparators(content.split("\n")),

			// 3. 添加章节幻灯片注释
			(content) =>
				minimizeMode
					? content
					: this._addChapterSlideAnnotations(
							content,
							design,
							simpleMode
					  ),

			// 4. 添加 H3 链接到章节
			(content) =>
				minimizeMode ? content : this._addH3LinksToChapters(content),

			// 5. 添加页面幻灯片注释
			(content) =>
				minimizeMode ? content : this._addPageSlideAnnotations(content),

			// 6. 添加子页面注释
			(content) =>
				minimizeMode
					? content
					: this._addSubPageAnnotation(content.split("\n")).join(
							"\n"
					  ),

			// 7. 添加目录幻灯片
			(content) =>
				minimizeMode
					? content
					: this._addTocSlide(content, tocName, design),

			// 8. 转换 WikiLinks
			(content) =>
				this._getAutoConvertLinks(activeFile)
					? this._convertMarkdownLinksToPreviewLinks(content)
					: content,

			// 9. 添加段落片段
			(content) =>
				this._getEnableParagraphFragments(activeFile)
					? this._addFragmentsToParagraph(content)
					: content,

			// 10. 生成最终内容
			(content) =>
				this._generateFinalSlideContent(
					content,
					baseLayoutName,
					design,
					activeFile,
					slideMode,
					slideSize,
					minimizeMode
				),
		];

		// 执行处理管道
		let processedContent = content;
		for (const step of processPipeline) {
			processedContent = await step(processedContent);
		}

		return processedContent;
	}

	/**
	 * 将文本中的 [name](link) 格式全部转换为 <a href="link" data-preview-link>name</a>
	 * 其中 name 可以是任意字符，link 必须是 http 或 https 开头的链接
	 */
	private _convertMarkdownLinksToPreviewLinks(text: string): string {
		// 使用正则匹配 [name](link) 形式，link 以 http 或 https 开头
		// 排除 ![ 开头的图片嵌入语法
		return text
			.replace(
				/!\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g,
				(match, name, link) => {
					return `<img alt="${name}" src="${link}" data-preview-image />`;
				}
			)
			.replace(
				/(?<!!)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
				(match, name, link) => {
					return `<a href="${link}" data-preview-link>${name}</a>`;
				}
			);
	}

	private _addFragmentsToParagraph(text: string): string {
		// 优化：先保护代码块，然后处理普通段落
		return this._processTextWithBlockProtection(text);
	}

	private _processTextWithBlockProtection(text: string): string {
		// 第一步：标记代码块、数学块和 HTML 块区域，防止被修改
		const blockMarkers: {
			start: number;
			end: number;
			content: string;
			type: "code" | "math" | "html";
		}[] = [];
		let processedText = text;

		// 匹配代码块并保存位置信息
		const codeBlockRegex = /```[\s\S]*?```/g;
		let match;

		while ((match = codeBlockRegex.exec(text)) !== null) {
			blockMarkers.push({
				start: match.index,
				end: match.index + match[0].length,
				content: match[0],
				type: "code",
			});
		}

		// 匹配数学块并保存位置信息
		const mathBlockRegex = /\$\$[\s\S]*?\$\$/g;

		while ((match = mathBlockRegex.exec(text)) !== null) {
			blockMarkers.push({
				start: match.index,
				end: match.index + match[0].length,
				content: match[0],
				type: "math",
			});
		}

		// 匹配 HTML 块并保存位置信息（成对标签）
		// 仅添加与已有代码/数学块不重叠的 HTML 块
		const htmlBlockRegex = /<([A-Za-z][\w:-]*)\b[^>]*>[\s\S]*?<\/\1>/g;
		while ((match = htmlBlockRegex.exec(text)) !== null) {
			const start = match.index;
			const end = match.index + match[0].length;
			let overlapsExisting = false;
			for (const m of blockMarkers) {
				if (!(end <= m.start || start >= m.end)) {
					overlapsExisting = true;
					break;
				}
			}
			if (!overlapsExisting) {
				blockMarkers.push({
					start,
					end,
					content: match[0],
					type: "html",
				});
			}
		}

		// 按位置排序，确保按顺序处理
		blockMarkers.sort((a, b) => a.start - b.start);

		// 从后往前替换，避免位置偏移问题
		for (let i = blockMarkers.length - 1; i >= 0; i--) {
			const marker = blockMarkers[i];
			const placeholder =
				marker.type === "code"
					? `__CODE_BLOCK_${i}__`
					: marker.type === "math"
					? `__MATH_BLOCK_${i}__`
					: `__HTML_BLOCK_${i}__`;

			processedText =
				processedText.substring(0, marker.start) +
				placeholder +
				processedText.substring(marker.end);
		}

		// 第二步：在非代码块、数学块和 HTML 块区域添加 fragment
		processedText = this._addFragmentsToNonCodeBlocks(processedText);

		// 第三步：恢复代码块、数学块和 HTML 块内容
		blockMarkers.forEach((marker, index) => {
			const placeholder =
				marker.type === "code"
					? `__CODE_BLOCK_${index}__`
					: marker.type === "math"
					? `__MATH_BLOCK_${index}__`
					: `__HTML_BLOCK_${index}__`;

			processedText = processedText.replace(
				placeholder,
				() => marker.content
			);
		});

		return processedText;
	}

	private _addFragmentsToNonCodeBlocks(text: string): string {
		// 匹配Markdown中的段落（非标题、非列表、非代码块、非数学块、非空行）
		return text.replace(
			/(^|\n)(?!\s*[-*+>]|#{1,3}\s|`{3,}|>\s*| {4,}|\d+\.\s)([^\n][^\n]*[^\n])(?=\n|$)/g,
			(match, p1, p2) => {
				// 跳过空行和以![[开头的段落
				if (
					!p2.trim() ||
					p2.trim().startsWith("![[") ||
					p2.trim().startsWith("<!--") ||
					p2.trim().startsWith("|") ||
					p2.trim().startsWith("---") ||
					p2.trim().startsWith(":::") ||
					p2.trim().startsWith("__CODE_BLOCK_") ||
					p2.trim().startsWith("__MATH_BLOCK_") ||
					p2.trim().startsWith("__HTML_BLOCK_")
				)
					return match;
				// 如果是 Markdown 4~6 级标题，只包裹标题文本，不包含 #
				const hMatch = p2.match(/^(#{4,6})\s+(.*)$/);
				if (hMatch) {
					const hashes = hMatch[1];
					const title = hMatch[2];
					if (title.trim().length === 0) return match;
					return `${p1}${hashes} <span class="fragment">${title}</span>`;
				}
				return `${p1}<span class="fragment">${p2}</span>`;
			}
		);
	}

	private _addEmptyPageAnnotation(lines: string[], design: string): string[] {
		const newLines: string[] = [];
		for (const line of lines) {
			if (/^(-|\*){3,}$/.test(line)) {
				newLines.push(line);
				newLines.push(
					`\n<!-- slide template="[[${t(
						"BlankPage"
					)}-${design}]]" class="${
						this.userSpecificListClass.BlankPageListClass ||
						this.settings.slidesRupDefaultBlankListClass
					}" -->`
				);
			} else {
				newLines.push(line);
			}
		}
		return newLines;
	}

	private _addSubPageAnnotation(lines: string[]): string[] {
		let currentChapterIndex = 0;
		let pageIndexInChapter = 0;
		let subPageIndex = 0;
		const finalLines: string[] = [];

		for (const line of lines) {
			if (/^##\s+/.test(line)) {
				currentChapterIndex++;
				pageIndexInChapter = 0;
			}
			if (/^###\s+/.test(line)) {
				pageIndexInChapter++;
				subPageIndex = 0;
			}
			if (/^#{4,6}\s+/.test(line) && /%%/.test(line)) {
				subPageIndex++;
				const chapterClass = `chapter-${currentChapterIndex}`;
				const classValue = this._modidySlideClassList(
					line,
					this.userSpecificListClass.ContentPageListClass ||
						this.settings.slidesRupDefaultContentListClass
				);
				const template = this._modidySlideTemplate(line, "");
				const slideTemplate =
					(template && `template="${template}"`) || "";

				finalLines.push("---");
				finalLines.push(
					`\n<!-- slide id="c${currentChapterIndex}p${pageIndexInChapter}s${subPageIndex}" ${slideTemplate} class="${chapterClass} ${classValue}" -->\n`
				);
				finalLines.push(this._cleanLine(line));
			} else {
				finalLines.push(line);
			}
		}

		return finalLines;
	}

	/**
	 * Adds page separators (---) before each heading
	 */
	private _addPageSeparators(lines: string[]): string {
		let headingCount = 0;
		const newLines: string[] = [];

		for (const line of lines) {
			if (/^#{1,3}\s/.test(line)) {
				headingCount++;
				// 优化：只在3级标题前插入分隔符，无需插入空行
				if (headingCount > 1) {
					newLines.push("---");
				}
			}
			newLines.push(line);
		}

		return newLines.join("\n");
	}

	/**
	 * Adds slide annotations for chapter headings (H2)
	 */
	private _addChapterSlideAnnotations(
		content: string,
		design: string,
		simpleMode: boolean = false
	): string {
		let h2Index = 0;
		const modifiedLines: string[] = [];
		let defaultTemplate = `[[${t("Chapter")}-${design}]]`;

		if (simpleMode) {
			defaultTemplate = "";
		}

		for (const line of content.split("\n")) {
			if (/^##\s+/.test(line)) {
				h2Index++;
				const classValue = this._modidySlideClassList(
					line,
					this.userSpecificListClass.ChapterPageListClass ||
						this.settings.slidesRupDefaultChapterListClass
				);

				const template = this._modidySlideTemplate(
					line,
					defaultTemplate
				);

				const templateStr = template ? `template="${template}"` : "";

				modifiedLines.push(
					`\n<!-- slide id="c${h2Index}" ${templateStr} class="${classValue}" -->\n`
				);
				// 去除所有注释块
				modifiedLines.push(this._cleanLine(line));
			} else {
				modifiedLines.push(line);
			}
		}

		return modifiedLines.join("\n");
	}

	/**
	 * Adds H3 links to each chapter (H2)
	 */
	private _addH3LinksToChapters(content: string): string {
		const lines = content.split("\n");
		const resultLines: string[] = [];
		let currentH2Index = 0;
		let h3TitleList: {
			title: string;
			h2: number;
			h3: number;
			lineIdx: number;
		}[] = [];
		let h3Index = 0;
		let inH2 = false;

		// First pass: collect all H3 headings and their positions
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (/^##\s+/.test(line)) {
				currentH2Index++;
				h3Index = 0;
				inH2 = true;
			} else if (/^###\s+/.test(line) && inH2) {
				h3Index++;
				const h3Title = line.replace(/^###\s+|%%.+%%/g, "").trim();
				h3TitleList.push({
					title: h3Title,
					h2: currentH2Index,
					h3: h3Index,
					lineIdx: i,
				});
			}
		}

		// Second pass: insert H3 links after each H2
		currentH2Index = 0;
		let h3TitleIdx = 0;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (/^##\s+/.test(line)) {
				currentH2Index++;
				resultLines.push(line);

				// Collect all H3s for this H2
				const h3s = [];
				let tempIdx = h3TitleIdx;
				while (
					tempIdx < h3TitleList.length &&
					h3TitleList[tempIdx].h2 === currentH2Index
				) {
					const h3 = h3TitleList[tempIdx];
					h3s.push(`+ [${h3.title}](#c${h3.h2}p${h3.h3})`);
					tempIdx++;
				}

				if (h3s.length > 0) {
					resultLines.push(...h3s);
				}
			} else if (/^###\s+/.test(line)) {
				h3TitleIdx++;
				resultLines.push(line);
			} else {
				resultLines.push(line);
			}
		}

		return resultLines.join("\n");
	}

	/**
	 * Adds slide annotations for page headings (H3)
	 */
	private _addPageSlideAnnotations(content: string): string {
		const lines = content.split("\n");
		let currentChapterIndex = 0;
		let pageIndexInChapter = 0;
		const finalLines: string[] = [];

		for (const line of lines) {
			if (/^##\s+/.test(line)) {
				currentChapterIndex++;
				pageIndexInChapter = 0;
			}
			if (/^###\s+/.test(line)) {
				pageIndexInChapter++;
				const chapterClass = `chapter-${currentChapterIndex}`;
				let classValue = this._modidySlideClassList(
					line,
					this.userSpecificListClass.ContentPageListClass ||
						this.settings.slidesRupDefaultContentListClass
				);

				const template = this._modidySlideTemplate(line, "");
				const slideTemplate =
					(template && `template="${template}"`) || "";

				finalLines.push(
					`\n<!-- slide id="c${currentChapterIndex}p${pageIndexInChapter}" ${slideTemplate} class="${chapterClass} ${classValue}" -->\n`
				);
				finalLines.push(this._cleanLine(line));
			} else {
				finalLines.push(line);
			}
		}

		return finalLines.join("\n");
	}

	/**
	 * Adds TOC slide to the content
	 */
	private _addTocSlide(
		content: string,
		tocName: string,
		design: string
	): string {
		const tocEmbed = `---\n\n<!-- slide template="[[${t(
			"TOC"
		)}-${design}]]" class="${
			this.userSpecificListClass.TOCPageListClass ||
			this.settings.slidesRupDefaultTOCListClass
		}" -->\n\n## ${t("TOC")}\n\n![[${tocName}]]\n`;
		const contentLines = content.split("\n");

		const tocIndex = contentLines.findIndex(
			(line) => line.trim() === "---"
		);
		if (tocIndex !== -1) {
			contentLines.splice(tocIndex, 0, tocEmbed);
		} else {
			contentLines.unshift(tocEmbed);
		}

		return contentLines.join("\n");
	}

	/**
	 * Generates the final slide content with frontmatter, cover and back pages
	 */
	private _generateFinalSlideContent(
		content: string,
		baseLayoutName: string,
		design: string,
		activeFile: TFile,
		slideMode: string,
		slideSize: {
			w: number;
			h: number;
		},
		minimizeMode: boolean = false
	): string {
		// Generate frontmatter
		const frontmatter = `---
css: dist/Styles/main${slideMode === "dark" ? "-dark" : ""}.css
enableLinks: true
width: ${slideSize.w}
height: ${slideSize.h}
margin: 0
aliases:
 - ${activeFile.basename}
defaultTemplate: "[[${baseLayoutName}]]"
pdfSeparateFragments: false
verticalSeparator: \\*\\*\\*
theme: white
transition: none
---`;

		// Generate cover slide
		const coverSlide = `<!-- slide id="home" template="[[${t(
			"Cover"
		)}-${design}]]" -->`;

		const oburi = this._getOBURI(activeFile);

		const newContent = this._addAuthorAndDate(
			this._addLinkToH1(content, oburi),
			minimizeMode
		);

		// Generate back cover slide
		const lbnl = this._getLastButNotLeast(activeFile);
		const backCoverSlide = `---

<!-- slide template="[[${t("BackCover")}-${design}]]" class="${
			this.userSpecificListClass.BackCoverPageListClass ||
			this.settings.slidesRupDefaultBackCoverListClass
		}" -->

${lbnl}
`;

		// Combine all parts
		return `${frontmatter.trim()}\n${coverSlide}\n\n${newContent}\n\n${backCoverSlide}`;
	}

	/**
	 * 获取指定文件的OBURI链接
	 * @param file - 目标文件
	 * @returns OBURI链接字符串
	 */
	private _getOBURI(file: TFile): string {
		// 获取当前 vault 名称
		const vaultName = this.app.vault.getName();
		// 对文件路径进行编码
		const encodedPath = encodeURIComponent(file.path);
		// 构建 Obsidian URI
		const uri = `obsidian://open?vault=${encodeURIComponent(
			vaultName
		)}&file=${encodedPath}`;
		return uri;
	}

	private _addLinkToH1(content: string, oburi: string): string {
		const h1Regex = /^#\s+(.+)$/m;
		const match = content.match(h1Regex);

		if (match) {
			const h1Text = match[1];
			// 将标题一的内容替换为带链接的形式
			const linkedH1 = `# [${h1Text}](${oburi})`;
			return content.replace(h1Regex, linkedH1);
		}

		return content;
	}

	private _getLastButNotLeast(activeFile: TFile): string {
		const fileCache = this.app.metadataCache.getFileCache(activeFile);
		const lbnl =
			(fileCache?.frontmatter?.lastButNotLeast as string) ||
			`# ${t("Farewell")}`;
		return lbnl;
	}

	private _addAuthorAndDate(
		content: string,
		minimizeMode: boolean = false
	): string {
		const author = this.settings.presenter || "";
		const date = moment().format(this.settings.dateFormat || "YYYY-MM-DD");
		const authorTemplate = `::: author\n${author}\n:::\n`;
		const dateTemplate = `::: date\n${date}\n:::\n`;

		const contentLines = content.split("\n");
		// 在 contentLines 中查找第一个 '---'，并在其前面插入 authorTemplate 和 dateTemplate
		const firstSeparatorLineIndex = contentLines.findIndex(
			(line) => line.trim() === "---"
		);
		if (firstSeparatorLineIndex !== -1) {
			const before = contentLines.slice(0, firstSeparatorLineIndex);
			const after = contentLines.slice(firstSeparatorLineIndex);
			return [...before, authorTemplate, dateTemplate, ...after].join(
				"\n\n"
			);
		} else {
			// 如果没有找到 '---'，则直接在内容最前面插入
			// 根据最小化模式决定模板组合顺序
			return minimizeMode
				? [content, authorTemplate, dateTemplate].join("\n\n")
				: [authorTemplate, dateTemplate, content].join("\n\n");
		}
	}

	/**
	 * Gets the slide design to use for the current context.
	 * Priority order: frontmatter.slideDesign → settings.slidesRupUserDesigns → settings.defaultDesign
	 *
	 * @param activeFile - Optional file to check, defaults to current active file
	 * @returns The design string to use
	 */
	private _getSlideDesign(activeFile?: TFile | null): string {
		const design =
			activeFile &&
			typeof this.app.metadataCache.getFileCache(activeFile)?.frontmatter
				?.slideDesign === "string"
				? // 这里的!是TypeScript的非空断言（Non-null Assertion Operator），用于告诉编译器在此处对象不会为null或undefined，跳过类型检查。
				  this.app.metadataCache
						.getFileCache(activeFile)!
						.frontmatter!.slideDesign!.trim()
				: "";
		return design ? design : this._getFallbackDesign();
	}

	private _getSlideLocation(activeFile?: TFile | null): string {
		const loc = activeFile
			? this.app.metadataCache.getFileCache(activeFile)?.frontmatter
					?.slideLocation
			: "";
		return typeof loc === "string" && loc.trim() ? loc.trim() : "";
	}

	private _getSlideSize(
		activeFile?: TFile | null
	): { w: number; h: number } | null {
		if (!activeFile) return null;
		const frontmatter =
			this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
		const width = frontmatter?.slideWidth;
		const height = frontmatter?.slideHeight;
		if (
			typeof width === "number" &&
			typeof height === "number" &&
			width > 0 &&
			height > 0
		) {
			return { w: width, h: height };
		}
		return null;
	}

	private _getAutoConvertLinks(activeFile?: TFile | null): boolean {
		if (!activeFile) {
			return this.settings.slidesRupAutoConvertLinks;
		}

		// Get file cache (this is already cached by Obsidian)
		const fileCache = this.app.metadataCache.getFileCache(activeFile);
		const frontmatterAutoConvertLinks =
			fileCache?.frontmatter?.autoConvertLinks;

		// Return frontmatter autoConvertLinks if it exists
		if (
			frontmatterAutoConvertLinks !== undefined &&
			typeof frontmatterAutoConvertLinks === "boolean"
		) {
			return frontmatterAutoConvertLinks;
		}

		return this.settings.slidesRupAutoConvertLinks;
	}

	private _getEnableParagraphFragments(activeFile?: TFile | null): boolean {
		if (!activeFile) {
			return this.settings.slidesRupEnableParagraphFragments;
		}

		// Get file cache (this is already cached by Obsidian)
		const fileCache = this.app.metadataCache.getFileCache(activeFile);
		const frontmatterEnableParagraphFragments =
			fileCache?.frontmatter?.enableParagraphFragments;

		// Return frontmatter autoConvertLinks if it exists
		if (
			frontmatterEnableParagraphFragments !== undefined &&
			typeof frontmatterEnableParagraphFragments === "boolean"
		) {
			return frontmatterEnableParagraphFragments;
		}

		return this.settings.slidesRupEnableParagraphFragments;
	}
	/**
	 * Gets the fallback design from settings
	 * @private
	 */
	private _getFallbackDesign(): string {
		const userDesign = this.settings.slidesRupUserDesigns;
		const defaultDesign = this.settings.defaultDesign;

		// Check if user design is set and not 'none'
		if (userDesign && userDesign !== "none" && userDesign.trim()) {
			return userDesign.trim();
		}

		// Return default design, ensuring it's not empty
		return defaultDesign && defaultDesign.trim()
			? defaultDesign.trim()
			: "A";
	}

	private _modidySlideTemplate(line: string, template: string): string {
		const matches = line.match(SlidesMaker.COMMENT_BLOCK_TEMPLATE_REGEX);
		let extracted: string[] = [];

		if (matches && matches.length > 0) {
			// 否则，提取普通注释内容，追加到默认 class 后面
			extracted = matches.map((m) => m.slice(2, -2).trim());
			if (extracted.length > 0) {
				template = extracted.join(" ");
			}
		}

		return template;
	}

	private _modidySlideClassList(line: string, listClass: string): string {
		const matches = line.match(SlidesMaker.COMMENT_BLOCK_REGEX);
		const replaceMatches = line.match(
			SlidesMaker.COMMENT_BLOCK_REPLACE_REGEX
		);
		let extracted: string[] = [];
		let merged = "";

		if (replaceMatches && replaceMatches.length > 0) {
			// 如果匹配到 %%! ... %%，则用其内容覆盖 class
			const replaceContent = replaceMatches
				.map((m) => m.slice(3, -2).trim())
				.join(" ");
			if (replaceContent) {
				listClass = replaceContent;
			}
		} else if (matches && matches.length > 0) {
			// 否则，提取普通注释内容，追加到默认 class 后面
			extracted = matches.map((m) => m.slice(2, -2).trim());
			if (extracted.length > 0) {
				merged = extracted.join(" ");
				listClass += merged ? ` ${merged}` : "";
			}
		}

		return listClass;
	}

	private _cleanLine(line: string): string {
		// 优化：合并正则，减少多次 replace，提高效率
		if (/`[^`]+`/.test(line)) return line;
		return line
			.replace(/%%(?!\!|\[\[)[\s\S]*?%%|%%\!.*?%%|%%\[\[.*?%%/g, "")
			.trim();
	}
}
