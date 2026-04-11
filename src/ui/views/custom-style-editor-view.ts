import { ItemView, WorkspaceLeaf, debounce } from "obsidian";
import { basicSetup } from "@codemirror/basic-setup";
import { css } from "@codemirror/lang-css";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import SlidesRup from "src/main";
import {
	saveUserCustomCss,
	subscribeCustomCssChange,
} from "src/services/custom-css-sync";
import { CUSTOM_STYLE_EDITOR_VIEW_TYPE } from "src/types/custom-style-editor";

export class CustomStyleEditorView extends ItemView {
	private readonly indentUnit = "  ";
	private readonly lineCommentPrefix = "/* ";
	private readonly lineCommentSuffix = " */";
	private plugin: SlidesRup;
	private editorView: EditorView | null = null;
	private isApplyingExternalUpdate = false;
	private unsubscribeCustomCssChange: (() => void) | null = null;
	private readonly saveCssSetting = debounce(
		async (newCss: string) => {
			await saveUserCustomCss(this.plugin, newCss);
		},
		500,
		true,
	);

	constructor(leaf: WorkspaceLeaf, plugin: SlidesRup) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return CUSTOM_STYLE_EDITOR_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Custom Style Editor";
	}

	getIcon(): string {
		return "braces";
	}

	private handleIndentKeyDown(
		event: KeyboardEvent,
		view: EditorView,
	): boolean {
		const isModKey = event.metaKey || event.ctrlKey;
		const isSlashByShiftedDigit =
			event.shiftKey &&
			(event.code === "Digit7" ||
				event.code === "Digit8" ||
				event.code === "IntlRo");
		const isSlashLikeKey =
			event.key === "/" ||
			event.key === "?" ||
			event.code === "Slash" ||
			event.code === "NumpadDivide" ||
			isSlashByShiftedDigit;
		if (isModKey && isSlashLikeKey) {
			event.preventDefault();
			event.stopPropagation();
			return this.handleToggleComment(view);
		}

		if (event.key !== "Tab") {
			return false;
		}
		event.preventDefault();
		const { state } = view;
		const changedLineStarts = new Set<number>();
		const changes: { from: number; to?: number; insert: string }[] = [];

		for (const range of state.selection.ranges) {
			if (event.shiftKey) {
				const startLine = state.doc.lineAt(range.from).number;
				const endBasePos =
					range.empty || range.to === range.from
						? range.to
						: range.to - 1;
				const endLine = state.doc.lineAt(endBasePos).number;
				for (
					let lineNumber = startLine;
					lineNumber <= endLine;
					lineNumber++
				) {
					const line = state.doc.line(lineNumber);
					if (changedLineStarts.has(line.from)) {
						continue;
					}
					if (line.text.startsWith(this.indentUnit)) {
						changes.push({
							from: line.from,
							to: line.from + this.indentUnit.length,
							insert: "",
						});
						changedLineStarts.add(line.from);
					} else if (line.text.startsWith("\t")) {
						changes.push({
							from: line.from,
							to: line.from + 1,
							insert: "",
						});
						changedLineStarts.add(line.from);
					}
				}
				continue;
			}

			if (range.empty) {
				changes.push({ from: range.from, insert: this.indentUnit });
				continue;
			}

			const startLine = state.doc.lineAt(range.from).number;
			const endLine = state.doc.lineAt(range.to - 1).number;
			for (
				let lineNumber = startLine;
				lineNumber <= endLine;
				lineNumber++
			) {
				const line = state.doc.line(lineNumber);
				if (changedLineStarts.has(line.from)) {
					continue;
				}
				changes.push({ from: line.from, insert: this.indentUnit });
				changedLineStarts.add(line.from);
			}
		}

		if (changes.length > 0) {
			if (
				!event.shiftKey &&
				state.selection.ranges.every((range) => range.empty)
			) {
				const changeSet = state.changes(changes);
				const nextRanges = state.selection.ranges.map((range) =>
					EditorSelection.cursor(changeSet.mapPos(range.from, 1)),
				);
				view.dispatch({
					changes: changeSet,
					selection: EditorSelection.create(nextRanges),
				});
				return true;
			}
			view.dispatch({ changes });
		}
		return true;
	}

	private handleToggleComment(view: EditorView): boolean {
		const { state } = view;
		const lineNumbers: number[] = [];
		const lineSet = new Set<number>();
		const changes: { from: number; to?: number; insert: string }[] = [];

		for (const range of state.selection.ranges) {
			const startLine = state.doc.lineAt(range.from).number;
			const endPos = range.empty
				? range.to
				: Math.max(range.to - 1, range.from);
			const endLine = state.doc.lineAt(endPos).number;
			for (
				let lineNumber = startLine;
				lineNumber <= endLine;
				lineNumber++
			) {
				if (lineSet.has(lineNumber)) {
					continue;
				}
				lineSet.add(lineNumber);
				lineNumbers.push(lineNumber);
			}
		}

		const canUncomment = lineNumbers.every((lineNumber) => {
			const text = state.doc.line(lineNumber).text;
			const trimmedStart = text.trimStart();
			const trimmedEnd = text.trimEnd();
			return trimmedStart.startsWith("/*") && trimmedEnd.endsWith("*/");
		});

		for (const lineNumber of lineNumbers) {
			const line = state.doc.line(lineNumber);
			const text = line.text;

			if (canUncomment) {
				const prefixIndex = text.indexOf("/*");
				const suffixIndex = text.lastIndexOf("*/");
				if (
					prefixIndex < 0 ||
					suffixIndex < 0 ||
					suffixIndex <= prefixIndex
				) {
					continue;
				}

				const prefixLength = text.startsWith(
					this.lineCommentPrefix,
					prefixIndex,
				)
					? this.lineCommentPrefix.length
					: 2;
				const suffixWithSpaceStart =
					suffixIndex > 0 && text[suffixIndex - 1] === " "
						? suffixIndex - 1
						: suffixIndex;
				const suffixLength = text.startsWith(
					this.lineCommentSuffix,
					suffixWithSpaceStart,
				)
					? this.lineCommentSuffix.length
					: 2;

				changes.push({
					from: line.from + suffixWithSpaceStart,
					to: line.from + suffixWithSpaceStart + suffixLength,
					insert: "",
				});
				changes.push({
					from: line.from + prefixIndex,
					to: line.from + prefixIndex + prefixLength,
					insert: "",
				});
				continue;
			}

			const indentLength = text.length - text.trimStart().length;
			changes.push({
				from: line.from + indentLength,
				insert: this.lineCommentPrefix,
			});
			changes.push({
				from: line.to,
				insert: this.lineCommentSuffix,
			});
		}

		if (changes.length > 0) {
			view.dispatch({ changes });
		}
		return true;
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("slides-rup-custom-style-editor-view");
		this.contentEl.createEl("h2", { text: "Custom Style Editor" });
		this.contentEl.createEl("p", { text: "Input Your Customized CSS" });
		const editorContainer = this.contentEl.createDiv(
			"slides-rup-css-editor",
		);
		this.editorView = new EditorView({
			state: EditorState.create({
				doc: this.plugin.settings.customCss || "",
				extensions: [
					basicSetup,
					css(),
					autocompletion(),
					...(document.body.classList.contains("theme-dark")
						? [oneDark]
						: []),
					EditorView.domEventHandlers({
						keydown: (event, view) =>
							this.handleIndentKeyDown(event, view),
					}),
					EditorView.updateListener.of((update) => {
						if (
							!update.docChanged ||
							this.isApplyingExternalUpdate
						) {
							return;
						}
						const newCss = update.state.doc.toString();
						void this.saveCssSetting(newCss);
					}),
				],
			}),
			parent: editorContainer,
		});
		this.unsubscribeCustomCssChange = subscribeCustomCssChange((value) => {
			if (!this.editorView) {
				return;
			}
			const currentValue = this.editorView.state.doc.toString();
			if (value === currentValue) {
				return;
			}
			this.isApplyingExternalUpdate = true;
			this.editorView.dispatch({
				changes: {
					from: 0,
					to: this.editorView.state.doc.length,
					insert: value,
				},
			});
			this.isApplyingExternalUpdate = false;
		});
	}

	async onClose(): Promise<void> {
		this.unsubscribeCustomCssChange?.();
		this.unsubscribeCustomCssChange = null;
		this.editorView?.destroy();
		this.editorView = null;
	}
}
