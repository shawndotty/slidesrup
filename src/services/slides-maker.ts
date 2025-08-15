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

	async convertMDToSlide() {
		// 1. 获取新幻灯片存放位置
		const newSlideContainer = await this._determineNewSlideLocation();
		if (newSlideContainer === null) {
			new Notice(t("Operation cancelled by user"));
			return;
		}

		// 2. 获取当前激活文件
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice(
				t("No active editor. Please open a file to add a slide.")
			);
			return;
		}

		// 3. 获取子文件夹名
		let subFolder = this.settings.customizeSlideFolderName
			? await new InputModal(
					this.app,
					t("Please input slide folder name"),
					"",
					true,
					newSlideContainer
			  ).openAndGetValue()
			: undefined;
		if (!subFolder?.trim()) subFolder = t("Slide");

		const newSlideLocation =
			newSlideContainer === "/"
				? subFolder
				: `${newSlideContainer}/${subFolder}`;
		await createPathIfNeeded(newSlideLocation);

		// 确定Design

		let design = this.settings.defaultDesign;
		if (!design || design === "none") {
			design = (await this._selectSlideDesign())?.value || "H";
		}
		design = design.toUpperCase?.();

		// 4. 生成文件名
		const { slideName, baseLayoutName, tocName } =
			this._generateNewSlideFilesNames();

		// 6. 读取并处理内容，去除 frontmatter（优化版）
		const originalContent = await this.app.vault.read(activeFile);
		let content = originalContent;
		const fmMatch = originalContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
		if (fmMatch) {
			content = originalContent.slice(fmMatch[0].length);
		}
		content = content.replace(/^\s*\n/, "");

		const lines = content.split("\n");

		// 7. 提取所有二号标题，生成 TOC
		const h2List = lines
			.map((line) => {
				const match = line.match(/^##\s+(.*)/);
				return match ? match[1].trim() : null;
			})
			.filter(Boolean) as string[];

		const toc = h2List.length
			? h2List.map((item, idx) => `+ [${item}](#c-${idx + 1})`).join("\n")
			: "";

		await this._createAndOpenSlide(newSlideLocation, tocName, toc, false);

		// 8. 生成 BaseLayout 模板
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

		// 9. 处理内容，插入分隔符和 slide 注释
		let headingCount = 0;
		const newLines: string[] = [];
		for (const line of lines) {
			if (/^#{1,6}\s/.test(line)) {
				headingCount++;
				if (headingCount > 1) newLines.push("---");
			}
			newLines.push(line);
		}
		const contentWithPageSeparator = newLines.join("\n");

		// 10. 在二号标题前插入章节 slide 注释
		let h2Index = 0;
		const modifiedLines: string[] = [];
		for (const line of contentWithPageSeparator.split("\n")) {
			if (/^##\s+/.test(line)) {
				h2Index++;
				modifiedLines.push(
					`<!-- slide id="c-${h2Index}" template="[[${t(
						"Chapter"
					)}-${design}]]"  class="order-list-with-border" -->\n`
				);
			}
			modifiedLines.push(line);
		}
		const contentWithSlideInfo = modifiedLines.join("\n");

		// 重新实现：遍历 modifiedContent，提取每个二号标题下的三号标题，并将其以列表形式插入到对应二号标题后面，且三号标题及其内容顺序不变
		const linesForH2H3 = contentWithSlideInfo.split("\n");
		const resultLines: string[] = [];
		let currentH2Index = 0; // 当前二号标题序号
		let h3List: string[] = [];
		let h3TitleList: {
			title: string;
			h2: number;
			h3: number;
			lineIdx: number;
		}[] = [];
		let h3Index = 0;
		let inH2 = false;

		// 第一步：收集每个h2下的h3标题及其行号
		for (let i = 0; i < linesForH2H3.length; i++) {
			const line = linesForH2H3[i];
			if (/^##\s+/.test(line)) {
				currentH2Index++;
				h3Index = 0;
				inH2 = true;
			} else if (/^###\s+/.test(line) && inH2) {
				h3Index++;
				const h3Title = line.replace(/^###\s+/, "").trim();
				h3TitleList.push({
					title: h3Title,
					h2: currentH2Index,
					h3: h3Index,
					lineIdx: i,
				});
			}
		}

		// 第二步：遍历，遇到h2时插入h3目录，紧跟在h2标题后
		currentH2Index = 0;
		let h3TitleIdx = 0;
		for (let i = 0; i < linesForH2H3.length; i++) {
			const line = linesForH2H3[i];
			if (/^##\s+/.test(line)) {
				currentH2Index++;
				resultLines.push(line);
				// 收集属于当前h2的所有h3
				const h3s = [];
				let tempIdx = h3TitleIdx;
				while (
					tempIdx < h3TitleList.length &&
					h3TitleList[tempIdx].h2 === currentH2Index
				) {
					const h3 = h3TitleList[tempIdx];
					h3s.push(`+ [${h3.title}](#c-${h3.h2}-p-${h3.h3})`);
					tempIdx++;
				}
				if (h3s.length > 0) {
					resultLines.push(...h3s);
				}
			} else if (/^###\s+/.test(line)) {
				// 只推进h3TitleIdx，不在此处插入h3目录
				h3TitleIdx++;
				resultLines.push(line);
			} else {
				resultLines.push(line);
			}
		}

		// 第三步：无需再做h3内容插入，因为原始内容顺序未变，只是在h2后插入了h3目录

		const ContentWithChapterLink = resultLines.join("\n");

		// 11. 在三号标题前插入页面 slide 注释
		const linesForH3 = ContentWithChapterLink.split("\n");
		let currentChapterIndex = 0;
		let pageIndexInChapter = 0;
		const finalLines: string[] = [];
		for (const line of linesForH3) {
			if (/^##\s+/.test(line)) {
				currentChapterIndex++;
				pageIndexInChapter = 0;
			}
			if (/^###\s+/.test(line)) {
				pageIndexInChapter++;
				finalLines.push(
					`<!-- slide id="c-${currentChapterIndex}-p-${pageIndexInChapter}" class="chapter-${currentChapterIndex} fancy-list-row" -->\n`
				);
			}
			finalLines.push(line);
		}
		const contentWithPageId = finalLines.join("\n");

		// 12. 在第一个 '---' 前插入 TOC
		const tocEmbed = `---\n\n<!-- slide template="[[${t(
			"TOC"
		)}-${design}]]"  class="order-list-with-border" -->\n\n## ${t(
			"TOC"
		)}\n\n![[${tocName}]]\n`;
		const newContentLines = contentWithPageId.split("\n");
		const tocIndex = newContentLines.findIndex(
			(line) => line.trim() === "---"
		);
		if (tocIndex !== -1) {
			newContentLines.splice(tocIndex, 0, tocEmbed);
		} else {
			newContentLines.unshift(tocEmbed);
		}
		const finalContentWithToc = newContentLines.join("\n");

		// 13. 生成最终 frontmatter 和首页
		const fm = `---
css: dist/Styles/main.css
enableLinks: true
height: 1080
margin: 0
aliases:
 - ${activeFile.basename}
defaultTemplate: "[[${baseLayoutName}]]"
pdfSeparateFragments: false
theme: moon
transition: none
width: 1920
---`;
		const home = `<!-- slide id="home" template="[[${t(
			"Cover"
		)}-${design}]]" -->`;

		const backPage = `---

<!-- slide template="[[${t(
			"BackCover"
		)}-${design}]]" class="order-list-with-border" -->

# ${t("Farewell")}
`;

		const finalContent = `${fm.trim()}\n${home}\n\n${finalContentWithToc}\n${backPage}`;

		// 14. 创建最终幻灯片
		await this._createAndOpenSlide(
			newSlideLocation,
			slideName,
			finalContent
		);
	}
}
