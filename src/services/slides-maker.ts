import { App, Editor, Notice, TFile } from "obsidian";
import { t } from "../lang/helpers";
import {
	slideChapterTemplate,
	slidePageTemplate,
	slideTemplate,
} from "../templates/slide-template";
import { SuggesterOption } from "../suggesters/base-suggester";
import {
	SlideLocationSuggester,
	SlideDesignSuggester,
} from "../suggesters/suggesters";
import { OBASAssistantSettings } from "../types";

export class SlidesMaker {
	private app: App;
	private settings: OBASAssistantSettings;

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

		let design = "";

		if ("none" === this.settings.defaultDesign) {
			const designOption = await this._selectSlideDesign();
			if (!designOption) {
				new Notice(t("Please select a slide design"));
				return;
			}
			design = designOption.value;
		} else {
			design = this.settings.defaultDesign.toUpperCase();
		}

		const fileName = this._generateNewSlideFileName();
		const finalTemplate = this._prepareFinalTemplate(design, fileName);

		await this._createAndOpenSlide(
			newSlideLocation,
			fileName,
			finalTemplate
		);
	}

	async addSlideChapter(): Promise<void> {
		await this.addSlidePartial(slideChapterTemplate);
	}

	async addSlidePage(): Promise<void> {
		await this.addSlidePartial(slidePageTemplate);
	}

	async addSlidePartial(template: string): Promise<void> {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice(
				t("No active editor. Please open a file to add a slide.")
			);
			return;
		}

		let design = "";

		if ("none" === this.settings.defaultDesign) {
			const designOption = await this._selectSlideDesign();
			if (!designOption) {
				new Notice(t("Please select a slide design"));
				return;
			}
			design = designOption.value;
		} else {
			design = this.settings.defaultDesign.toUpperCase();
		}

		const finalTemplate = this._preparePartialTemplate(template, design);
		this._insertAtCursor(editor, finalTemplate + "\n\n");
	}

	private _preparePartialTemplate(
		template: string,
		designValue: string
	): string {
		const finalTemplate = template.replace(/\{\{design\}\}/g, designValue);
		return finalTemplate.trim();
	}

	private _insertAtCursor(editor: Editor, content: string): void {
		const cursor = editor.getCursor();
		console.dir(cursor);
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

	private _generateNewSlideFileName(): string {
		const now = new Date();
		const timestamp = `${now.getFullYear()}-${String(
			now.getMonth() + 1
		).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(
			now.getHours()
		).padStart(2, "0")}-${String(now.getMinutes()).padStart(
			2,
			"0"
		)}-${String(now.getSeconds()).padStart(2, "0")}`;
		return `${t("Untitled Slide")}-${timestamp}`;
	}

	private _prepareFinalTemplate(designValue: string, title: string): string {
		const template = slideTemplate.replace(
			"{{OBASPath}}",
			this.settings.obasFrameworkFolder
		);
		const finalTemplate = template.replace(/\{\{design\}\}/g, designValue);
		return finalTemplate.trim().replace("{{title}}", title);
	}

	private async _createAndOpenSlide(
		location: string,
		fileName: string,
		content: string
	): Promise<void> {
		const filePath =
			location === "/" ? fileName + ".md" : `${location}/${fileName}.md`;

		await this.app.vault.create(filePath, content);

		const newFile = this.app.vault.getAbstractFileByPath(filePath);
		if (newFile instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(newFile);
		}
	}
}
