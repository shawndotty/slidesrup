import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { BaseSuggest } from "./base-suggest";
import { TEMPLATE_PLACE_HOLDERS } from "src/constants";

export class PlaceHoldersSuggest extends BaseSuggest {
	// 预定义的补全建议列表
	private static readonly ITEM_LIST: string[] = Object.values(
		TEMPLATE_PLACE_HOLDERS
	);

	constructor(app: App) {
		super(app, PlaceHoldersSuggest.ITEM_LIST);
	}

	// 确定何时触发建议
	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		const match = line.match(/{{(\w*)$/);

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
		if (this.context) {
			this.context.editor.replaceRange(
				`{{${suggestion}`,
				this.context.start,
				this.context.end
			);
		}
	}
}
