import {
	App,
	EditorPosition,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";
import { AdvancedSuggest } from "./advanced-suggest";
import { t } from "src/lang/helpers";

export class CommentsSuggest extends AdvancedSuggest {
	// 预定义的补全建议列表
	private static readonly ITEM_LIST: string[] = [
		"1. " + t("commentController.appendClass"),
		"2. " + t("commentController.addPageSeparator"),
		"3. " + t("commentController.resetCounter"),
		"4. " + t("commentController.useNoNavTemplate"),
		"5. ! - " + t("commentController.replaceClass"),
		"6. @ - " + t("commentController.anchorHeading"),
		"7. & - " + t("commentController.addNotes"),
		"8. [[ - " + t("commentController.replaceTemplate"),
		"9. | - " + t("commentController.addHeadingAliases"),
	];

	// Test

	constructor(app: App) {
		super(app, CommentsSuggest.makeCommentList());
	}

	static makeCommentList() {
		// 合并用户自定义的类和预定义类，去除空字符串和重复项
		const combined = Array.from(new Set([...CommentsSuggest.ITEM_LIST]));
		return combined;
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
}
