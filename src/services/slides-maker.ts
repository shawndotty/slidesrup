import { App, Editor, Notice, TFile, moment } from "obsidian";
import { t } from "../lang/helpers";
import {
	slideChapterTemplate,
	slidePageTemplate,
	slideTemplate,
	baseLayoutWithSteps,
	toc,
	chapterAndPages,
} from "../templates/slide-template";
import { SuggesterOption } from "../suggesters/base-suggester";
import {
	SlideLocationSuggester,
	SlideDesignSuggester,
} from "../suggesters/suggesters";
import { OBASAssistantSettings, ReplaceConfig } from "../types";
import { getTimeStamp, createPathIfNeeded } from "src/utils";
import { InputModal } from "src/ui/modals/input-modal";

export class SlidesMaker {
	private app: App;
	private settings: OBASAssistantSettings;
	private static readonly REPLACE_REGEX = {
		design: /\{\{DESIGN\}\}/g,
		baseLayout: /\{\{BASELAYOUT\}\}/g,
		toc: /\{\{TOC\}\}/g,
		obasPath: /\{\{OBASPATH\}\}/g,
		presenter: /\{\{PRESENTER\}\}/g,
		presentDate: /\{\{PRESENTDATE\}\}/g,
		tagline: /\{\{TAGLINE\}\}/g,
		slogan: /\{\{SLOGAN\}\}/g,
		cIndex: /\{\{cIndex\}\}/g,
		pIndex: /\{\{pIndex\}\}/g,
	};

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
				t("Please input slide name"),
				""
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
			toc,
			true
		);

		await this._createAndOpenSlide(
			newSlideLocation,
			tocName,
			tocTemplate,
			false
		);

		const baseLayoutTemplate = await this.getFinalTemplate(
			this.settings.userBaseLayoutTemplate,
			baseLayoutWithSteps,
			true,
			{
				toc: tocName,
				tagline: this.settings.tagline,
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
			slideTemplate,
			false,
			{
				baseLayout: baseLayoutName,
				toc: tocName,
				presenter: this.settings.presenter,
				presentDate: moment().format(
					this.settings.dateFormat || "YYYY-MM-DD"
				),
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
		return this._finalizeTemplate(template, replaceConfig);
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
		partial: boolean = false,
		replaceConfig: ReplaceConfig
	): Promise<string> {
		let design = "";

		if ("none" === this.settings.defaultDesign) {
			const designOption = await this._selectSlideDesign();
			if (!designOption) {
				new Notice(t("Please select a slide design"));
				return "";
			}
			design = designOption.value;
		} else {
			design = this.settings.defaultDesign.toUpperCase();
		}

		replaceConfig.design = design;

		if (!partial) {
			replaceConfig.obasPath = this.settings.obasFrameworkFolder;
		}

		return this._finalizeTemplate(template, replaceConfig);
	}

	async getFinalTemplate(
		userTemplate: string,
		defaultTemplate: string,
		partial: boolean = false,
		replaceConfig: ReplaceConfig = {}
	) {
		if (userTemplate) {
			return await this.getUserTemplate(userTemplate, replaceConfig);
		} else {
			return await this.getDefaultTemplate(
				defaultTemplate,
				partial,
				replaceConfig
			);
		}
	}

	async addSlideChapter(): Promise<void> {
		let finalTemplate = "";

		const modal = new InputModal(
			this.app,
			t("Please input chapter index number"),
			""
		);

		const cIndex = await modal.openAndGetValue();

		if (!cIndex?.trim()) {
			return;
		}

		if (this.settings.addChapterWithSubPages) {
			finalTemplate = await this.getFinalTemplate(
				this.settings.userChapterAndPagesTemplate,
				chapterAndPages,
				true,
				{
					cIndex: cIndex,
				}
			);
		} else {
			finalTemplate = await this.getFinalTemplate(
				this.settings.userChapterTemplate,
				slideChapterTemplate,
				true,
				{
					cIndex: cIndex,
				}
			);
		}

		await this.addSlidePartial(finalTemplate);
	}

	async addSlidePage(): Promise<void> {
		const finalTemplate = await this.getFinalTemplate(
			slidePageTemplate,
			this.settings.userPageTemplate,
			true
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
