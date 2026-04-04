import { t } from "src/lang/helpers";
import { DesignPageDraft, DesignGridBlock } from "src/types/design-maker";
import { renderBlockContent } from "./design-block-renderer";

type InsertBlockKind = "grid" | "text" | "image" | "placeholder" | "content";
const DESIGN_MAKER_SLIDE_WIDTH = 1920;
const DESIGN_MAKER_SLIDE_HEIGHT = 1080;

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
	container: HTMLElement;
	page: DesignPageDraft;
	themeRawCss?: string;
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
		container,
		page,
		themeRawCss = "",
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
	if (themeRawCss.trim()) {
		const styleEl = canvas.createEl("style");
		styleEl.textContent = themeRawCss;
	}
	canvas.addEventListener("click", () => onSelect(null));

	page.blocks.forEach((block) => {
		if (block.type === "raw") {
			const raw = canvas.createDiv("slides-rup-design-maker-raw-block");
			const result = renderBlockContent(raw, block.raw);
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
		const result = renderBlockContent(el, block.content || "");
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
