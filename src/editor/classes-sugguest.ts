import {
	App,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	Editor,
} from "obsidian";

export class ClassesSuggest extends EditorSuggest<string> {
	// 预定义的补全建议列表
	private classList: string[] = [
		"box-list",
		"fancy-list",
		"fancy-list-row",
		"fancy-list-with-order",
		"fancy-list-with-order-row",
		"grid-list",
		"grid-step-list",
		"grid-step-list-v",
		"order-list-with-border",
	];

	constructor(app: App) {
		super(app);
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

	// 获取建议列表（根据输入过滤）
	getSuggestions(
		context: EditorSuggestContext
	): string[] | Promise<string[]> {
		return this.classList.filter((classes) =>
			classes.toLowerCase().includes(context.query.toLowerCase())
		);
	}

	// 渲染单个建议项
	renderSuggestion(classes: string, el: HTMLElement): void {
		el.createEl("div", { text: classes });
	}

	// 选择建议后的处理
	selectSuggestion(classes: string): void {
		if (this.context) {
			const { start, end } = this.context;

			// 替换触发符号后的内容
			this.context.editor.replaceRange(
				`${classes} `, // 添加空格使继续输入更自然
				start,
				end
			);
		}
	}
}
