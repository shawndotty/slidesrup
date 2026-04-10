import { ItemView, WorkspaceLeaf, debounce } from "obsidian";
import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
import { css } from "@codemirror/lang-css";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import SlidesRup from "src/main";
import { saveUserCustomCss, subscribeCustomCssChange } from "src/services/custom-css-sync";
import { CUSTOM_STYLE_EDITOR_VIEW_TYPE } from "src/types/custom-style-editor";

export class CustomStyleEditorView extends ItemView {
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

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("slides-rup-custom-style-editor-view");
		this.contentEl.createEl("h2", { text: "Custom Style Editor" });
		this.contentEl.createEl("p", { text: "Input Your Customized CSS" });
		const editorContainer = this.contentEl.createDiv("slides-rup-css-editor");
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
					EditorView.updateListener.of((update) => {
						if (!update.docChanged || this.isApplyingExternalUpdate) {
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
