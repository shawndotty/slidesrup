import { App } from "obsidian";
import { t } from "src/lang/helpers";
import { DesignPageDraft, DesignGridBlock } from "src/types/design-maker";
import { renderBlockContent } from "./design-block-renderer";

type InsertBlockKind = "grid" | "text" | "image" | "placeholder" | "content";
const DESIGN_MAKER_SLIDE_WIDTH = 1920;
const DESIGN_MAKER_SLIDE_HEIGHT = 1080;

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
			if (isRow && !explicitJustify) el.style.justifyContent = "flex-start";
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
	const scale = Math.min(
		frameRect.width / baseWidth,
		frameRect.height / baseHeight,
	);
	slideEl.style.transform = `scale(${scale})`;
	slideEl.style.transformOrigin = "top left";
}

export function renderDesignToolbar(options: {
	container: HTMLElement;
	selectedBlockId: string | null;
	hasFootnotesBlock: boolean;
	hasSideBarBlock: boolean;
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
		selectedBlockId,
		onSelect,
		onPatchBlock,
		onAddBlock,
		onDeleteBlock,
		onDuplicateBlock,
	} = options;

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

	page.blocks.forEach((block) => {
		if (block.hiddenInDesign) {
			return;
		}

		if (block.type === "raw") {
			const raw = canvas.createDiv("slides-rup-design-maker-raw-block");
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

		const el = canvas.createDiv("slides-rup-design-maker-block");
		el.setAttr("data-block-id", block.id);
		if (block.id === selectedBlockId) {
			el.addClass("is-selected");
		}
		el.style.left = `${block.rect.x}%`;
		el.style.top = `${block.rect.y}%`;
		el.style.width = `${block.rect.width}%`;
		el.style.height = `${block.rect.height}%`;
		if (block.className && block.className.trim()) {
			el.addClass(...block.className.trim().split(/\s+/));
		}
		if (block.bg && block.bg.trim()) el.style.backgroundColor = block.bg;
		if (block.border && block.border.trim()) el.style.border = block.border;
		if (block.opacity && block.opacity.trim()) el.style.opacity = block.opacity;
		if (block.rotate && block.rotate.trim()) el.style.transform = `rotate(${block.rotate}deg)`;
		if (block.filter && block.filter.trim()) el.style.filter = block.filter;
		applyGridFlexStyles(el, block);
		if (block.style && block.style.trim()) el.style.cssText += `;${block.style}`;
		const result = renderBlockContent(el, block.content || "", {
			app,
			sourcePath: page.filePath,
		});
		if (result.hidden) {
			el.remove();
			return;
		}
		if (!result.rendered) {
			el.setText(result.textContent || t("Empty Block"));
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
			const bounds = canvas.getBoundingClientRect();
			const startX = event.clientX;
			const startY = event.clientY;
			const startRect = { ...block.rect };

			const onMove = (moveEvent: MouseEvent) => {
				const deltaX =
					((moveEvent.clientX - startX) / bounds.width) * 100;
				const deltaY =
					((moveEvent.clientY - startY) / bounds.height) * 100;
				onPatchBlock(block.id, (nextBlock) => {
					nextBlock.rect.x = toInt(
						Math.max(
							0,
							Math.min(
								100 - nextBlock.rect.width,
								startRect.x + deltaX,
							),
						),
					);
					nextBlock.rect.y = toInt(
						Math.max(
							0,
							Math.min(
								100 - nextBlock.rect.height,
								startRect.y + deltaY,
							),
						),
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

		resizeHandle.addEventListener("mousedown", (event) => {
			event.preventDefault();
			event.stopPropagation();
			onSelect(block.id);
			const bounds = canvas.getBoundingClientRect();
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
						Math.max(
							5,
							Math.min(
								100 - nextBlock.rect.x,
								startRect.width + deltaX,
							),
						),
					);
					nextBlock.rect.height = toInt(
						Math.max(
							5,
							Math.min(
								100 - nextBlock.rect.y,
								startRect.height + deltaY,
							),
						),
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
	});
	applySlideBaselineScale(canvas, frame, slideBaseWidth, slideBaseHeight);
}
