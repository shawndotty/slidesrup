// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class FolderSuggest extends TextInputSuggest<TFolder> {
	private filterPath: string;
	constructor(
		app: App,
		inputEl: HTMLInputElement | HTMLTextAreaElement,
		filterPath: string = ""
	) {
		super(app, inputEl);
		this.filterPath = filterPath;
	}

	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		const filterPathLower = this.filterPath.toLowerCase();
		for (const file of abstractFiles) {
			if (
				file instanceof TFolder &&
				(!filterPathLower ||
					(file.path.toLowerCase().includes(filterPathLower) &&
						file.path.toLowerCase() !== filterPathLower)) &&
				file.path.toLowerCase().includes(lowerCaseInputStr)
			) {
				folders.push(file);
			}
		}

		return folders.slice(0, 1000);
	}

	renderSuggestion(file: TFolder, el: HTMLElement): void {
		const prefix = this.filterPath ? `${this.filterPath}/` : "";
		const displayPath = file.path.startsWith(prefix)
			? file.path.slice(prefix.length)
			: file.path;
		el.setText(displayPath);
	}

	selectSuggestion(file: TFolder): void {
		const prefix = this.filterPath ? `${this.filterPath}/` : "";
		this.inputEl.value = file.path.startsWith(prefix)
			? file.path.slice(prefix.length)
			: file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
