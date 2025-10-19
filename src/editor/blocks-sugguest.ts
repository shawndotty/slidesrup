import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { AdvancedSuggest } from "./advanced-suggest";
import { t } from "src/lang/helpers";

import { SRSuggestion } from "src/types";

export class BlocksSuggest extends AdvancedSuggest {
	private static readonly ITEMS: SRSuggestion[] = [
		{
			id: "block",
			title: t("blockController.block"),
			suggestionText: "block",
			// description: "Input list or col to append class",
		},
		{
			id: "leftBlock",
			title: t("blockController.leftBlock"),
			suggestionText: "lblock",
			// description: "Replace class",
		},
		{
			id: "centerBlock",
			title: t("blockController.centerBlock"),
			suggestionText: "cblock",
			// description: "Add page separator",
		},
		{
			id: "rightBlock",
			title: t("blockController.rightBlock"),
			suggestionText: "rblock",
			// description: "Reset counter",
		},
	];

	// Test

	constructor(app: App) {
		super(app, BlocksSuggest.ITEMS);
	}

	// 确定何时触发建议
	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		// const match = line.match(/(?:^|\s)%%(\w*)$/);
		const match = line.match(/[:：]{3}(\w*)$/);

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
		const selectedItem = BlocksSuggest.ITEMS[index];

		const replaceText = `::: ${selectedItem.suggestionText}\n\n:::`;

		if (this.context) {
			this.context.editor.replaceRange(
				replaceText,
				this.context.start,
				this.context.end
			);
			this.context.editor.setCursor({
				line: this.context.end.line + 1,
				ch: 0,
			});
		}
	}
}
