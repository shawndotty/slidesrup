import { App, Editor, Notice, TFile } from "obsidian";
import { t } from "../lang/helpers";
import {
	slideChapterTemplate,
	slidePageTemplate,
	slideTemplate,
	baseLayout,
	baseLayoutWithSteps,
} from "../templates/slide-template";
import { SuggesterOption } from "../suggesters/base-suggester";
import {
	SlideLocationSuggester,
	SlideDesignSuggester,
} from "../suggesters/suggesters";
import { OBASAssistantSettings } from "../types";
import { getTimeStamp } from "src/utils";

export class SlidesMaker {
	private app: App;
	private settings: OBASAssistantSettings;
	private static readonly DESIGN_REGEX = /\{\{design\}\}/g;
	private static readonly BASELAYOUT_REGEX = /\{\{baseLayout\}\}/g;

	constructor(app: App, settings: OBASAssistantSettings) {
		this.app = app;
		this.settings = settings;
	}

	async createSlides(): Promise<void> {
		const newSlideLocation = await this._determineNewSlideLocation();
		if (newSlideLocation === null) {
			new Notice(t("Operation cancelled by user"));
			return;
		}

		const { slideName, baseLayoutName } =
			this._generateNewSlideFilesNames();

		await this._createAndOpenSlide(
			newSlideLocation,
			baseLayoutName,
			baseLayoutWithSteps,
			false
		);

		const finalTemplate = await this.getFinalTemplate(
			this.settings.userSlideTemplate,
			slideTemplate,
			false,
			baseLayoutName
		);

		await this._createAndOpenSlide(
			newSlideLocation,
			slideName,
			finalTemplate
		);
	}

	async getUserTemplate(path: string, defaultBaseLayout: string) {
		let template = "";
		const slideFile = this.app.vault.getAbstractFileByPath(path);
		if (slideFile instanceof TFile) {
			template = await this.app.vault.read(slideFile);
		}
		return template
			.replace(SlidesMaker.BASELAYOUT_REGEX, defaultBaseLayout)
			.trim();
	}

	async getDefaultTemplate(
		template: string,
		partial: boolean = false,
		defaultBaseLayout: string
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

		return partial
			? this._preparePartialTemplate(template, design)
			: this._prepareSlideTemplate(template, design, defaultBaseLayout);
	}

	async getFinalTemplate(
		userTemplate: string,
		defaultTemplate: string,
		partial: boolean = false,
		defaultBaseLayout: string = t("BaseLayout")
	) {
		if (userTemplate) {
			return await this.getUserTemplate(userTemplate, defaultBaseLayout);
		} else {
			return await this.getDefaultTemplate(
				defaultTemplate,
				partial,
				defaultBaseLayout
			);
		}
	}

	async addSlideChapter(): Promise<void> {
		await this.addSlidePartial(
			slideChapterTemplate,
			this.settings.userChapterTemplate
		);
	}

	async addSlidePage(): Promise<void> {
		await this.addSlidePartial(
			slidePageTemplate,
			this.settings.userPageTemplate
		);
	}

	async addSlidePartial(
		defaultTemplate: string,
		userTemplatePath: string
	): Promise<void> {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice(
				t("No active editor. Please open a file to add a slide.")
			);
			return;
		}

		const finalTemplate = await this.getFinalTemplate(
			userTemplatePath,
			defaultTemplate,
			true
		);

		this._insertAtCursor(editor, finalTemplate.trim() + "\n\n");
	}

	private _preparePartialTemplate(
		template: string,
		designValue: string
	): string {
		const finalTemplate = template.replace(
			SlidesMaker.DESIGN_REGEX,
			designValue
		);
		return finalTemplate.trim();
	}

	private _prepareSlideTemplate(
		template: string,
		designValue: string,
		defaultBaseLayout: string
	): string {
		return template
			.replace("{{OBASPath}}", this.settings.obasFrameworkFolder)
			.replace(SlidesMaker.DESIGN_REGEX, designValue)
			.replace(SlidesMaker.BASELAYOUT_REGEX, defaultBaseLayout)
			.trim();
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
	} {
		const timestamp = getTimeStamp();
		return {
			slideName: `${t("Untitled Slide")}-${timestamp}`,
			baseLayoutName: `${t("BaseLayout")}-${timestamp}`,
		};
	}

	private async _createAndOpenSlide(
		location: string,
		fileName: string,
		content: string,
		open: boolean = true
	): Promise<void> {
		const filePath =
			location === "/" ? `${fileName}.md` : `${location}/${fileName}.md`;

		const newFile = await this.app.vault.create(filePath, content);

		if (open && newFile instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(newFile);
		}
	}
}
