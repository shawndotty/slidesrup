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
import {
	renderDesignCanvas,
	renderDesignToolbar,
} from "../components/design-canvas";

export class DesignMakerView extends ItemView {
	private plugin: any;
	private designMaker: DesignMaker;
	private designState: DesignMakerViewState | null = null;
	private draft: DesignDraft | null = null;
	private activePageType: DesignPageType = "cover";
	private selectedBlockId: string | null = null;
	private pageListEl: HTMLElement | null = null;
	private centerTabsEl: HTMLElement | null = null;
	private centerStageEl: HTMLElement | null = null;
	private canvasEl: HTMLElement | null = null;
	private toolbarEl: HTMLElement | null = null;
	private inspectorPanelEl: HTMLDetailsElement | null = null;
	private themePanelEl: HTMLDetailsElement | null = null;
	private pageSourcePanelEl: HTMLDetailsElement | null = null;
	private cssSourcePanelEl: HTMLDetailsElement | null = null;
	private inspectorEl: HTMLElement | null = null;
	private themeEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private pageSourceEl: HTMLElement | null = null;
	private cssSourceEl: HTMLElement | null = null;
	private pageSourceValue = "";
	private cssSourceValue = "";
	private activeCenterTab: "design" | "preview" = "design";
	private rightPanelState = {
		inspector: true,
		theme: true,
		pageSource: false,
		cssSource: false,
	};

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

	async setState(state: DesignMakerViewState, result: any): Promise<void> {
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
		try {
			this.draft = await this.designMaker.loadDesignDraft(
				this.designState.designPath,
			);
			this.activePageType = "cover";
			this.selectedBlockId = null;
			this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
			this.cssSourceValue = this.draft.theme.rawCss || "";
			this._render();
		} catch (error) {
			this.draft = null;
			new Notice(`${t("Failed to load design")}${error}`);
			this._render();
		}
	}

	private _ensureLayout(): void {
		if (this._hasLayout()) return;
		this._resetLayoutRefs();
		this.contentEl.empty();
		this.contentEl.addClass("slides-rup-design-maker-view");

		const header = this.contentEl.createDiv(
			"slides-rup-design-maker-header",
		);
		const title = header.createEl("h2", { text: t("Design Maker") });
		title.addClass("slides-rup-design-maker-title");

		const actions = header.createDiv(
			"slides-rup-design-maker-header-actions",
		);
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

		const layout = this.contentEl.createDiv(
			"slides-rup-design-maker-layout",
		);
		this.pageListEl = layout.createDiv("slides-rup-design-maker-sidebar");
		const center = layout.createDiv("slides-rup-design-maker-main");
		this.centerTabsEl = center.createDiv(
			"slides-rup-design-maker-center-tabs",
		);
		this.centerStageEl = center.createDiv(
			"slides-rup-design-maker-center-stage",
		);
		this.canvasEl = this.centerStageEl.createDiv(
			"slides-rup-design-maker-canvas-panel",
		);
		this.previewEl = this.centerStageEl.createDiv(
			"slides-rup-design-maker-panel",
		);
		this.toolbarEl = center.createDiv(
			"slides-rup-design-maker-toolbar-panel",
		);
		const right = layout.createDiv("slides-rup-design-maker-sidepanel");
		this.inspectorEl = this._createCollapsiblePanel(
			right,
			"Block Inspector",
			"inspector",
		);
		this.themeEl = this._createCollapsiblePanel(
			right,
			"Design Theme",
			"theme",
		);
		this.pageSourceEl = this._createCollapsiblePanel(
			right,
			"Page Source",
			"pageSource",
		);
		this.cssSourceEl = this._createCollapsiblePanel(
			right,
			"Theme CSS",
			"cssSource",
		);
	}

	private _render(): void {
		this._ensureLayout();
		if (!this.pageListEl || !this.canvasEl || !this.inspectorEl) return;
		if (!this.draft) {
			this._renderEmptyState(
				this.designState?.designPath
					? t("Loading design")
					: t("No design loaded"),
			);
			return;
		}

		renderDesignPageList({
			container: this.pageListEl,
			draft: this.draft,
			activePageType: this.activePageType,
			onSelect: (pageType) => {
				this.activePageType = pageType;
				this.selectedBlockId = null;
				this.pageSourceValue = generatePageMarkdown(
					this._getCurrentPage(),
				);
				this._render();
			},
		});

		this._renderCenterPanel();
		this._renderRightPanel();
	}

	private _renderCenterPanel(): void {
		this._renderCenterTabs();
		this._renderToolbar();
		if (this.activeCenterTab === "design") {
			this.canvasEl?.removeClass("is-hidden");
			this.previewEl?.addClass("is-hidden");
			this._renderCanvasOnly();
			return;
		}
		this.canvasEl?.addClass("is-hidden");
		this.previewEl?.removeClass("is-hidden");
		this._renderPreviewOnly(false);
	}

	private _renderCenterTabs(): void {
		if (!this.centerTabsEl) return;
		this.centerTabsEl.empty();
		const designButton = this.centerTabsEl.createEl("button", {
			text: t("Design"),
			cls: "slides-rup-design-maker-tab-button",
		});
		const previewButton = this.centerTabsEl.createEl("button", {
			text: t("Preview"),
			cls: "slides-rup-design-maker-tab-button",
		});
		if (this.activeCenterTab === "design") {
			designButton.addClass("is-active");
		} else {
			previewButton.addClass("is-active");
		}
		designButton.addEventListener("click", () => {
			this.activeCenterTab = "design";
			this._renderCenterPanel();
		});
		previewButton.addEventListener("click", () => {
			this.activeCenterTab = "preview";
			this._renderCenterPanel();
		});
	}

	private _renderRightPanel(): void {
		if (!this.draft) return;
		renderDesignInspector({
			container: this.inspectorEl!,
			block: this._getSelectedBlock(),
			showTitle: false,
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
			showTitle: false,
			onChange: (patch) => {
				this.draft!.theme = {
					...this.draft!.theme,
					...patch,
				};
				this._renderPreviewOnly(false);
			},
		});

		if (this.plugin.settings.designMakerShowAdvancedSourceEditor) {
			this.pageSourcePanelEl?.removeClass("is-hidden");
			this.cssSourcePanelEl?.removeClass("is-hidden");
			this._renderPageSourceEditor();
			this._renderCssSourceEditor();
		} else {
			this.pageSourcePanelEl?.addClass("is-hidden");
			this.cssSourcePanelEl?.addClass("is-hidden");
			this.pageSourceEl!.empty();
			this.cssSourceEl!.empty();
		}
	}

	private _renderCanvasAndPreview(): void {
		this._syncPageSource();
		this._renderCanvasOnly();
		this._renderPreviewOnly(false);
		if (this.plugin.settings.designMakerShowAdvancedSourceEditor) {
			this._renderPageSourceEditor();
		}
		this._renderToolbar();
	}

	private _renderCanvasOnly(): void {
		renderDesignCanvas({
			container: this.canvasEl!,
			page: this._getCurrentPage(),
			themeRawCss: this.draft?.theme.rawCss || "",
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
				this._getCurrentPage().blocks =
					this._getCurrentPage().blocks.filter(
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
						y: Math.min(
							100 - target.rect.height,
							target.rect.y + 3,
						),
					},
				});
				this._syncPageSource();
				this._render();
			},
		});
	}

	private _renderToolbar(): void {
		if (!this.toolbarEl) return;
		renderDesignToolbar({
			container: this.toolbarEl,
			selectedBlockId: this.selectedBlockId,
			onAddBlock: (block) => {
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onDeleteBlock: (blockId) => {
				const page = this._getCurrentPage();
				page.blocks = page.blocks.filter(
					(block) => block.id !== blockId,
				);
				if (this.selectedBlockId === blockId)
					this.selectedBlockId = null;
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
						y: Math.min(
							100 - target.rect.height,
							target.rect.y + 4,
						),
					},
				};
				this._getCurrentPage().blocks.push(nextBlock);
				this.selectedBlockId = nextBlock.id;
				this._syncPageSource();
				this._render();
			},
		});
	}

	private _renderPreviewOnly(showTitle: boolean = true): void {
		if (!this.draft) return;
		renderDesignPreview({
			container: this.previewEl!,
			page: this._getCurrentPage(),
			theme: this.draft.theme,
			selectedBlockId: this.selectedBlockId,
			showTitle,
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

	private _renderEmptyState(message: string): void {
		[
			this.pageListEl,
			this.canvasEl,
			this.toolbarEl,
			this.inspectorEl,
			this.themeEl,
			this.previewEl,
			this.pageSourceEl,
			this.cssSourceEl,
		].forEach((element) => element?.empty());
		this._renderCenterTabs();
		this.canvasEl?.removeClass("is-hidden");
		this.previewEl?.addClass("is-hidden");
		this.pageSourcePanelEl?.addClass("is-hidden");
		this.cssSourcePanelEl?.addClass("is-hidden");
		this.canvasEl?.createEl("p", {
			text: message,
			cls: "slides-rup-design-maker-empty-text",
		});
	}

	private _hasLayout(): boolean {
		return Boolean(
			this.pageListEl &&
			this.centerTabsEl &&
			this.centerStageEl &&
			this.canvasEl &&
			this.toolbarEl &&
			this.inspectorPanelEl &&
			this.themePanelEl &&
			this.pageSourcePanelEl &&
			this.cssSourcePanelEl &&
			this.inspectorEl &&
			this.themeEl &&
			this.previewEl &&
			this.pageSourceEl &&
			this.cssSourceEl &&
			this.contentEl.contains(this.pageListEl) &&
			this.contentEl.contains(this.centerTabsEl) &&
			this.contentEl.contains(this.centerStageEl) &&
			this.contentEl.contains(this.canvasEl) &&
			this.contentEl.contains(this.toolbarEl) &&
			this.contentEl.contains(this.inspectorPanelEl) &&
			this.contentEl.contains(this.themePanelEl) &&
			this.contentEl.contains(this.pageSourcePanelEl) &&
			this.contentEl.contains(this.cssSourcePanelEl) &&
			this.contentEl.contains(this.inspectorEl) &&
			this.contentEl.contains(this.themeEl) &&
			this.contentEl.contains(this.previewEl) &&
			this.contentEl.contains(this.pageSourceEl) &&
			this.contentEl.contains(this.cssSourceEl),
		);
	}

	private _resetLayoutRefs(): void {
		this.pageListEl = null;
		this.centerTabsEl = null;
		this.centerStageEl = null;
		this.canvasEl = null;
		this.toolbarEl = null;
		this.inspectorPanelEl = null;
		this.themePanelEl = null;
		this.pageSourcePanelEl = null;
		this.cssSourcePanelEl = null;
		this.inspectorEl = null;
		this.themeEl = null;
		this.previewEl = null;
		this.pageSourceEl = null;
		this.cssSourceEl = null;
	}

	private _createCollapsiblePanel(
		parent: HTMLElement,
		title: string,
		key: keyof DesignMakerView["rightPanelState"],
	): HTMLElement {
		const panel = parent.createEl("details", {
			cls: "slides-rup-design-maker-collapse-panel",
		});
		panel.open = this.rightPanelState[key];
		panel.addEventListener("toggle", () => {
			this.rightPanelState[key] = panel.open;
		});
		panel.createEl("summary", {
			text: t(title as any),
			cls: "slides-rup-design-maker-collapse-summary",
		});
		const content = panel.createDiv(
			"slides-rup-design-maker-collapse-content",
		);
		switch (key) {
			case "inspector":
				this.inspectorPanelEl = panel;
				break;
			case "theme":
				this.themePanelEl = panel;
				break;
			case "pageSource":
				this.pageSourcePanelEl = panel;
				break;
			case "cssSource":
				this.cssSourcePanelEl = panel;
				break;
		}
		return content;
	}
}
