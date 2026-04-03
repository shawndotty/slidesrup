import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { t } from "src/lang/helpers";
import { generatePageMarkdown } from "src/services/design-maker-generator";
import { DesignMaker } from "src/services/design-maker";
import {
	DESIGN_MAKER_VIEW_TYPE,
	DesignDraft,
	DesignGridBlock,
	DesignMakerViewState,
	DesignPageType,
} from "src/types/design-maker";
import { renderDesignPageList } from "../components/design-page-list";
import { renderDesignThemePanel } from "../components/design-theme-panel";
import { renderDesignPreview } from "../components/design-preview";
import { renderDesignInspector } from "../components/design-inspector";
import { renderDesignCanvas } from "../components/design-canvas";

export class DesignMakerView extends ItemView {
	private plugin: any;
	private designMaker: DesignMaker;
	private designState: DesignMakerViewState | null = null;
	private draft: DesignDraft | null = null;
	private activePageType: DesignPageType = "cover";
	private selectedBlockId: string | null = null;
	private pageListEl: HTMLElement | null = null;
	private canvasEl: HTMLElement | null = null;
	private inspectorEl: HTMLElement | null = null;
	private themeEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private pageSourceEl: HTMLElement | null = null;
	private cssSourceEl: HTMLElement | null = null;
	private pageSourceValue = "";
	private cssSourceValue = "";

	constructor(leaf: WorkspaceLeaf, plugin: any) {
		super(leaf);
		this.plugin = plugin;
		this.designMaker = new DesignMaker(this.app, plugin.settings, plugin);
	}

	getViewType(): string {
		return DESIGN_MAKER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("Design Maker");
	}

	getIcon(): string {
		return "layout-dashboard";
	}

	async onOpen(): Promise<void> {
		this._ensureLayout();
		this._render();
	}

	async setState(
		state: DesignMakerViewState,
		result: any,
	): Promise<void> {
		this.designState = state;
		await this._loadDraft();
		await super.setState(state, result);
	}

	getState(): Record<string, unknown> {
		return (
			this.designState || {
				designName: "",
				designPath: "",
			}
		);
	}

	private async _loadDraft(): Promise<void> {
		if (!this.designState?.designPath) return;
		this.draft = await this.designMaker.loadDesignDraft(
			this.designState.designPath,
		);
		this.activePageType = "cover";
		this.selectedBlockId = null;
		this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
		this.cssSourceValue = this.draft.theme.rawCss || "";
		this._render();
	}

	private _ensureLayout(): void {
		if (this.pageListEl) return;
		this.contentEl.empty();
		this.contentEl.addClass("slides-rup-design-maker-view");

		const header = this.contentEl.createDiv("slides-rup-design-maker-header");
		const title = header.createEl("h2", { text: t("Design Maker") });
		title.addClass("slides-rup-design-maker-title");

		const actions = header.createDiv("slides-rup-design-maker-header-actions");
		const saveButton = actions.createEl("button", {
			text: t("Save and Apply"),
		});
		saveButton.addEventListener("click", async () => {
			if (!this.draft) return;
			this.draft.theme.rawCss = this.cssSourceValue;
			await this.designMaker.saveDesignDraft(this.draft);
			await this._loadDraft();
		});

		const reloadButton = actions.createEl("button", {
			text: t("Reload Design"),
		});
		reloadButton.addEventListener("click", async () => {
			await this._loadDraft();
		});

		const layout = this.contentEl.createDiv("slides-rup-design-maker-layout");
		this.pageListEl = layout.createDiv("slides-rup-design-maker-sidebar");
		const center = layout.createDiv("slides-rup-design-maker-main");
		this.canvasEl = center.createDiv("slides-rup-design-maker-canvas-panel");
		const right = layout.createDiv("slides-rup-design-maker-sidepanel");
		this.inspectorEl = right.createDiv("slides-rup-design-maker-panel");
		this.themeEl = right.createDiv("slides-rup-design-maker-panel");
		this.previewEl = right.createDiv("slides-rup-design-maker-panel");
		this.pageSourceEl = right.createDiv("slides-rup-design-maker-panel");
		this.cssSourceEl = right.createDiv("slides-rup-design-maker-panel");
	}

	private _render(): void {
		this._ensureLayout();
		if (!this.pageListEl || !this.canvasEl || !this.inspectorEl) return;
		if (!this.draft) {
			this.contentEl.empty();
			this.contentEl.createEl("p", {
				text: t("No design loaded"),
			});
			return;
		}

		renderDesignPageList({
			container: this.pageListEl,
			draft: this.draft,
			activePageType: this.activePageType,
			onSelect: (pageType) => {
				this.activePageType = pageType;
				this.selectedBlockId = null;
				this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
				this._render();
			},
		});

		renderDesignCanvas({
			container: this.canvasEl,
			page: this._getCurrentPage(),
			selectedBlockId: this.selectedBlockId,
			onSelect: (blockId) => {
				this.selectedBlockId = blockId;
				this._renderRightPanel();
			},
			onPatchBlock: (blockId, patcher) => {
				this._patchBlockById(blockId, patcher);
				this._renderCanvasAndPreview();
			},
			onAddBlock: (block) => {
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onDeleteBlock: (blockId) => {
				const page = this._getCurrentPage();
				page.blocks = page.blocks.filter((block) => block.id !== blockId);
				if (this.selectedBlockId === blockId) this.selectedBlockId = null;
				this._syncPageSource();
				this._render();
			},
			onDuplicateBlock: (blockId) => {
				const target = this._getCurrentPage().blocks.find(
					(block) => block.id === blockId && block.type === "grid",
				);
				if (!target || target.type !== "grid") return;
				const nextBlock: DesignGridBlock = {
					...target,
					id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
					rect: {
						...target.rect,
						x: Math.min(100 - target.rect.width, target.rect.x + 4),
						y: Math.min(100 - target.rect.height, target.rect.y + 4),
					},
				};
				this._getCurrentPage().blocks.push(nextBlock);
				this.selectedBlockId = nextBlock.id;
				this._syncPageSource();
				this._render();
			},
		});

		this._renderRightPanel();
	}

	private _renderRightPanel(): void {
		if (!this.draft) return;
		renderDesignInspector({
			container: this.inspectorEl!,
			block: this._getSelectedBlock(),
			onPatchBlock: (patcher) => {
				const block = this._getSelectedBlock();
				if (!block || block.type !== "grid") return;
				patcher(block);
				this._syncPageSource();
				this._renderCanvasAndPreview();
			},
		});

		renderDesignThemePanel({
			container: this.themeEl!,
			theme: this.draft.theme,
			onChange: (patch) => {
				this.draft!.theme = {
					...this.draft!.theme,
					...patch,
				};
				this._renderPreviewOnly();
			},
		});

		this._renderPreviewOnly();
		if (this.plugin.settings.designMakerShowAdvancedSourceEditor) {
			this._renderPageSourceEditor();
			this._renderCssSourceEditor();
		} else {
			this.pageSourceEl!.empty();
			this.cssSourceEl!.empty();
		}
	}

	private _renderCanvasAndPreview(): void {
		this._syncPageSource();
		renderDesignCanvas({
			container: this.canvasEl!,
			page: this._getCurrentPage(),
			selectedBlockId: this.selectedBlockId,
			onSelect: (blockId) => {
				this.selectedBlockId = blockId;
				this._renderRightPanel();
			},
			onPatchBlock: (blockId, patcher) => {
				this._patchBlockById(blockId, patcher);
				this._renderCanvasAndPreview();
			},
			onAddBlock: (block) => {
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onDeleteBlock: (blockId) => {
				this._getCurrentPage().blocks = this._getCurrentPage().blocks.filter(
					(block) => block.id !== blockId,
				);
				this.selectedBlockId = null;
				this._syncPageSource();
				this._render();
			},
			onDuplicateBlock: (blockId) => {
				const target = this._getCurrentPage().blocks.find(
					(block) => block.id === blockId && block.type === "grid",
				);
				if (!target || target.type !== "grid") return;
				this._getCurrentPage().blocks.push({
					...target,
					id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
					rect: {
						...target.rect,
						x: Math.min(100 - target.rect.width, target.rect.x + 3),
						y: Math.min(100 - target.rect.height, target.rect.y + 3),
					},
				});
				this._syncPageSource();
				this._render();
			},
		});
		this._renderPreviewOnly();
		if (this.plugin.settings.designMakerShowAdvancedSourceEditor) {
			this._renderPageSourceEditor();
		}
	}

	private _renderPreviewOnly(): void {
		if (!this.draft) return;
		renderDesignPreview({
			container: this.previewEl!,
			page: this._getCurrentPage(),
			theme: this.draft.theme,
			selectedBlockId: this.selectedBlockId,
		});
		const previewCanvas = this.previewEl!.querySelector(
			".slides-rup-design-maker-preview",
		) as HTMLElement | null;
		if (previewCanvas) {
			previewCanvas.style.transform = `scale(${
				this.plugin.settings.designMakerPreviewScale / 100
			})`;
			previewCanvas.style.transformOrigin = "top left";
		}
	}

	private _renderPageSourceEditor(): void {
		this.pageSourceEl!.empty();
		this.pageSourceEl!.createEl("h3", {
			text: t("Page Source"),
			cls: "slides-rup-design-maker-section-title",
		});
		const textarea = this.pageSourceEl!.createEl("textarea", {
			text: this.pageSourceValue,
			cls: "slides-rup-design-maker-textarea",
		});
		textarea.addEventListener("input", () => {
			this.pageSourceValue = textarea.value;
		});
		const actions = this.pageSourceEl!.createDiv(
			"slides-rup-design-maker-inline-actions",
		);
		const applyButton = actions.createEl("button", {
			text: t("Apply Source Changes"),
		});
		applyButton.addEventListener("click", () => {
			if (!this.draft) return;
			const page = this._getCurrentPage();
			const reparsed = this.designMaker.reparsePage(
				this.draft.designName,
				page.type,
				page.filePath,
				this.pageSourceValue,
			);
			this.draft.pages[this.activePageType] = reparsed;
			this.selectedBlockId = null;
			this._render();
		});
	}

	private _renderCssSourceEditor(): void {
		this.cssSourceEl!.empty();
		this.cssSourceEl!.createEl("h3", {
			text: t("Theme CSS"),
			cls: "slides-rup-design-maker-section-title",
		});
		const textarea = this.cssSourceEl!.createEl("textarea", {
			text: this.cssSourceValue,
			cls: "slides-rup-design-maker-textarea",
		});
		textarea.addEventListener("input", () => {
			this.cssSourceValue = textarea.value;
		});
		const actions = this.cssSourceEl!.createDiv(
			"slides-rup-design-maker-inline-actions",
		);
		const applyButton = actions.createEl("button", {
			text: t("Apply Theme CSS"),
		});
		applyButton.addEventListener("click", () => {
			if (!this.draft) return;
			this.draft.theme = {
				...this.draft.theme,
				rawCss: this.cssSourceValue,
			};
			new Notice(t("Theme CSS updated"));
		});
	}

	private _getCurrentPage() {
		if (!this.draft) {
			throw new Error("Design draft is not loaded.");
		}
		return this.draft.pages[this.activePageType];
	}

	private _getSelectedBlock() {
		if (!this.selectedBlockId) return null;
		return (
			this._getCurrentPage().blocks.find(
				(block) => block.id === this.selectedBlockId,
			) || null
		);
	}

	private _patchBlockById(
		blockId: string,
		patcher: (block: DesignGridBlock) => void,
	): void {
		const block = this._getCurrentPage().blocks.find(
			(item) => item.id === blockId,
		);
		if (!block || block.type !== "grid") return;
		patcher(block);
		this._syncPageSource();
	}

	private _syncPageSource(): void {
		this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
	}
}
