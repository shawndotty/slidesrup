import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { BaseSuggest } from "./base-suggest";
import { SLIDESRUP_COLUMN_CLASSES } from "src/constants";

export class ColumnsSuggest extends BaseSuggest {
	// 预定义的补全建议列表
	private static readonly ITEM_LIST: string[] = SLIDESRUP_COLUMN_CLASSES;

	constructor(app: App) {
		super(app, ColumnsSuggest.ITEM_LIST);
	}

	// 确定何时触发建议
	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		const match = line.match(/col(\w*)$/);

		if (match) {
			return {
				start: { line: cursor.line, ch: match.index! },
				end: cursor,
				query: match[1],
			};
		}
		return null;
	}
}
