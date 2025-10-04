import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { SlidesRupSettings } from "src/types";
import { BaseSuggest } from "./base-suggest";
import { SLIDESRUP_LIST_CLASSES } from "src/constants";

export class ClassesSuggest extends BaseSuggest {
	// 预定义的补全建议列表
	private static readonly ITEM_LIST: string[] = SLIDESRUP_LIST_CLASSES;

	constructor(app: App, settings: SlidesRupSettings) {
		super(app, ClassesSuggest.makeClassList(settings));
	}

	static makeClassList(settings: SlidesRupSettings) {
		const userListClasses = settings.userAddedListClasses.split("\n");
		// 合并用户自定义的类和预定义类，去除空字符串和重复项
		const combined = Array.from(
			new Set([
				...userListClasses.map((c) => c.trim()).filter((c) => c),
				...ClassesSuggest.ITEM_LIST,
			])
		);
		return combined;
	}

	// 确定何时触发建议
	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).slice(0, cursor.ch);
		const match = line.match(/list(\w*)$/);

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
