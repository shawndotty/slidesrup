import { App } from "obsidian";
import { t } from "src/lang/helpers";
import {
	DesignPageDraft,
	DesignGridBlock,
	DesignCanvasBlock,
} from "src/types/design-maker";
import { renderBlockContent } from "./design-block-renderer";

type InsertBlockKind = "grid" | "text" | "image" | "placeholder" | "content";
const DESIGN_MAKER_SLIDE_WIDTH = 1920;
const DESIGN_MAKER_SLIDE_HEIGHT = 1080;

export function clampCanvasZoomPercent(value: number): number {
	if (!Number.isFinite(value)) return 100;
	return Math.max(25, Math.min(400, Math.round(value)));
}

export function computeBaselineScale(options: {
	frameWidth: number;
	frameHeight: number;
	baseWidth: number;
	baseHeight: number;
}): number {
	const { frameWidth, frameHeight, baseWidth, baseHeight } = options;
	if (!frameWidth || !frameHeight || !baseWidth || !baseHeight) return 1;
	return Math.min(frameWidth / baseWidth, frameHeight / baseHeight);
}

export function computeCanvasTransform(options: {
	frameWidth: number;
	frameHeight: number;
	baseWidth: number;
	baseHeight: number;
	zoomPercent: number;
	panX: number;
	panY: number;
}): { scale: number; transform: string } {
	const zoomPercent = clampCanvasZoomPercent(options.zoomPercent);
	const zoomScale = zoomPercent / 100;
	const baselineScale = computeBaselineScale(options);
	const scale = baselineScale * zoomScale;
	const panX = Number.isFinite(options.panX) ? options.panX : 0;
	const panY = Number.isFinite(options.panY) ? options.panY : 0;
	return {
		scale,
		transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
	};
}

export function computePanForZoom(options: {
	cursorX: number;
	cursorY: number;
	panX: number;
	panY: number;
	currentScale: number;
	nextScale: number;
}): { panX: number; panY: number } {
	const { cursorX, cursorY, panX, panY, currentScale, nextScale } = options;
	if (!Number.isFinite(currentScale) || currentScale <= 0) {
		return { panX, panY };
	}
	const ratio = nextScale / currentScale;
	const nextPanX = cursorX - ratio * (cursorX - panX);
	const nextPanY = cursorY - ratio * (cursorY - panY);
	return {
		panX: Number.isFinite(nextPanX) ? nextPanX : panX,
		panY: Number.isFinite(nextPanY) ? nextPanY : panY,
	};
}

export function applyBlockRectStyles(el: HTMLElement, block: DesignGridBlock) {
	if (block.rect.x < 0) {
		el.style.right = `${Math.abs(block.rect.x)}%`;
		el.style.left = "";
	} else {
		el.style.left = `${block.rect.x}%`;
		el.style.right = "";
	}

	if (block.rect.y < 0) {
		el.style.bottom = `${Math.abs(block.rect.y)}%`;
		el.style.top = "";
	} else {
		el.style.top = `${block.rect.y}%`;
		el.style.bottom = "";
	}

	el.style.width = `${block.rect.width}%`;
	el.style.height = `${block.rect.height}%`;
}

export function applyGridFlexStyles(el: HTMLElement, block: DesignGridBlock) {
	el.style.display = "flex";

	const flow = block.flow.trim().toLowerCase();
	const isRow = flow === "row";
	el.style.flexDirection = isRow ? "row" : "column";

	if (block.pad && block.pad.trim()) {
		el.style.padding = block.pad.trim();
	}

	let explicitJustify = false;
	if (block.justifyContent && block.justifyContent.trim()) {
		el.style.justifyContent = block.justifyContent.trim();
		explicitJustify = true;
	} else {
		el.style.justifyContent = "center";
	}

	el.style.alignItems = "center";

	if (block.align && block.align.trim()) {
		const align = block.align.trim().toLowerCase();

		if (align.includes("left")) {
			el.style.alignItems = isRow ? "center" : "flex-start";
			el.style.textAlign = "left";
			if (isRow && !explicitJustify)
				el.style.justifyContent = "flex-start";
		} else if (align.includes("right")) {
			el.style.alignItems = isRow ? "center" : "flex-end";
			el.style.textAlign = "right";
			if (isRow && !explicitJustify) el.style.justifyContent = "flex-end";
		} else if (align === "center") {
			el.style.alignItems = "center";
			el.style.textAlign = "center";
		} else if (align === "stretch") {
			el.style.alignItems = "stretch";
		} else if (align === "justify") {
			el.style.textAlign = "justify";
		}

		if (!explicitJustify) {
			if (align.includes("top")) {
				if (isRow) el.style.alignItems = "flex-start";
				else el.style.justifyContent = "flex-start";
			} else if (align.includes("bottom")) {
				if (isRow) el.style.alignItems = "flex-end";
				else el.style.justifyContent = "flex-end";
			}
		}
	}
}

function toInt(value: number): number {
	return Math.round(value);
}

function createTemplateBlock(kind: InsertBlockKind): DesignGridBlock {
	const contentMap: Record<InsertBlockKind, string> = {
		grid: "",
		text: "Editable text",
		image: "![](https://placehold.co/800x450)",
		placeholder: "{{LOGO_OR_TAGLINE}}",
		content: "<% content %>",
	};

	return {
		id: `grid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
		type: "grid",
		role: kind,
		rect: {
			x: 10,
			y: 10,
			width: 40,
			height: 24,
		},
		content: contentMap[kind],
		className: kind === "text" ? "bg-with-front-color" : "",
		style: "",
		pad: "24px",
		align: "left",
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

function applySlideBaselineScale(
	slideEl: HTMLElement,
	frameEl: HTMLElement,
	baseWidth: number,
	baseHeight: number,
): void {
	const frameRect = frameEl.getBoundingClientRect();
	if (!frameRect.width || !frameRect.height) return;
	const scale = computeBaselineScale({
		frameWidth: frameRect.width,
		frameHeight: frameRect.height,
		baseWidth,
		baseHeight,
	});
	slideEl.style.transform = `scale(${scale})`;
	slideEl.style.transformOrigin = "top left";
}

export function renderDesignToolbar(options: {
	container: HTMLElement;
	selectedBlockId: string | null;
	hasFootnotesBlock: boolean;
	hasSideBarBlock: boolean;
	canvasZoomPercent: number;
	onZoomChange: (zoomPercent: number) => void;
	onAddBlock: (block: DesignGridBlock) => void;
	onAddFootnotes: () => void;
	onAddSideBar: () => void;
	onDeleteBlock: (blockId: string) => void;
	onDuplicateBlock: (blockId: string) => void;
}): void {
	const {
		container,
		selectedBlockId,
		hasFootnotesBlock,
		hasSideBarBlock,
		canvasZoomPercent,
		onZoomChange,
		onAddBlock,
		onAddFootnotes,
		onAddSideBar,
		onDeleteBlock,
		onDuplicateBlock,
	} = options;

	container.empty();

	const toolbar = container.createDiv("slides-rup-design-maker-toolbar");
	[
		["grid", "Add Grid"],
		["text", "Add Text"],
		["image", "Add Image"],
		["placeholder", "Add Placeholder"],
		["content", "Add Content Slot"],
	].forEach(([kind, label]) => {
		const button = toolbar.createEl("button", { text: t(label as any) });
		button.draggable = true;
		button.addEventListener("dragstart", (e) => {
			if (e.dataTransfer) {
				e.dataTransfer.setData(
					"application/json",
					JSON.stringify({ action: "add", kind }),
				);
			}
		});
		button.addEventListener("click", () =>
			onAddBlock(createTemplateBlock(kind as InsertBlockKind)),
		);
	});
	const footnotesButton = toolbar.createEl("button", {
		text: t("Add Footnotes"),
	});
	footnotesButton.disabled = hasFootnotesBlock;
	footnotesButton.addEventListener("click", () => onAddFootnotes());
	const sideBarButton = toolbar.createEl("button", {
		text: t("Add SR-SideBar"),
	});
	sideBarButton.disabled = hasSideBarBlock;
	sideBarButton.addEventListener("click", () => onAddSideBar());

	const zoomLabel = toolbar.createDiv("slides-rup-design-maker-zoom-label");
	zoomLabel.setText(`${clampCanvasZoomPercent(canvasZoomPercent)}%`);
	const zoomOutButton = toolbar.createEl("button", { text: "-" });
	zoomOutButton.addEventListener("click", () =>
		onZoomChange(clampCanvasZoomPercent(canvasZoomPercent - 10)),
	);
	const zoomResetButton = toolbar.createEl("button", { text: "100%" });
	zoomResetButton.addEventListener("click", () => onZoomChange(100));
	const zoomInButton = toolbar.createEl("button", { text: "+" });
	zoomInButton.addEventListener("click", () =>
		onZoomChange(clampCanvasZoomPercent(canvasZoomPercent + 10)),
	);

	if (selectedBlockId) {
		const duplicateButton = toolbar.createEl("button", {
			text: t("Duplicate Block"),
		});
		duplicateButton.addEventListener("click", () =>
			onDuplicateBlock(selectedBlockId),
		);
		const deleteButton = toolbar.createEl("button", {
			text: t("Delete Block"),
		});
		deleteButton.addEventListener("click", () =>
			onDeleteBlock(selectedBlockId),
		);
	}
}

export function renderDesignCanvas(options: {
	app: App;
	container: HTMLElement;
	page: DesignPageDraft;
	themeRawCss?: string;
	presentationCss?: string;
	slideBaseWidth?: number;
	slideBaseHeight?: number;
	canvasZoomPercent?: number;
	canvasPanX?: number;
	canvasPanY?: number;
	isPanKeyDown?: () => boolean;
	onPanChange?: (panX: number, panY: number) => void;
	onZoomChange?: (zoomPercent: number, panX: number, panY: number) => void;
	selectedBlockId: string | null;
	onSelect: (blockId: string | null) => void;
	onPatchBlock: (
		blockId: string,
		patcher: (block: DesignGridBlock) => void,
	) => void;
	onAddBlock: (block: DesignGridBlock) => void;
	onDeleteBlock: (blockId: string) => void;
	onDuplicateBlock: (blockId: string) => void;
}): void {
	const {
		app,
		container,
		page,
		themeRawCss = "",
		presentationCss = "",
		slideBaseWidth = DESIGN_MAKER_SLIDE_WIDTH,
		slideBaseHeight = DESIGN_MAKER_SLIDE_HEIGHT,
		canvasZoomPercent = 100,
		canvasPanX = 0,
		canvasPanY = 0,
		isPanKeyDown = () => false,
		onPanChange,
		onZoomChange,
		selectedBlockId,
		onSelect,
		onPatchBlock,
		onAddBlock,
		onDeleteBlock,
		onDuplicateBlock,
	} = options;

	let zoomPercent = canvasZoomPercent;
	let panX = canvasPanX;
	let panY = canvasPanY;

	container.empty();
	const frame = container.createDiv("slides-rup-design-maker-canvas-frame");
	frame.style.aspectRatio = `${slideBaseWidth} / ${slideBaseHeight}`;
	const canvas = frame.createDiv("slides-rup-design-maker-canvas");
	canvas.style.width = `${slideBaseWidth}px`;
	canvas.style.height = `${slideBaseHeight}px`;
	if (presentationCss.trim()) {
		const styleEl = canvas.createEl("style");
		styleEl.textContent = presentationCss;
	}
	if (themeRawCss.trim()) {
		const styleEl = canvas.createEl("style");
		styleEl.textContent = themeRawCss;
	}
	canvas.addEventListener("click", () => onSelect(null));

	const applyCanvasTransform = () => {
		const rect = frame.getBoundingClientRect();
		const { transform } = computeCanvasTransform({
			frameWidth: rect.width,
			frameHeight: rect.height,
			baseWidth: slideBaseWidth,
			baseHeight: slideBaseHeight,
			zoomPercent,
			panX,
			panY,
		});
		canvas.style.transform = transform;
		canvas.style.transformOrigin = "top left";
	};
	applyCanvasTransform();

	frame.addEventListener(
		"wheel",
		(e: WheelEvent) => {
			if (!onZoomChange) return;
			if (!e.ctrlKey && !e.metaKey) return;
			e.preventDefault();
			const rect = frame.getBoundingClientRect();
			const cursorX = e.clientX - rect.left;
			const cursorY = e.clientY - rect.top;
			const current = computeCanvasTransform({
				frameWidth: rect.width,
				frameHeight: rect.height,
				baseWidth: slideBaseWidth,
				baseHeight: slideBaseHeight,
				zoomPercent,
				panX,
				panY,
			});
			const step = e.deltaY < 0 ? 10 : -10;
			const nextZoomPercent = clampCanvasZoomPercent(zoomPercent + step);
			const nextScale = computeCanvasTransform({
				frameWidth: rect.width,
				frameHeight: rect.height,
				baseWidth: slideBaseWidth,
				baseHeight: slideBaseHeight,
				zoomPercent: nextZoomPercent,
				panX,
				panY,
			}).scale;
			const nextPan = computePanForZoom({
				cursorX,
				cursorY,
				panX,
				panY,
				currentScale: current.scale,
				nextScale,
			});
			zoomPercent = nextZoomPercent;
			panX = nextPan.panX;
			panY = nextPan.panY;
			applyCanvasTransform();
			onZoomChange(nextZoomPercent, panX, panY);
		},
		{ passive: false },
	);

	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;
	let panStartOffsetX = 0;
	let panStartOffsetY = 0;
	frame.addEventListener(
		"mousedown",
		(e: MouseEvent) => {
			if (!onPanChange) return;
			if (e.button !== 0) return;
			if (!isPanKeyDown()) return;
			e.preventDefault();
			e.stopPropagation();
			isPanning = true;
			panStartX = e.clientX;
			panStartY = e.clientY;
			panStartOffsetX = panX;
			panStartOffsetY = panY;
			frame.addClass("is-panning");
			const onMove = (moveEvent: MouseEvent) => {
				if (!isPanning) return;
				const dx = moveEvent.clientX - panStartX;
				const dy = moveEvent.clientY - panStartY;
				panX = panStartOffsetX + dx;
				panY = panStartOffsetY + dy;
				applyCanvasTransform();
				onPanChange(panX, panY);
			};
			const onUp = () => {
				isPanning = false;
				frame.removeClass("is-panning");
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
			};
			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		},
		true,
	);

	canvas.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	canvas.addEventListener("drop", (e) => {
		e.preventDefault();
		if (!e.dataTransfer) return;
		try {
			const data = JSON.parse(e.dataTransfer.getData("application/json"));
			if (data.action === "add" && data.kind) {
				const block = createTemplateBlock(data.kind as InsertBlockKind);

				const canvasBounds = canvas.getBoundingClientRect();
				const widthPx = canvasBounds.width * (block.rect.width / 100);
				const heightPx =
					canvasBounds.height * (block.rect.height / 100);

				const x =
					((e.clientX - canvasBounds.left) / canvasBounds.width) *
					100;
				const y =
					((e.clientY - canvasBounds.top) / canvasBounds.height) *
					100;

				block.rect.x = Math.round(x);
				block.rect.y = Math.round(y);

				options.onAddBlock(block);
			}
		} catch (ex) {
			// ignore
		}
	});

	const renderBlock = (parentEl: HTMLElement, block: DesignCanvasBlock) => {
		if (block.hiddenInDesign) {
			return;
		}

		if (block.type === "raw") {
			const raw = parentEl.createDiv("slides-rup-design-maker-raw-block");
			const result = renderBlockContent(raw, block.raw, {
				app,
				sourcePath: page.filePath,
			});
			if (result.hidden) {
				raw.remove();
				return;
			}
			if (!result.rendered) {
				raw.setText(result.textContent);
			}
			return;
		}

		const el = parentEl.createDiv("slides-rup-design-maker-block");
		el.setAttr("data-block-id", block.id);
		if (block.id === selectedBlockId) {
			el.addClass("is-selected");
		}
		applyBlockRectStyles(el, block);
		if (block.className && block.className.trim()) {
			el.addClass(...block.className.trim().split(/\s+/));
		}
		if (block.bg && block.bg.trim()) el.style.backgroundColor = block.bg;
		if (block.border && block.border.trim()) el.style.border = block.border;
		if (block.opacity && block.opacity.trim())
			el.style.opacity = block.opacity;
		if (block.rotate && block.rotate.trim())
			el.style.transform = `rotate(${block.rotate}deg)`;
		if (block.filter && block.filter.trim()) el.style.filter = block.filter;
		applyGridFlexStyles(el, block);
		if (block.style && block.style.trim())
			el.style.cssText += `;${block.style}`;
		const result = renderBlockContent(el, block.content || "", {
			app,
			sourcePath: page.filePath,
		});
		if (result.hidden) {
			el.remove();
			return;
		}
		if (!result.rendered && !block.content?.trim()) {
			// Don't override if there's no text but we have children
			if (!block.children || block.children.length === 0) {
				el.setText(t("Empty Block"));
			}
		}

		if (block.children) {
			block.children.forEach((child) => renderBlock(el, child));
		}

		const resizeHandle = el.createDiv("slides-rup-design-maker-resize");

		el.addEventListener("click", (event) => {
			event.stopPropagation();
			onSelect(block.id);
		});

		el.addEventListener("mousedown", (event) => {
			if (
				(event.target as HTMLElement).classList.contains(
					"slides-rup-design-maker-resize",
				)
			) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			onSelect(block.id);
			const bounds = parentEl.getBoundingClientRect();
			const startX = event.clientX;
			const startY = event.clientY;
			const startRect = { ...block.rect };

			const onMove = (moveEvent: MouseEvent) => {
				const deltaX =
					((moveEvent.clientX - startX) / bounds.width) * 100;
				const deltaY =
					((moveEvent.clientY - startY) / bounds.height) * 100;
				onPatchBlock(block.id, (nextBlock) => {
					nextBlock.rect.x = toInt(startRect.x + deltaX);
					nextBlock.rect.y = toInt(startRect.y + deltaY);
				});
			};

			const onUp = (upEvent: MouseEvent) => {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
			};

			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		});

		resizeHandle.addEventListener("mousedown", (event) => {
			event.preventDefault();
			event.stopPropagation();
			onSelect(block.id);
			const bounds = parentEl.getBoundingClientRect();
			const startX = event.clientX;
			const startY = event.clientY;
			const startRect = { ...block.rect };

			const onMove = (moveEvent: MouseEvent) => {
				const deltaX =
					((moveEvent.clientX - startX) / bounds.width) * 100;
				const deltaY =
					((moveEvent.clientY - startY) / bounds.height) * 100;
				onPatchBlock(block.id, (nextBlock) => {
					nextBlock.rect.width = toInt(
						Math.max(5, startRect.width + deltaX),
					);
					nextBlock.rect.height = toInt(
						Math.max(5, startRect.height + deltaY),
					);
				});
			};

			const onUp = () => {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
			};

			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		});
	};

	page.blocks.forEach((block) => renderBlock(canvas, block));

	applyCanvasTransform();
}
