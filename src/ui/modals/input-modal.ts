import { App, Modal } from "obsidian";
import { t } from "../../lang/helpers";
import { FolderSuggest } from "../pickers/folder-picker";

export class InputModal extends Modal {
	private resolve: (value: string | null) => void;
	private inputEl: HTMLInputElement;
	private folderSearch: boolean;
	private filterPath: string;

	constructor(
		app: App,
		private promptText: string,
		private defaultValue?: string,
		folderSearch: boolean = false,
		filterPath: string = ""
	) {
		super(app);
		this.folderSearch = folderSearch;
		this.filterPath = filterPath;
	}

	onOpen() {
		const { contentEl } = this;

		// 添加模态框容器样式
		contentEl.addClass("slides-rup-input-modal");

		// 创建标题
		contentEl.createEl("h2", {
			text: this.promptText,
			cls: "slides-rup-input-modal-title",
		});

		// 创建输入框容器
		const inputContainer = contentEl.createEl("div", {
			cls: "slides-rup-input-container",
		});

		// 创建输入框
		this.inputEl = inputContainer.createEl("input", {
			type: "text",
			value: this.defaultValue || "",
			cls: "slides-rup-input",
		});

		if (this.folderSearch) {
			new FolderSuggest(this.app, this.inputEl, this.filterPath);
		}

		// 添加键盘事件监听
		this.inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.resolve(this.inputEl.value);
				this.close();
			} else if (e.key === "Escape") {
				e.preventDefault();
				this.resolve(null);
				this.close();
			}
		});

		// 创建按钮容器
		const buttonContainer = contentEl.createEl("div", {
			cls: "slides-rup-button-container",
		});

		// 创建取消按钮
		buttonContainer.createEl(
			"button",
			{
				text: t("Cancel"),
				cls: "slides-rup-button slides-rup-button-cancel",
			},
			(btn) => {
				btn.addEventListener("click", () => {
					this.resolve(null);
					this.close();
				});
			}
		);

		// 创建确认按钮
		buttonContainer.createEl(
			"button",
			{
				text: t("Confirm"),
				cls: "slides-rup-button slides-rup-button-confirm",
			},
			(btn) => {
				btn.addEventListener("click", () => {
					this.resolve(this.inputEl.value);
					this.close();
				});
			}
		);

		// 自动聚焦输入框
		this.inputEl.focus();
	}

	onClose() {
		this.contentEl.empty();
	}

	async openAndGetValue(): Promise<string | null> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
