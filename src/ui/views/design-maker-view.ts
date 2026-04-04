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
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "src/constants";

export class DesignMakerView extends ItemView {
	private plugin: any;
	private designMaker: DesignMaker;
	private designState: DesignMakerViewState | null = null;
	private draft: DesignDraft | null = null;
	private presentationCss: string = "";
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
	private resizeObserver: ResizeObserver | null = null;
	private resizeRafId: number | null = null;
	private lastCenterStageWidth = 0;
	private lastCenterStageHeight = 0;
	private readonly _onWindowKeyDown = (event: KeyboardEvent) => {
		this._handleWindowKeyDown(event);
	};
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
		this._setupResizeObserver();
		window.addEventListener("keydown", this._onWindowKeyDown);
	}

	async onClose(): Promise<void> {
		window.removeEventListener("keydown", this._onWindowKeyDown);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		if (this.resizeRafId !== null) {
			cancelAnimationFrame(this.resizeRafId);
			this.resizeRafId = null;
		}
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

	private async _loadDraft(options?: {
		keepActivePage?: boolean;
	}): Promise<void> {
		if (!this.designState?.designPath) return;
		const keepActivePage = options?.keepActivePage === true;
		const previousPageType = this.activePageType;
		try {
			this.draft = await this.designMaker.loadDesignDraft(
				this.designState.designPath,
			);
			if (keepActivePage && this.draft.pages[previousPageType]) {
				this.activePageType = previousPageType;
			} else {
				this.activePageType = "cover";
			}
			this.selectedBlockId = null;
			this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
			this.cssSourceValue = this.draft.theme.rawCss || "";
			await this._loadPresentationCss();
			this._render();
		} catch (error) {
			this.draft = null;
			new Notice(`${t("Failed to load design")}${error}`);
			this._render();
		}
	}

	private async _loadPresentationCss(): Promise<void> {
		const pluginFolder =
			this.plugin.settings.presentationPlugin === "slidesExtended"
				? SLIDES_EXTENDED_PLUGIN_FOLDER
				: ADVANCED_SLIDES_PLUGIN_FOLDER;
		const isDark = document.body.classList.contains("theme-dark");
		const themeCSSFileName = isDark ? "color-dark.css" : "color-light.css";
		const themeCSSPath = `${this.app.vault.configDir}/${pluginFolder}/dist/Styles/${themeCSSFileName}`;
		const pageDesignCSSPath = `${this.app.vault.configDir}/${pluginFolder}/dist/Styles/page-design.css`;

		try {
			if (await this.app.vault.adapter.exists(themeCSSPath)) {
				this.presentationCss +=
					await this.app.vault.adapter.read(pageDesignCSSPath);
				this.presentationCss +=
					await this.app.vault.adapter.read(themeCSSPath);
			} else {
				this.presentationCss = "";
			}
		} catch (e) {
			console.error("Failed to load presentation css", e);
			this.presentationCss = "";
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
			await this._loadDraft({ keepActivePage: true });
		});

		const reloadButton = actions.createEl("button", {
			text: t("Reload Design"),
		});
		reloadButton.addEventListener("click", async () => {
			await this._loadDraft({ keepActivePage: true });
		});

		const loadButton = actions.createEl("button", {
			text: t("Load Design"),
		});
		loadButton.addEventListener("click", async () => {
			await this.designMaker.openDesignMaker(this.leaf);
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
		this._setupResizeObserver();
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
			selectedBlockId: this.selectedBlockId,
			onSelect: (pageType) => {
				this.activePageType = pageType;
				this.selectedBlockId = null;
				this.pageSourceValue = generatePageMarkdown(
					this._getCurrentPage(),
				);
				this._render();
			},
			onSelectBlock: (blockId) => {
				const previousBlockId = this.selectedBlockId;
				this.selectedBlockId = blockId;
				this._applySelectionVisualTransition(previousBlockId, blockId);
				this._renderToolbar();
				this._renderRightPanel();
				this._render();
			},
			onToggleBlockVisibility: (blockId, hidden) => {
				const block = this._getCurrentPage().blocks.find(
					(b) => b.id === blockId,
				);
				if (block) {
					block.hiddenInDesign = hidden;
					this._renderCanvasAndPreview();
					this._render(); // update eye icon in list
				}
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
			app: this.app,
			container: this.canvasEl!,
			page: this._getCurrentPage(),
			themeRawCss: this.draft?.theme.rawCss || "",
			presentationCss: this.presentationCss,
			slideBaseWidth: this._getSlideBaseWidth(),
			slideBaseHeight: this._getSlideBaseHeight(),
			selectedBlockId: this.selectedBlockId,
			onSelect: (blockId) => {
				const previousBlockId = this.selectedBlockId;
				this.selectedBlockId = blockId;
				this._applySelectionVisualTransition(previousBlockId, blockId);
				this._renderToolbar();
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
				this._deleteBlockById(blockId);
			},
			onDuplicateBlock: (blockId) => {
				this._duplicateGridBlock(blockId, 3);
			},
		});
	}

	private _renderToolbar(): void {
		if (!this.toolbarEl) return;
		renderDesignToolbar({
			container: this.toolbarEl,
			selectedBlockId: this.selectedBlockId,
			hasFootnotesBlock: this._hasFootnotesBlock(),
			hasSideBarBlock: this._hasSideBarBlock(),
			onAddBlock: (block) => {
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onAddFootnotes: () => {
				if (this._hasFootnotesBlock()) {
					new Notice(t("Footnotes block already exists"));
					return;
				}
				const block = this._createFootnotesBlock();
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onAddSideBar: () => {
				if (this._hasSideBarBlock()) {
					new Notice(t("SR-SideBar block already exists"));
					return;
				}
				const block = this._createSideBarBlock();
				this._getCurrentPage().blocks.push(block);
				this.selectedBlockId = block.id;
				this._syncPageSource();
				this._render();
			},
			onDeleteBlock: (blockId) => {
				this._deleteBlockById(blockId);
			},
			onDuplicateBlock: (blockId) => {
				this._duplicateGridBlock(blockId, 4);
			},
		});
	}

	private _renderPreviewOnly(showTitle: boolean = true): void {
		if (!this.draft) return;
		renderDesignPreview({
			app: this.app,
			container: this.previewEl!,
			page: this._getCurrentPage(),
			theme: this.draft.theme,
			presentationCss: this.presentationCss,
			selectedBlockId: this.selectedBlockId,
			showTitle,
			previewScale: this.plugin.settings.designMakerPreviewScale,
			slideBaseWidth: this._getSlideBaseWidth(),
			slideBaseHeight: this._getSlideBaseHeight(),
		});
	}

	private _setupResizeObserver(): void {
		if (!this.centerStageEl) return;
		this.resizeObserver?.disconnect();
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry || !this.draft) return;
			const width = Math.round(entry.contentRect.width);
			const height = Math.round(entry.contentRect.height);
			if (
				width === this.lastCenterStageWidth &&
				height === this.lastCenterStageHeight
			) {
				return;
			}
			this.lastCenterStageWidth = width;
			this.lastCenterStageHeight = height;
			if (this.resizeRafId !== null) {
				cancelAnimationFrame(this.resizeRafId);
			}
			this.resizeRafId = requestAnimationFrame(() => {
				this.resizeRafId = null;
				this._renderCanvasOnly();
				this._renderPreviewOnly(false);
			});
		});
		this.resizeObserver.observe(this.centerStageEl);
	}

	private _applySelectionVisualTransition(
		previousBlockId: string | null,
		nextBlockId: string | null,
	): void {
		const updateSelection = (root: HTMLElement, selector: string) => {
			if (previousBlockId && previousBlockId !== nextBlockId) {
				const previousEl = root.querySelector(
					`${selector}[data-block-id="${previousBlockId}"]`,
				) as HTMLElement | null;
				if (previousEl) {
					previousEl.removeClass("is-selected");
					previousEl.addClass("is-deselecting");
					window.setTimeout(
						() => previousEl.removeClass("is-deselecting"),
						150,
					);
				}
			}
			if (nextBlockId) {
				const nextEl = root.querySelector(
					`${selector}[data-block-id="${nextBlockId}"]`,
				) as HTMLElement | null;
				if (nextEl) {
					nextEl.removeClass("is-deselecting");
					nextEl.addClass("is-selected");
				}
			}
		};

		const canvas = this.canvasEl?.querySelector(
			".slides-rup-design-maker-canvas",
		) as HTMLElement | null;
		const preview = this.previewEl?.querySelector(
			".slides-rup-design-maker-preview",
		) as HTMLElement | null;
		if (!canvas || !preview) {
			this._renderCanvasOnly();
			this._renderPreviewOnly(false);
			return;
		}
		updateSelection(canvas, ".slides-rup-design-maker-block");
		updateSelection(preview, ".slides-rup-design-maker-preview-block");
	}

	private _getSlideBaseWidth(): number {
		const value = Number(
			this.plugin.settings.designMakerSlideBaseWidth || 1920,
		);
		return Number.isFinite(value) && value > 0 ? value : 1920;
	}

	private _getSlideBaseHeight(): number {
		const value = Number(
			this.plugin.settings.designMakerSlideBaseHeight || 1080,
		);
		return Number.isFinite(value) && value > 0 ? value : 1080;
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

	private _isFootnotesBlock(block: DesignGridBlock): boolean {
		return (
			block.className.trim().split(/\s+/).includes("footnotes") ||
			block.content.includes("<%? footnotes %>")
		);
	}

	private _isSideBarBlock(block: DesignGridBlock): boolean {
		return (
			block.className.trim().split(/\s+/).includes("sr-sidebar") ||
			block.content.includes("![[SR-SideBar]]")
		);
	}

	private _hasFootnotesBlock(): boolean {
		return this._getCurrentPage().blocks.some(
			(block) => block.type === "grid" && this._isFootnotesBlock(block),
		);
	}

	private _hasSideBarBlock(): boolean {
		return this._getCurrentPage().blocks.some(
			(block) => block.type === "grid" && this._isSideBarBlock(block),
		);
	}

	private _createFootnotesBlock(): DesignGridBlock {
		return {
			id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			type: "grid",
			role: "placeholder",
			rect: {
				x: 0,
				y: 92,
				width: 100,
				height: 8,
			},
			content: "<%? footnotes %>",
			className: "footnotes",
			style: "",
			pad: "0 40px",
			align: "topleft",
			flow: "",
			filter: "",
			justifyContent: "",
			bg: "",
			border: "",
			animate: "",
			opacity: "",
			rotate: "",
			frag: "",
			extraAttributes: {},
		};
	}

	private _createSideBarBlock(): DesignGridBlock {
		return {
			id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			type: "grid",
			role: "placeholder",
			rect: {
				x: 95,
				y: 35,
				width: 5,
				height: 30,
			},
			content: "![[SR-SideBar]]",
			className: "sr-sidebar",
			style: "",
			pad: "0",
			align: "center",
			flow: "",
			filter: "",
			justifyContent: "center",
			bg: "",
			border: "",
			animate: "",
			opacity: "",
			rotate: "",
			frag: "",
			extraAttributes: {},
		};
	}

	private _duplicateGridBlock(blockId: string, offset: number): void {
		const page = this._getCurrentPage();
		const target = page.blocks.find(
			(block) => block.id === blockId && block.type === "grid",
		);
		if (!target || target.type !== "grid") return;
		if (this._isFootnotesBlock(target)) {
			new Notice(t("Footnotes block already exists"));
			return;
		}
		if (this._isSideBarBlock(target)) {
			new Notice(t("SR-SideBar block already exists"));
			return;
		}
		const nextBlock: DesignGridBlock = {
			...target,
			id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			rect: {
				...target.rect,
				x: Math.min(100 - target.rect.width, target.rect.x + offset),
				y: Math.min(100 - target.rect.height, target.rect.y + offset),
			},
		};
		page.blocks.push(nextBlock);
		this.selectedBlockId = nextBlock.id;
		this._syncPageSource();
		this._render();
	}

	private _deleteBlockById(blockId: string): void {
		const page = this._getCurrentPage();
		page.blocks = page.blocks.filter((block) => block.id !== blockId);
		if (this.selectedBlockId === blockId) {
			this.selectedBlockId = null;
		}
		this._syncPageSource();
		this._render();
	}

	private _handleWindowKeyDown(event: KeyboardEvent): void {
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key !== "Backspace" && event.key !== "Delete") return;
		const activeView =
			this.app.workspace.getActiveViewOfType(DesignMakerView);
		if (activeView !== this) return;
		if (!this.selectedBlockId || !this.draft) return;
		const target = event.target as HTMLElement | null;
		if (this._isTypingElement(target)) return;
		event.preventDefault();
		this._deleteSelectedBlockWithPulse(this.selectedBlockId);
	}

	private _deleteSelectedBlockWithPulse(blockId: string): void {
		const pulseSelectors = [
			".slides-rup-design-maker-block",
			".slides-rup-design-maker-preview-block",
		];
		const roots = [this.canvasEl, this.previewEl].filter(
			(element): element is HTMLElement => Boolean(element),
		);
		roots.forEach((root) => {
			pulseSelectors.forEach((selector) => {
				const target = root.querySelector(
					`${selector}[data-block-id="${blockId}"]`,
				) as HTMLElement | null;
				if (target) {
					target.removeClass("is-delete-pending");
					target.addClass("is-delete-pending");
				}
			});
		});
		window.setTimeout(() => {
			this._deleteBlockById(blockId);
		}, 100);
	}

	private _isTypingElement(target: HTMLElement | null): boolean {
		if (!target) return false;
		const tagName = target.tagName;
		if (
			tagName === "INPUT" ||
			tagName === "TEXTAREA" ||
			tagName === "SELECT"
		) {
			return true;
		}
		if (target.isContentEditable) return true;
		return Boolean(target.closest('[contenteditable="true"]'));
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
