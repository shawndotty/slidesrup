import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { AdvancedSuggest } from "./advanced-suggest";
import { t } from "src/lang/helpers";

import { SRSuggestion } from "src/types";

export class CommentsSuggest extends AdvancedSuggest {
	private static readonly ITEMS: SRSuggestion[] = [
		{
			id: "appendClass",
			title: t("commentController.appendClass"),
			suggestionText: " ",
			// description: "Input list or col to append class",
		},
		{
			id: "replaceClass",
			title: t("commentController.replaceClass"),
			suggestionText: "!",
			// description: "Replace class",
		},
		{
			id: "addPageSeparator",
			title: t("commentController.addPageSeparator"),
			suggestionText: "---",
			// description: "Add page separator",
		},
		{
			id: "resetCounter",
			title: t("commentController.resetCounter"),
			suggestionText: "counter-reset-",
			// description: "Reset counter",
		},
		{
			id: "useNoNavTemplate",
			title: t("commentController.useNoNavTemplate"),
			suggestionText: `[[${t("WithoutNav")}]]`,
			// description: "Use no navigation template",
		},
		{
			id: "addNotes",
			title: t("commentController.addNotes"),
			suggestionText: "&",
			// description: "Add notes",
		},
		{
			id: "anchorHeading",
			title: t("commentController.anchorHeading"),
			suggestionText: "@",
			// description: "Anchor heading",
		},
		{
			id: "replaceTemplate",
			title: t("commentController.replaceTemplate"),
			suggestionText: "[[",
			// description: "Replace template",
		},
		{
			id: "addHeadingAliases",
			title: t("commentController.addHeadingAliases"),
			suggestionText: "|",
			// description: "Add heading aliases",
		},
	];

	// Test

	constructor(app: App) {
		super(app, CommentsSuggest.ITEMS);
	}

	// 确定何时触发建议
	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		// const match = line.match(/(?:^|\s)%%(\w*)$/);
		const match = line.match(/%%(\w*)$/);

		if (match) {
			return {
				start: { line: cursor.line, ch: match.index! },
				end: cursor,
				query: match[1],
			};
		}
		return null;
	}

	selectSuggestion(suggestion: string): void {
		const index = parseInt(suggestion.split(".")[0]) - 1;
		const selectedItem = CommentsSuggest.ITEMS[index];

		const id = selectedItem.id;

		const isAddNotes = id === "addNotes";

		const replaceText = !isAddNotes
			? `%%${selectedItem.suggestionText}%%`
			: `%%${selectedItem.suggestionText}\n\n%%`;

		if (this.context) {
			this.context.editor.replaceRange(
				replaceText,
				this.context.start,
				this.context.end
			);
			if (!isAddNotes) {
				this.context.editor.setCursor({
					line: this.context.end.line,
					ch:
						this.context.end.ch +
						(selectedItem.suggestionText?.length ?? 0) -
						this.context.query.length,
				});
			} else {
				this.context.editor.setCursor({
					line: this.context.end.line + 1,
					ch: 0,
				});
			}
		}
	}
}
