import { App, Modal, Setting } from "obsidian";
import { t } from "src/lang/helpers";

export class InlineStyleAIModal extends Modal {
	private resolve: (value: string | null) => void = () => {};
	private promptValue = "";
	private resultValue = "";
	private loading = false;
	private statusEl: HTMLElement | null = null;
	private resultTextEl: HTMLTextAreaElement | null = null;

	constructor(
		app: App,
		private onGenerate: (
			prompt: string,
			currentStyle: string,
		) => Promise<string>,
		private currentStyle: string,
		private titleKey = "AI Inline Style Assistant",
		private promptNameKey = "Describe desired style effect",
		private promptDescKey = "Use natural language to describe expected visual effect",
		private promptPlaceholderKey = "Example: make text white, add blur glass background and rounded corners",
		private resultNameKey = "Generated inline style",
		private applyButtonKey = "Apply Generated Style",
		private generatingStatusKey = "Generating inline style...",
		private successStatusKey = "AI inline style generated",
		private errorStatusKey = "Failed to generate inline style",
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("slides-rup-ai-style-modal");
		contentEl.createEl("h2", { text: t(this.titleKey as any) });

		new Setting(contentEl).setName(t(this.promptNameKey as any)).setDesc(
			t(this.promptDescKey as any),
		);
		const promptArea = contentEl.createEl("textarea", {
			cls: "slides-rup-ai-style-input",
		});
		promptArea.placeholder = t(this.promptPlaceholderKey as any);
		promptArea.addEventListener("input", () => {
			this.promptValue = promptArea.value;
		});

		new Setting(contentEl)
			.setName(t(this.resultNameKey as any))
			.setDesc(t("Review before applying to current block" as any));
		this.resultTextEl = contentEl.createEl("textarea", {
			cls: "slides-rup-ai-style-result",
		});
		this.resultTextEl.readOnly = true;

		this.statusEl = contentEl.createDiv("slides-rup-ai-style-status");

		const actions = contentEl.createDiv("slides-rup-ai-style-actions");
		const generateBtn = actions.createEl("button", {
			text: t("Generate with AI" as any),
			cls: "mod-cta",
		});
		const applyBtn = actions.createEl("button", {
			text: t(this.applyButtonKey as any),
		});
		applyBtn.disabled = true;
		const cancelBtn = actions.createEl("button", {
			text: t("Cancel" as any),
		});

		cancelBtn.addEventListener("click", () => {
			this.resolve(null);
			this.close();
		});
		generateBtn.addEventListener("click", async () => {
			if (!this.promptValue.trim() || this.loading) return;
			this.loading = true;
			generateBtn.disabled = true;
			if (this.statusEl) {
				this.statusEl.setText(t(this.generatingStatusKey as any));
			}
			try {
				const css = await this.onGenerate(
					this.promptValue.trim(),
					this.currentStyle,
				);
				this.resultValue = css;
				if (this.resultTextEl) this.resultTextEl.value = css;
				if (this.statusEl) {
					this.statusEl.setText(t(this.successStatusKey as any));
				}
				applyBtn.disabled = !css.trim();
			} catch (error) {
				if (this.statusEl) {
					this.statusEl.setText(
						`${t(this.errorStatusKey as any)}: ${error}`,
					);
				}
				applyBtn.disabled = true;
			} finally {
				this.loading = false;
				generateBtn.disabled = false;
			}
		});
		applyBtn.addEventListener("click", () => {
			this.resolve(this.resultValue);
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
	}

	openAndGetValue(): Promise<string | null> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}
}
