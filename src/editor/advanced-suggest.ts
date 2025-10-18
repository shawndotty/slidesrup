import { App, EditorSuggest, EditorSuggestContext, Editor } from "obsidian";
import { t } from "src/lang/helpers";
export abstract class AdvancedSuggest extends EditorSuggest<string> {
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
		let suggestionText = "";
		switch (suggestion) {
			case t("commentController.appendClass"):
				suggestionText = " ";
				break;
			case t("commentController.addPageSeparator"):
				suggestionText = "---";
				break;
			case t("commentController.resetCounter"):
				suggestionText = "counter-reset-";
				break;
			default:
				suggestionText = suggestion.split(" - ")[0];
				break;
		}
		if (this.context) {
			this.context.editor.replaceRange(
				`%%${suggestionText}%%`,
				this.context.start,
				this.context.end
			);
			this.context.editor.setCursor({
				line: this.context.end.line,
				ch: this.context.end.ch + suggestionText.length,
			});
		}
	}
}
