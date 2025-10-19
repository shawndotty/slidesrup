import { App, EditorSuggest, EditorSuggestContext, Editor } from "obsidian";
import { t } from "src/lang/helpers";
import { SRSuggestion } from "src/types";

export abstract class AdvancedSuggest extends EditorSuggest<string> {
	private suggestionItems: SRSuggestion[];

	constructor(app: App, suggestions: SRSuggestion[]) {
		super(app);
		this.suggestionItems = suggestions;
	}

	getSuggestions(
		context: EditorSuggestContext
	): string[] | Promise<string[]> {
		return this.suggestionItems
			.map((item, index) => `${index + 1}. ${item.title}`)
			.filter((suggestion) =>
				suggestion.toLowerCase().includes(context.query.toLowerCase())
			);
	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		const index = parseInt(suggestion.split(".")[0]) - 1;
		const item = this.suggestionItems[index];
		el.createEl("div", { text: suggestion });
		if (item?.description) {
			el.createEl("small", { text: item.description });
		}
	}
}
