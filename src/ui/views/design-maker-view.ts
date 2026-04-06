import { debounce, ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { t } from "src/lang/helpers";
import {
	generateDesignMakerRuntimeCss,
	generatePageMarkdown,
} from "src/services/design-maker-generator";
import { DesignMaker } from "src/services/design-maker";
import {
	DESIGN_MAKER_VIEW_TYPE,
	DesignDraft,
	DesignGridBlock,
	DesignCanvasBlock,
	DesignMakerViewState,
	DesignPageType,
	DesignRectUnit,
} from "src/types/design-maker";
import {
	getInsertIndexForReversedLayerOrder,
	LayerMoveRequest,
	renderDesignPageList,
} from "../components/design-page-list";
import { renderDesignThemePanel } from "../components/design-theme-panel";
import { renderDesignPreview } from "../components/design-preview";
import {
	getNextThumbnailIndex,
	renderDesignThumbnailNav,
} from "../components/design-thumbnail-nav";
import {
	renderDesignInspector,
	syncInspectorRectFields,
} from "../components/design-inspector";
import {
	clampCanvasZoomPercent,
	computeCanvasTransform,
	computePanForZoom,
	renderDesignCanvas,
	renderDesignToolbar,
} from "../components/design-canvas";
import {
	SLIDES_EXTENDED_PLUGIN_FOLDER,
	ADVANCED_SLIDES_PLUGIN_FOLDER,
} from "src/constants";
import { dispatchThemeColorChange } from "src/services/theme-color-dispatch";

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
	private thumbnailNavEl: HTMLElement | null = null;
	private centerControlsEl: HTMLElement | null = null;
	private canvasControlsEl: HTMLElement | null = null;
	private centerActionsEl: HTMLElement | null = null;
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
	private isGlobalCoords = false;
	private activeCenterTab: "design" | "preview" = "design";
	private resizeObserver: ResizeObserver | null = null;
	private resizeRafId: number | null = null;
	private lastCenterStageWidth = 0;
	private lastCenterStageHeight = 0;
	private lastSelectionVisualBlockId: string | null = null;
	private readonly _syncSelectionVisualsDebounced: () => void;
	private canvasZoomPercent = 100;
	private canvasPanX = 0;
	private canvasPanY = 0;
	private previewZoomPercent = 100;
	private thumbnailNavScrollLeft = 0;
	private isSpaceKeyDown = false;
	private readonly _syncThemeColorToSettingsDebounced: (
		color: string,
	) => void;
	private readonly _onWindowKeyUp = (event: KeyboardEvent) => {
		this._handleWindowKeyUp(event);
	};
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
		this.previewZoomPercent =
			Number(plugin.settings.designMakerPreviewScale) || 100;
		this._syncSelectionVisualsDebounced = debounce(() => {
			this._applySelectionVisualTransition(
				this.lastSelectionVisualBlockId,
				this.selectedBlockId,
			);
			this.lastSelectionVisualBlockId = this.selectedBlockId;
		}, 16);
		this._syncThemeColorToSettingsDebounced = debounce(
			async (color: string) => {
				await dispatchThemeColorChange(this.plugin, color);
			},
			200,
			true,
		);
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
		window.addEventListener("keyup", this._onWindowKeyUp);
	}

	async onClose(): Promise<void> {
		window.removeEventListener("keydown", this._onWindowKeyDown);
		window.removeEventListener("keyup", this._onWindowKeyUp);
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
			this._notifyUnitWarnings(this.draft);
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

		// const header = this.contentEl.createDiv(
		// 	"slides-rup-design-maker-header",
		// );
		// const title = header.createEl("h2", { text: t("Design Maker") });
		// title.addClass("slides-rup-design-maker-title");

		const layout = this.contentEl.createDiv(
			"slides-rup-design-maker-layout",
		);
		this.pageListEl = layout.createDiv("slides-rup-design-maker-sidebar");
		const center = layout.createDiv("slides-rup-design-maker-main");
		this.toolbarEl = center.createDiv(
			"slides-rup-design-maker-toolbar-panel",
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
		this.thumbnailNavEl = center.createDiv(
			"slides-rup-design-maker-thumbnail-nav-panel",
		);
		this.centerControlsEl = center.createDiv(
			"slides-rup-design-maker-center-controls-panel",
		);
		this.canvasControlsEl = this.centerControlsEl.createDiv(
			"slides-rup-design-maker-canvas-controls-panel slides-rup-design-maker-center-controls-left",
		);
		this.centerTabsEl = this.centerControlsEl.createDiv(
			"slides-rup-design-maker-center-tabs slides-rup-design-maker-center-controls-center",
		);
		this.centerActionsEl = this.centerControlsEl.createDiv(
			"slides-rup-design-maker-center-controls-right",
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
				this._setActivePage(pageType);
			},
			onSelectBlock: (blockId) => {
				this._setSelectedBlockId(blockId);
			},
			onMoveBlock: (request) => {
				this._moveBlock(request);
			},
			onToggleBlockVisibility: (blockId, hidden) => {
				const found = this._findBlockById(
					this._getCurrentPage().blocks,
					blockId,
				);
				if (!found) return;
				found.block.hiddenInDesign = hidden;
				this._renderCanvasAndPreview();
				this._render(); // update eye icon in list
			},
		});

		this._renderCenterPanel();
		this._renderRightPanel();
		this.lastSelectionVisualBlockId = this.selectedBlockId;
	}

	private _setSelectedBlockId(blockId: string | null): void {
		if (!this.draft) return;
		if (this.selectedBlockId === blockId) return;
		this.selectedBlockId = blockId;
		this._syncSelectionVisualsDebounced();
		this._renderToolbar();
		this._renderRightPanel();
	}

	private _renderCenterPanel(): void {
		this._renderToolbar();
		this._renderThumbnailNav();
		this._renderCenterControls();
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

	private _renderCenterControls(): void {
		this._renderCenterTabs();
		this._renderCanvasControls();
		this._renderCenterActions();
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
			app: this.app,
			container: this.inspectorEl!,
			block: this._getSelectedBlock(),
			showTitle: false,
			aiInlineStyleEnabled: this.plugin.settings.aiInlineStyleEnabled,
			onGenerateInlineStyleAI: async (prompt, currentStyle) => {
				return this.plugin.services.inlineStyleAiService.generateInlineStyle(
					prompt,
					currentStyle,
				);
			},
			isGlobalCoords: this.isGlobalCoords,
			onToggleCoords: (global) => {
				this.isGlobalCoords = global;
				this._renderRightPanel();
			},
			getGlobalCoords: () => {
				return this._getSelectedBlockGlobalCoords();
			},
			setGlobalCoords: (x, y) => {
				const block = this._getSelectedBlock();
				if (!block || block.type !== "grid" || !this.canvasEl) return;
				const parentEl = this.canvasEl.querySelector(
					".slides-rup-design-maker-canvas",
				) as HTMLElement;
				if (!parentEl) return;

				const parentRect = parentEl.getBoundingClientRect();
				const globalRect = new DOMRect(
					parentRect.left + (x / 100) * parentRect.width,
					parentRect.top + (y / 100) * parentRect.height,
					block.rect.width,
					block.rect.height,
				);

				const blockParentEl = this._findBlockById(
					this._getCurrentPage().blocks,
					block.id,
				)?.parent;
				const currentParentDom = blockParentEl
					? (this.canvasEl.querySelector(
							`[data-block-id="${blockParentEl.id}"]`,
						) as HTMLElement)
					: parentEl;

				if (!currentParentDom) return;

				this._patchBlockById(block.id, (nextBlock) => {
					this._updateBlockCoordinates(
						nextBlock,
						globalRect,
						currentParentDom,
					);
				});
				this._renderCanvasAndPreview();
			},
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
				if (typeof patch.primaryColor === "string") {
					this._syncThemeColorToSettingsDebounced(patch.primaryColor);
				}
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

	private _renderThumbnailNav(): void {
		if (!this.thumbnailNavEl || !this.draft) return;
		renderDesignThumbnailNav({
			container: this.thumbnailNavEl,
			pages: this._getOrderedPages(),
			activePageType: this.activePageType,
			initialScrollLeft: this.thumbnailNavScrollLeft,
			onScrollLeftChange: (scrollLeft) => {
				this.thumbnailNavScrollLeft = scrollLeft;
			},
			onSelect: (pageType) => {
				this._setActivePage(pageType);
			},
		});
	}

	private _renderCanvasAndPreview(): void {
		this._syncPageSource();
		this._renderCanvasOnly();
		this._renderPreviewOnly(false);
		this._renderCenterControls();
		if (this.plugin.settings.designMakerShowAdvancedSourceEditor) {
			this._renderPageSourceEditor();
		}
		this._renderToolbar();
	}

	private _renderCanvasOnly(): void {
		const themeRawCss = this.draft
			? generateDesignMakerRuntimeCss(this.draft.theme)
			: "";
		renderDesignCanvas({
			app: this.app,
			container: this.canvasEl!,
			page: this._getCurrentPage(),
			themeRawCss,
			presentationCss: this.presentationCss,
			slideBaseWidth: this._getSlideBaseWidth(),
			slideBaseHeight: this._getSlideBaseHeight(),
			canvasZoomPercent: this.canvasZoomPercent,
			canvasPanX: this.canvasPanX,
			canvasPanY: this.canvasPanY,
			isPanKeyDown: () => this.isSpaceKeyDown,
			onPanChange: (panX, panY) => {
				this.canvasPanX = panX;
				this.canvasPanY = panY;
			},
			onZoomChange: (zoomPercent, panX, panY) => {
				this.canvasZoomPercent = clampCanvasZoomPercent(zoomPercent);
				this.canvasPanX = panX;
				this.canvasPanY = panY;
				this._updateCanvasZoomLabel();
			},
			selectedBlockId: this.selectedBlockId,
			onSelect: (blockId) => {
				this._setSelectedBlockId(blockId);
			},
			onPatchBlock: (blockId, patcher, mode = "commit") => {
				this._patchBlockById(blockId, patcher, {
					syncPageSource: mode !== "live",
				});
				if (mode === "live") {
					this._syncSelectedInspectorRectFields();
					return;
				}
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

	private _renderCanvasControls(): void {
		if (!this.canvasControlsEl) return;
		this.canvasControlsEl.removeClass("is-hidden");
		this.canvasControlsEl.empty();

		const isPreview = this.activeCenterTab === "preview";
		const zoomPercent = isPreview
			? this.previewZoomPercent
			: this.canvasZoomPercent;

		const controls = this.canvasControlsEl.createDiv(
			"slides-rup-design-maker-canvas-controls",
		);
		const zoomOutButton = controls.createEl("button", {
			text: "-",
			attr: { "aria-label": "Zoom out" },
		});
		zoomOutButton.addEventListener("click", () => {
			if (isPreview) {
				this._setPreviewZoomPercent(zoomPercent - 10);
				return;
			}
			this._setCanvasZoomPercent(zoomPercent - 10, "center");
		});

		const zoomLabel = controls.createDiv(
			"slides-rup-design-maker-zoom-label",
		);
		zoomLabel.setText(`${zoomPercent}%`);

		const zoomInButton = controls.createEl("button", {
			text: "+",
			attr: { "aria-label": "Zoom in" },
		});
		zoomInButton.addEventListener("click", () => {
			if (isPreview) {
				this._setPreviewZoomPercent(zoomPercent + 10);
				return;
			}
			this._setCanvasZoomPercent(zoomPercent + 10, "center");
		});

		const zoomResetButton = controls.createEl("button", {
			text: "100%",
			attr: { "aria-label": "Reset zoom" },
		});
		zoomResetButton.addEventListener("click", () => {
			if (isPreview) {
				this._setPreviewZoomPercent(100);
				return;
			}
			this._resetCanvasView();
		});
	}

	private _setPreviewZoomPercent(zoomPercent: number): void {
		this.previewZoomPercent = clampCanvasZoomPercent(zoomPercent);
		this._renderPreviewOnly(false);
		this._renderCanvasControls();
	}

	private _renderCenterActions(): void {
		if (!this.centerActionsEl) return;
		this.centerActionsEl.empty();
		const actions = this.centerActionsEl.createDiv(
			"slides-rup-design-maker-center-actions",
		);

		const saveButton = actions.createEl("button", {
			text: t("Save and Apply"),
		});
		saveButton.disabled = !this.draft;
		saveButton.addEventListener("click", async () => {
			if (!this.draft) return;
			this.draft.theme.rawCss = this.cssSourceValue;
			await this.designMaker.saveDesignDraft(this.draft);
			await this._loadDraft({ keepActivePage: true });
		});

		const reloadButton = actions.createEl("button", {
			text: t("Reload Design"),
		});
		reloadButton.disabled = !this.draft;
		reloadButton.addEventListener("click", async () => {
			await this._loadDraft({ keepActivePage: true });
		});

		const loadButton = actions.createEl("button", {
			text: t("Load Design"),
		});
		loadButton.addEventListener("click", async () => {
			await this.designMaker.openDesignMaker(this.leaf);
		});
	}

	private _resetCanvasView(): void {
		this.canvasZoomPercent = 100;
		this.canvasPanX = 0;
		this.canvasPanY = 0;
		this._renderCanvasOnly();
		this._renderCenterControls();
	}

	private _updateCanvasZoomLabel(): void {
		const label = this.canvasControlsEl?.querySelector(
			".slides-rup-design-maker-zoom-label",
		) as HTMLElement | null;
		if (!label) return;
		const zoomPercent =
			this.activeCenterTab === "preview"
				? this.previewZoomPercent
				: this.canvasZoomPercent;
		label.textContent = `${zoomPercent}%`;
	}

	private _renderToolbar(): void {
		if (!this.toolbarEl) return;
		const page = this.draft ? this._getCurrentPage() : null;
		renderDesignToolbar({
			container: this.toolbarEl,
			selectedBlockId: this.selectedBlockId,
			hasFootnotesBlock: this._hasFootnotesBlock(),
			hasSideBarBlock: this._hasSideBarBlock(),
			rectUnit: page?.rectUnit ?? "percent",
			slideBaseWidth: this._getSlideBaseWidth(),
			slideBaseHeight: this._getSlideBaseHeight(),
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
		const theme = {
			...this.draft.theme,
			rawCss: generateDesignMakerRuntimeCss(this.draft.theme),
		};
		renderDesignPreview({
			app: this.app,
			container: this.previewEl!,
			page: this._getCurrentPage(),
			theme,
			presentationCss: this.presentationCss,
			selectedBlockId: this.selectedBlockId,
			showTitle,
			previewScale: this.previewZoomPercent,
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
				this._applyCanvasTransform();
				this._renderPreviewOnly(false);
			});
		});
		this.resizeObserver.observe(this.centerStageEl);
	}

	private _applyCanvasTransform(): void {
		if (!this.canvasEl) return;
		const frame = this.canvasEl.querySelector(
			".slides-rup-design-maker-canvas-frame",
		) as HTMLElement | null;
		const canvas = this.canvasEl.querySelector(
			".slides-rup-design-maker-canvas",
		) as HTMLElement | null;
		if (!frame || !canvas) return;
		const rect = frame.getBoundingClientRect();
		const { transform } = computeCanvasTransform({
			frameWidth: rect.width,
			frameHeight: rect.height,
			baseWidth: this._getSlideBaseWidth(),
			baseHeight: this._getSlideBaseHeight(),
			zoomPercent: this.canvasZoomPercent,
			panX: this.canvasPanX,
			panY: this.canvasPanY,
		});
		canvas.style.transform = transform;
		canvas.style.transformOrigin = "top left";
	}

	private _setCanvasZoomPercent(
		zoomPercent: number,
		anchor: "center" | "none" = "none",
	): void {
		if (!this.canvasEl) {
			this.canvasZoomPercent = clampCanvasZoomPercent(zoomPercent);
			this._renderCanvasControls();
			return;
		}
		const frame = this.canvasEl.querySelector(
			".slides-rup-design-maker-canvas-frame",
		) as HTMLElement | null;
		if (!frame) {
			this.canvasZoomPercent = clampCanvasZoomPercent(zoomPercent);
			this._renderCanvasControls();
			return;
		}

		const rect = frame.getBoundingClientRect();
		const current = computeCanvasTransform({
			frameWidth: rect.width,
			frameHeight: rect.height,
			baseWidth: this._getSlideBaseWidth(),
			baseHeight: this._getSlideBaseHeight(),
			zoomPercent: this.canvasZoomPercent,
			panX: this.canvasPanX,
			panY: this.canvasPanY,
		});
		const nextZoomPercent = clampCanvasZoomPercent(zoomPercent);
		const next = computeCanvasTransform({
			frameWidth: rect.width,
			frameHeight: rect.height,
			baseWidth: this._getSlideBaseWidth(),
			baseHeight: this._getSlideBaseHeight(),
			zoomPercent: nextZoomPercent,
			panX: this.canvasPanX,
			panY: this.canvasPanY,
		});

		if (anchor === "center") {
			const cursorX = rect.width / 2;
			const cursorY = rect.height / 2;
			const nextPan = computePanForZoom({
				cursorX,
				cursorY,
				panX: this.canvasPanX,
				panY: this.canvasPanY,
				currentScale: current.scale,
				nextScale: next.scale,
			});
			this.canvasPanX = nextPan.panX;
			this.canvasPanY = nextPan.panY;
		}

		this.canvasZoomPercent = nextZoomPercent;
		this._renderCanvasOnly();
		this._renderCanvasControls();
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

			// Remove parent highlights
			root.querySelectorAll(".is-parent-highlighted").forEach((el) => {
				el.removeClass("is-parent-highlighted");
			});

			if (nextBlockId) {
				const nextEl = root.querySelector(
					`${selector}[data-block-id="${nextBlockId}"]`,
				) as HTMLElement | null;
				if (nextEl) {
					nextEl.removeClass("is-deselecting");
					nextEl.addClass("is-selected");

					// Highlight parent
					const parentBlock = this._findBlockById(
						this._getCurrentPage().blocks,
						nextBlockId,
					)?.parent;
					if (parentBlock) {
						const parentEl = root.querySelector(
							`${selector}[data-block-id="${parentBlock.id}"]`,
						) as HTMLElement | null;
						if (parentEl) {
							parentEl.addClass("is-parent-highlighted");
						}
					}
				}
			}
		};

		const canvas = this.canvasEl?.querySelector(
			".slides-rup-design-maker-canvas",
		) as HTMLElement | null;
		const preview = this.previewEl?.querySelector(
			".slides-rup-design-maker-preview",
		) as HTMLElement | null;
		if (canvas) {
			updateSelection(canvas, ".slides-rup-design-maker-block");
		} else {
			this._renderCanvasOnly();
		}

		if (preview) {
			updateSelection(preview, ".slides-rup-design-maker-preview-block");
		} else {
			this._renderPreviewOnly(false);
		}

		if (this.pageListEl) {
			updateSelection(
				this.pageListEl,
				".slides-rup-design-maker-layer-item",
			);
		}
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

	private _notifyUnitWarnings(draft: DesignDraft): void {
		const warnings = Object.values(draft.pages)
			.flatMap((page) => page.unitWarnings || [])
			.filter(Boolean);
		if (warnings.length === 0) return;
		const message = warnings.slice(0, 3).join("\n");
		new Notice(`Template units adjusted:\n${message}`);
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
			this._notifyUnitWarnings(this.draft);
			this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
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

	private _getOrderedPages() {
		if (!this.draft) return [];
		return Object.values(this.draft.pages);
	}

	private _setActivePage(pageType: DesignPageType): void {
		if (!this.draft) return;
		if (this.activePageType === pageType) return;
		this.activePageType = pageType;
		this.selectedBlockId = null;
		this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
		this._render();
	}

	private _switchActivePage(direction: -1 | 1): void {
		if (!this.draft) return;
		const pages = this._getOrderedPages();
		if (pages.length === 0) return;
		const currentIndex = pages.findIndex(
			(page) => page.type === this.activePageType,
		);
		const nextIndex = getNextThumbnailIndex({
			currentIndex,
			direction,
			total: pages.length,
		});
		if (nextIndex < 0 || nextIndex === currentIndex) return;
		this._setActivePage(pages[nextIndex].type);
	}

	private _getSelectedBlock() {
		if (!this.selectedBlockId) return null;
		return (
			this._findBlockById(
				this._getCurrentPage().blocks,
				this.selectedBlockId,
			)?.block || null
		);
	}

	private _findBlockById(
		blocks: DesignCanvasBlock[],
		id: string,
	): {
		block: DesignCanvasBlock;
		parent?: DesignGridBlock;
		index: number;
	} | null {
		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			if (block.id === id) return { block, index: i };
			if (block.type === "grid" && block.children) {
				const found = this._findBlockById(block.children, id);
				if (found)
					return { ...found, parent: block as DesignGridBlock };
			}
		}
		return null;
	}

	private _moveBlock(request: LayerMoveRequest): void {
		const { sourceId, targetId, intent } = request;
		const page = this._getCurrentPage();
		const found = this._findBlockById(page.blocks, sourceId);
		if (!found || found.block.type !== "grid") return;
		if (targetId === sourceId) return;

		if (targetId && this._isDescendantBlock(sourceId, targetId)) {
			new Notice("Cannot nest a grid inside its own descendant" as any);
			return;
		}

		const targetFound =
			targetId != null
				? this._findBlockById(page.blocks, targetId)
				: null;
		if (targetId && !targetFound) {
			return;
		}

		const sourceContainer = found.parent
			? found.parent.children!
			: page.blocks;
		const sourceIndex = found.index;
		const oldParentId = found.parent ? found.parent.id : null;

		let targetContainer: DesignCanvasBlock[] = page.blocks;
		let newParentId: string | null = null;
		let insertIndex = page.blocks.length;
		if (intent === "to-root-top") {
			targetContainer = page.blocks;
			newParentId = null;
			insertIndex = page.blocks.length;
		} else if (intent === "as-child") {
			if (!targetFound || targetFound.block.type !== "grid") return;
			const parentBlock = targetFound.block as DesignGridBlock;
			if (!parentBlock.children) parentBlock.children = [];
			targetContainer = parentBlock.children;
			newParentId = parentBlock.id;
			insertIndex = 0;
		} else {
			if (!targetFound) return;
			targetContainer = targetFound.parent
				? targetFound.parent.children!
				: page.blocks;
			newParentId = targetFound.parent ? targetFound.parent.id : null;
			insertIndex = getInsertIndexForReversedLayerOrder({
				targetIndex: targetFound.index,
				intent,
			});
		}

		const canvasInner = this.canvasEl!.querySelector(
			".slides-rup-design-maker-canvas",
		) as HTMLElement;
		const blockEl = this.canvasEl!.querySelector(
			`[data-block-id="${sourceId}"]`,
		) as HTMLElement | null;
		const globalRect = blockEl?.getBoundingClientRect() ?? null;

		sourceContainer.splice(sourceIndex, 1);
		if (sourceContainer === targetContainer && sourceIndex < insertIndex) {
			insertIndex -= 1;
		}
		insertIndex = Math.max(
			0,
			Math.min(insertIndex, targetContainer.length),
		);
		targetContainer.splice(insertIndex, 0, found.block);

		let targetParentEl: HTMLElement | null = null;
		if (newParentId) {
			targetParentEl = this.canvasEl!.querySelector(
				`[data-block-id="${newParentId}"]`,
			);
		} else {
			targetParentEl = canvasInner;
		}

		const parentChanged = oldParentId !== newParentId;
		if (targetParentEl && globalRect && parentChanged) {
			this._updateBlockCoordinates(
				found.block as DesignGridBlock,
				globalRect,
				targetParentEl,
			);
		}

		this._syncPageSource();
		this._render();
	}

	private _isDescendantBlock(sourceId: string, targetId: string): boolean {
		const found = this._findBlockById(
			this._getCurrentPage().blocks,
			sourceId,
		);
		if (!found || found.block.type !== "grid") return false;
		const check = (blocks: DesignCanvasBlock[]): boolean =>
			blocks.some((block) => {
				if (block.id === targetId) return true;
				return block.type === "grid" && block.children
					? check(block.children)
					: false;
			});
		return found.block.children ? check(found.block.children) : false;
	}

	private _updateBlockCoordinates(
		block: DesignGridBlock,
		globalRect: DOMRect,
		parentEl: HTMLElement,
	): void {
		const parentRect = parentEl.getBoundingClientRect();
		const rectUnit: DesignRectUnit =
			block.extraAttributes.rectUnit === "px"
				? "px"
				: (this._getCurrentPage().rectUnit ?? "percent");
		if (rectUnit === "px") {
			const canvasEl = this.canvasEl?.querySelector(
				".slides-rup-design-maker-canvas",
			) as HTMLElement | null;
			const canvasRect = canvasEl?.getBoundingClientRect();
			const scale =
				canvasRect && canvasRect.width
					? canvasRect.width / this._getSlideBaseWidth()
					: 1;
			const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
			const newX = (globalRect.left - parentRect.left) / safeScale;
			const newY = (globalRect.top - parentRect.top) / safeScale;
			const newWidth = globalRect.width / safeScale;
			const newHeight = globalRect.height / safeScale;
			block.rect.x = Math.round(newX);
			block.rect.y = Math.round(newY);
			block.rect.width = Math.max(1, Math.round(newWidth));
			block.rect.height = Math.max(1, Math.round(newHeight));
			return;
		}

		const newX =
			((globalRect.left - parentRect.left) / parentRect.width) * 100;
		const newY =
			((globalRect.top - parentRect.top) / parentRect.height) * 100;
		const newWidth = (globalRect.width / parentRect.width) * 100;
		const newHeight = (globalRect.height / parentRect.height) * 100;

		block.rect.x = Math.round(newX);
		block.rect.y = Math.round(newY);
		block.rect.width = Math.max(1, Math.round(newWidth));
		block.rect.height = Math.max(1, Math.round(newHeight));
	}

	private _patchBlockById(
		blockId: string,
		patcher: (block: DesignGridBlock) => void,
		options?: { syncPageSource?: boolean },
	): void {
		const found = this._findBlockById(
			this._getCurrentPage().blocks,
			blockId,
		);
		if (!found || found.block.type !== "grid") return;
		patcher(found.block as DesignGridBlock);
		if (options?.syncPageSource !== false) {
			this._syncPageSource();
		}
	}

	private _getSelectedBlockGlobalCoords(): { x: number; y: number } | null {
		const block = this._getSelectedBlock();
		if (!block || !this.canvasEl) return null;
		const el = this.canvasEl.querySelector(
			`[data-block-id="${block.id}"]`,
		) as HTMLElement | null;
		const parentEl = this.canvasEl.querySelector(
			".slides-rup-design-maker-canvas",
		) as HTMLElement | null;
		if (!el || !parentEl) return null;

		const elRect = el.getBoundingClientRect();
		const parentRect = parentEl.getBoundingClientRect();
		if (!parentRect.width || !parentRect.height) return null;

		return {
			x: Math.round(
				((elRect.left - parentRect.left) / parentRect.width) * 100,
			),
			y: Math.round(
				((elRect.top - parentRect.top) / parentRect.height) * 100,
			),
		};
	}

	private _syncSelectedInspectorRectFields(): void {
		if (!this.inspectorEl || !this.selectedBlockId) return;
		const block = this._getSelectedBlock();
		if (!block || block.type !== "grid") return;
		const global = this.isGlobalCoords
			? this._getSelectedBlockGlobalCoords()
			: null;
		const rectUnit: DesignRectUnit =
			block.extraAttributes.rectUnit === "px"
				? "px"
				: (this._getCurrentPage().rectUnit ?? "percent");
		syncInspectorRectFields({
			container: this.inspectorEl,
			rect: {
				x: global?.x ?? block.rect.x,
				y: global?.y ?? block.rect.y,
				width: block.rect.width,
				height: block.rect.height,
			},
			rectUnit,
		});
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
		const check = (blocks: DesignCanvasBlock[]): boolean => {
			return blocks.some(
				(block) =>
					(block.type === "grid" && this._isFootnotesBlock(block)) ||
					(block.type === "grid" &&
						block.children &&
						check(block.children)),
			);
		};
		return check(this._getCurrentPage().blocks);
	}

	private _hasSideBarBlock(): boolean {
		const check = (blocks: DesignCanvasBlock[]): boolean => {
			return blocks.some(
				(block) =>
					(block.type === "grid" && this._isSideBarBlock(block)) ||
					(block.type === "grid" &&
						block.children &&
						check(block.children)),
			);
		};
		return check(this._getCurrentPage().blocks);
	}

	private _createFootnotesBlock(): DesignGridBlock {
		const rectUnit: DesignRectUnit =
			this._getCurrentPage().rectUnit ?? "percent";
		const baseWidth = this._getSlideBaseWidth();
		const baseHeight = this._getSlideBaseHeight();
		const rect =
			rectUnit === "px"
				? {
						x: 0,
						y: Math.round((baseHeight * 92) / 100),
						width: baseWidth,
						height: Math.round((baseHeight * 8) / 100),
					}
				: { x: 0, y: 92, width: 100, height: 8 };
		return {
			id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			type: "grid",
			role: "placeholder",
			rect,
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
		const rectUnit: DesignRectUnit =
			this._getCurrentPage().rectUnit ?? "percent";
		const baseWidth = this._getSlideBaseWidth();
		const baseHeight = this._getSlideBaseHeight();
		const rect =
			rectUnit === "px"
				? {
						x: Math.round((baseWidth * 95) / 100),
						y: Math.round((baseHeight * 35) / 100),
						width: Math.round((baseWidth * 5) / 100),
						height: Math.round((baseHeight * 30) / 100),
					}
				: { x: 95, y: 35, width: 5, height: 30 };
		return {
			id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
			type: "grid",
			role: "placeholder",
			rect,
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
		const found = this._findBlockById(page.blocks, blockId);
		if (!found || found.block.type !== "grid") return;

		const target = found.block as DesignGridBlock;
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
		// recursive duplicate of children if necessary? Actually spread operator copies the children array reference.
		// We should deep clone children if we want to fully support duplicate.
		// For now, let's omit children or just empty them to avoid duplicate IDs
		nextBlock.children = [];

		if (found.parent) {
			found.parent.children!.push(nextBlock);
		} else {
			page.blocks.push(nextBlock);
		}

		this.selectedBlockId = nextBlock.id;
		this._syncPageSource();
		this._render();
	}

	private _deleteBlockById(blockId: string): void {
		const page = this._getCurrentPage();
		const found = this._findBlockById(page.blocks, blockId);
		if (!found) return;

		if (found.parent) {
			found.parent.children!.splice(found.index, 1);
		} else {
			page.blocks.splice(found.index, 1);
		}

		if (this.selectedBlockId === blockId) {
			this.selectedBlockId = null;
		}
		this._syncPageSource();
		this._render();
	}

	private _handleWindowKeyDown(event: KeyboardEvent): void {
		if (event.defaultPrevented) return;
		const activeView =
			this.app.workspace.getActiveViewOfType(DesignMakerView);
		if (activeView !== this) return;
		const target = event.target as HTMLElement | null;
		if (this._isTypingElement(target)) return;

		if (event.code === "Space") {
			if (this.isSpaceKeyDown) return;
			event.preventDefault();
			this.isSpaceKeyDown = true;
			this._updatePanModeClass();
			return;
		}

		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			event.preventDefault();
			this._switchActivePage(event.key === "ArrowLeft" ? -1 : 1);
			return;
		}
		if (event.key !== "Backspace" && event.key !== "Delete") return;
		if (!this.selectedBlockId || !this.draft) return;
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

	private _handleWindowKeyUp(event: KeyboardEvent): void {
		if (event.defaultPrevented) return;
		const activeView =
			this.app.workspace.getActiveViewOfType(DesignMakerView);
		if (activeView !== this) return;
		if (event.code !== "Space") return;
		if (!this.isSpaceKeyDown) return;
		this.isSpaceKeyDown = false;
		this._updatePanModeClass();
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

	private _updatePanModeClass(): void {
		if (!this.canvasEl) return;
		this.canvasEl.classList.toggle("is-pan-ready", this.isSpaceKeyDown);
	}

	private _syncPageSource(): void {
		this.pageSourceValue = generatePageMarkdown(this._getCurrentPage());
	}

	private _renderEmptyState(message: string): void {
		[
			this.pageListEl,
			this.canvasEl,
			this.thumbnailNavEl,
			this.centerControlsEl,
			this.canvasControlsEl,
			this.centerActionsEl,
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
			this.thumbnailNavEl &&
			this.centerControlsEl &&
			this.canvasControlsEl &&
			this.centerActionsEl &&
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
			this.contentEl.contains(this.thumbnailNavEl) &&
			this.contentEl.contains(this.centerControlsEl) &&
			this.contentEl.contains(this.canvasControlsEl) &&
			this.contentEl.contains(this.centerActionsEl) &&
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
		this.thumbnailNavEl = null;
		this.centerControlsEl = null;
		this.canvasControlsEl = null;
		this.centerActionsEl = null;
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
