import { App, EditorSuggest, EditorSuggestContext, Editor } from "obsidian";

export abstract class BaseSuggest extends EditorSuggest<string> {
	private suggestionItems: string[];

	constructor(app: App, suggestions: string[]) {
		super(app);
		this.suggestionItems = suggestions;
	}

	getSuggestions(
		context: EditorSuggestContext
	): string[] | Promise<string[]> {
		return this.suggestionItems.filter((suggestion) =>
			suggestion.toLowerCase().includes(context.query.toLowerCase())
		);
	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.createEl("div", { text: suggestion });
	}

	selectSuggestion(suggestion: string): void {
		if (this.context) {
			this.context.editor.replaceRange(
				`${suggestion} `,
				this.context.start,
				this.context.end
			);
		}
	}
}
