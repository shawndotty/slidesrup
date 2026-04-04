import { App, Notice, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import { t } from "../lang/helpers";
import { SlidesRupSettings } from "src/types";
import { SuggesterOption } from "../suggesters/base-suggester";
import { InputModal } from "src/ui/modals/input-modal";
import {
	createPathIfNeeded,
	getUserDesigns,
	getAllDesignsOptions,
} from "src/utils";
import { DEFAULT_DESIGNS, REVEAL_USER_DESIGN_FOLDER } from "src/constants";
import {
	DesignMakerModeSuggester,
	SlideDesignSuggester,
} from "../suggesters/suggesters";
import { VSCodeService } from "./vscode-service";
import {
	DESIGN_MAKER_VIEW_TYPE,
	DesignDraft,
	DesignPageDraft,
	DesignPageType,
} from "src/types/design-maker";
import {
	DESIGN_PAGE_DEFINITIONS,
	getDesignPageFileName,
	getDesignThemeFileName,
	inferDesignNameFromPath,
	normalizeDesignName,
} from "./design-maker-schema";
import { parseDesignPageDraft, parseThemeDraft } from "./design-maker-parser";
import {
	generatePageMarkdown,
	generateThemeCss,
} from "./design-maker-generator";

export class DesignMaker {
	private app: App;
	private settings: SlidesRupSettings;
	private static readonly MY_DESIGN_FOLDER = REVEAL_USER_DESIGN_FOLDER;
	private defaultDesigns: typeof DEFAULT_DESIGNS = DEFAULT_DESIGNS;
	private userDesignPath: string = "";
	private userDesigns: Array<string> = [];
	private designOptions: Array<SuggesterOption> = [];
	private vscodeService: VSCodeService;
	private plugin: any;

	constructor(app: App, settings: SlidesRupSettings, plugin?: any) {
		this.app = app;
		this.settings = settings;
		this.plugin = plugin;
		this.userDesignPath = `${this.settings.slidesRupFrameworkFolder}/${DesignMaker.MY_DESIGN_FOLDER}`;
		this.vscodeService = new VSCodeService(this.app, this.settings);
	}

	async makeNewBlankDesign() {
		const designName = normalizeDesignName(await this._getDesignName());
		if (!designName) return;
		const newDesignFolderName = `Design-${designName}`;
		const newDesignPath = `${this.userDesignPath}/${newDesignFolderName}`;
		if (await this.app.vault.adapter.exists(newDesignPath)) {
			new Notice(t("Design already exists"));
			return;
		}

		await createPathIfNeeded(this.app, newDesignPath);
		await Promise.all(
			DESIGN_PAGE_DEFINITIONS.map(async (page) => {
				const filePath = `${newDesignPath}/${page.getFileName(designName)}`;
				await this.app.vault.create(
					filePath,
					this._getDefaultPageContent(page.type),
				);
			}),
		);
		const marpThemePath = `${this.settings.slidesRupFrameworkFolder}/MarpThemes/${getDesignThemeFileName(
			designName,
		)}`;
		await this._writeOrCreateFile(
			marpThemePath,
			generateThemeCss(parseThemeDraft(designName, ""), designName),
		);
		await this.vscodeService.addNewMarpThemeForVSCode(
			designName.toLowerCase(),
		);
		await this._revealNewDesign(newDesignPath);
	}

	async makeNewDesignFromCurrentDesign() {
		this.designOptions = this.getDesignOptions();
		const design = await this._selectSlideDesign(this.designOptions);
		if (!design) return;
		const newDesignName = normalizeDesignName(await this._getDesignName());
		if (!newDesignName) return;
		const newDesignPath = await this.cloneDesignFromSource(
			design.value,
			newDesignName,
		);
		if (newDesignPath) await this._revealNewDesign(newDesignPath);
	}

	async openDesignMaker(existingLeaf?: WorkspaceLeaf): Promise<void> {
		if (!this.settings.enableDesignMaker) {
			new Notice(t("Enable Design Maker"));
			return;
		}
		const mode = await this._selectDesignMakerMode();
		if (!mode) return;
		if (mode.value === "load") {
			await this._openExistingDesignInMaker(existingLeaf);
			return;
		}
		await this._createAndOpenDesignInMaker(existingLeaf);
	}

	private async _createAndOpenDesignInMaker(
		existingLeaf?: WorkspaceLeaf,
	): Promise<void> {
		const options = this.getDesignOptions();
		const sourceDesign = await this._selectSlideDesign(options);
		if (!sourceDesign) return;
		const defaultName = `${sourceDesign.value}-Copy`;
		const designName = normalizeDesignName(
			await this._getDesignName(defaultName),
		);
		if (!designName) return;
		const designPath = await this.cloneDesignFromSource(
			sourceDesign.value,
			designName,
		);
		if (!designPath) return;
		await this._openDesignMakerLeaf(designPath, designName, existingLeaf);
	}

	private async _openExistingDesignInMaker(
		existingLeaf?: WorkspaceLeaf,
	): Promise<void> {
		const userDesignOptions = this.getUserDesignOptions();
		if (userDesignOptions.length === 0) {
			new Notice(t("No existing user designs found"));
			return;
		}
		const design = await this._selectSlideDesign(userDesignOptions);
		if (!design) return;
		const designPath = `${this.userDesignPath}/Design-${design.value}`;
		const folder = this.app.vault.getAbstractFileByPath(designPath);
		if (!(folder instanceof TFolder)) {
			new Notice(`${t("Cann't find the source folder")}${designPath}`);
			return;
		}
		await this._openDesignMakerLeaf(designPath, design.value, existingLeaf);
	}

	private async _openDesignMakerLeaf(
		designPath: string,
		designName: string,
		existingLeaf?: WorkspaceLeaf,
	): Promise<void> {
		if (!this.plugin) {
			await this._revealNewDesign(designPath);
			return;
		}
		const leaf = existingLeaf || this.app.workspace.getLeaf("tab");
		await leaf.setViewState({
			type: DESIGN_MAKER_VIEW_TYPE,
			active: true,
			state: {
				designPath,
				designName,
			},
		});
		if (!existingLeaf) {
			this.app.workspace.revealLeaf(leaf);
		}
	}

	getDesignOptions(): Array<SuggesterOption> {
		this.userDesigns = getUserDesigns(
			this.app,
			this.settings.slidesRupFrameworkFolder,
		);
		return getAllDesignsOptions(this.defaultDesigns, this.userDesigns);
	}

	getUserDesignOptions(): Array<SuggesterOption> {
		this.userDesigns = getUserDesigns(
			this.app,
			this.settings.slidesRupFrameworkFolder,
		);
		return this.userDesigns.map((design, index) => ({
			id: `user-design-${design}`,
			name: `${index + 1}. ${t("Slide Design")} ${design}`,
			value: design,
		}));
	}

	async cloneDesignFromSource(
		sourceDesignName: string,
		newDesignName: string,
	): Promise<string | null> {
		const originalDesignPath = this._getDesignSourcePath(sourceDesignName);
		const originalFolder =
			this.app.vault.getAbstractFileByPath(originalDesignPath);
		if (!originalFolder || !(originalFolder instanceof TFolder)) {
			new Notice(
				`${t("Cann't find the source folder")}${originalDesignPath}`,
			);
			return null;
		}
		const newDesignPath = `${this.userDesignPath}/Design-${newDesignName}`;
		if (await this.app.vault.adapter.exists(newDesignPath)) {
			new Notice(t("Design already exists"));
			return null;
		}
		await createPathIfNeeded(this.app, newDesignPath);
		const filesToCopy = originalFolder.children.filter(
			(file) => file instanceof TFile,
		) as TFile[];
		for (const file of filesToCopy) {
			await this._copyDesignFile(
				file,
				sourceDesignName,
				newDesignName,
				newDesignPath,
			);
		}
		await this._copyDesignTheme(sourceDesignName, newDesignName);
		return newDesignPath;
	}

	async loadDesignDraft(designPath: string): Promise<DesignDraft> {
		const designName = inferDesignNameFromPath(designPath);
		const pages = {} as Record<DesignPageType, DesignPageDraft>;
		for (const definition of DESIGN_PAGE_DEFINITIONS) {
			const fileName = getDesignPageFileName(definition.type, designName);
			const filePath = `${designPath}/${fileName}`;
			const markdown = await this._readFileIfExists(
				filePath,
				this._getDefaultPageContent(definition.type),
			);
			pages[definition.type] = parseDesignPageDraft(
				definition.type,
				designName,
				filePath,
				markdown,
			);
		}
		const cssContent = await this._readFileIfExists(
			`${this.settings.slidesRupFrameworkFolder}/MarpThemes/${getDesignThemeFileName(
				designName,
			)}`,
			"",
		);
		return {
			designName,
			designPath,
			sourceDesignName: designName,
			pages,
			theme: parseThemeDraft(designName, cssContent),
		};
	}

	async saveDesignDraft(draft: DesignDraft): Promise<void> {
		for (const definition of DESIGN_PAGE_DEFINITIONS) {
			const page = draft.pages[definition.type];
			page.rawMarkdown = generatePageMarkdown(page);
			await this._writeOrCreateFile(page.filePath, page.rawMarkdown);
		}
		const themePath = `${this.settings.slidesRupFrameworkFolder}/MarpThemes/${getDesignThemeFileName(
			draft.designName,
		)}`;
		await this._writeOrCreateFile(
			themePath,
			generateThemeCss(draft.theme, draft.designName),
		);
		if (this.settings.designMakerSyncVsCodeThemeOnSave) {
			await this.vscodeService.addNewMarpThemeForVSCode(
				draft.designName.toLowerCase(),
			);
		}
		new Notice(t("Design Maker saved"));
	}

	reparsePage(
		designName: string,
		pageType: DesignPageType,
		filePath: string,
		rawMarkdown: string,
	): DesignPageDraft {
		return parseDesignPageDraft(
			pageType,
			designName,
			filePath,
			rawMarkdown,
		);
	}

	private async _revealNewDesign(path: string) {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (folder && folder instanceof TFolder) {
			const fileExplorerLeaves =
				this.app.workspace.getLeavesOfType("file-explorer");
			if (fileExplorerLeaves.length === 0) {
				const leaf = this.app.workspace.getLeaf("tab");
				await leaf.setViewState({ type: "file-explorer" });
				fileExplorerLeaves.push(leaf);
			}
			const fileExplorerView = fileExplorerLeaves[0].view as any;
			this.app.workspace.revealLeaf(fileExplorerLeaves[0]);
			fileExplorerView.revealInFolder(folder);
		}
	}

	private async _getDesignName(defaultValue: string = ""): Promise<string> {
		const modal = new InputModal(
			this.app,
			t("Please input your design name"),
			defaultValue,
		);
		return (await modal.openAndGetValue()) || "";
	}

	private _getDefaultPageContent(pageType: DesignPageType): string {
		if (pageType === "content" || pageType === "contentWithoutNav") {
			return `<grid drag="100 80" drop="0 10" class="content" align="topleft" pad="40px">\n<% content %>\n</grid>`;
		}
		if (pageType === "cover") {
			return `<grid drag="100 100" drop="0 0" class="bg-with-front-color" align="left" pad="120px">\n<% content %>\n</grid>`;
		}
		return `<grid drag="100 100" drop="0 0" class="bg-with-front-color" align="left" pad="80px">\n<% content %>\n</grid>`;
	}

	private _getDesignSourcePath(designName: string): string {
		const folderName = this.defaultDesigns.includes(designName)
			? "Designs"
			: DesignMaker.MY_DESIGN_FOLDER;
		return `${this.settings.slidesRupFrameworkFolder}/${folderName}/Design-${designName}`;
	}

	private async _copyDesignFile(
		file: TFile,
		sourceDesignName: string,
		newDesignName: string,
		newDesignPath: string,
	): Promise<void> {
		const originalFileName = file.name;
		const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(
			originalFileName,
		);
		const newFileName = originalFileName.replace(
			new RegExp(sourceDesignName, "g"),
			newDesignName,
		);
		const newFilePath = `${newDesignPath}/${newFileName}`;
		if (isImage) {
			await this.app.vault.adapter.copy(file.path, newFilePath);
			return;
		}
		const content = await this.app.vault.read(file);
		const nextContent = content
			.split(`-${sourceDesignName}`)
			.join(`-${newDesignName}`)
			.split(`sr-design-${sourceDesignName.toLowerCase()}`)
			.join(`sr-design-${newDesignName.toLowerCase()}`);
		await this._writeOrCreateFile(newFilePath, nextContent);
	}

	private async _copyDesignTheme(
		sourceDesignName: string,
		newDesignName: string,
	): Promise<void> {
		const originalThemePath = `${this.settings.slidesRupFrameworkFolder}/MarpThemes/${getDesignThemeFileName(
			sourceDesignName,
		)}`;
		const newThemePath = `${this.settings.slidesRupFrameworkFolder}/MarpThemes/${getDesignThemeFileName(
			newDesignName,
		)}`;
		if (await this.app.vault.adapter.exists(originalThemePath)) {
			const themeContent =
				await this.app.vault.adapter.read(originalThemePath);
			const updatedThemeContent = themeContent
				.replace(
					new RegExp(
						`sr-design-${sourceDesignName.toLowerCase()}`,
						"g",
					),
					`sr-design-${newDesignName.toLowerCase()}`,
				)
				.replace(
					new RegExp(`-${sourceDesignName.toUpperCase()}`, "g"),
					`-${newDesignName.toUpperCase()}`,
				);
			await this._writeOrCreateFile(newThemePath, updatedThemeContent);
		} else {
			await this._writeOrCreateFile(
				newThemePath,
				generateThemeCss(
					parseThemeDraft(newDesignName, ""),
					newDesignName,
				),
			);
		}
		await this.vscodeService.addNewMarpThemeForVSCode(
			newDesignName.toLowerCase(),
		);
	}

	private async _readFileIfExists(
		filePath: string,
		fallback: string,
	): Promise<string> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			return this.app.vault.read(file);
		}
		return fallback;
	}

	private async _writeOrCreateFile(
		filePath: string,
		content: string,
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
			return;
		}
		const folderPath = filePath.split("/").slice(0, -1).join("/");
		await createPathIfNeeded(this.app, folderPath);
		await this.app.vault.create(filePath, content);
	}

	private async _selectSlideDesign(
		options: SuggesterOption[],
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

	private async _selectDesignMakerMode(): Promise<SuggesterOption | null> {
		const suggester = new DesignMakerModeSuggester(this.app);
		return new Promise((resolve) => {
			suggester.onChooseItem = (item: SuggesterOption) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});
	}
}
