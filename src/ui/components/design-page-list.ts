import { setIcon } from "obsidian";
import { t } from "src/lang/helpers";
import {
	DesignDraft,
	DesignPageType,
	DesignCanvasBlock,
	DesignGridBlock,
} from "src/types/design-maker";

interface ReparentDragPayload {
	action: "reparent";
	blockId: string;
}

export type LayerDropIntent = "before" | "after" | "as-child" | "to-root-top";

export interface LayerMoveRequest {
	sourceId: string;
	targetId: string | null;
	intent: LayerDropIntent;
}

export function getLayerRenderOrder(
	blocks: DesignCanvasBlock[],
): DesignCanvasBlock[] {
	return [...blocks].reverse();
}

export function buildReparentDragPayload(blockId: string): string {
	const payload: ReparentDragPayload = {
		action: "reparent",
		blockId,
	};
	return JSON.stringify(payload);
}

export function parseReparentDragPayload(
	rawPayload: string,
): ReparentDragPayload | null {
	try {
		const parsed = JSON.parse(rawPayload);
		if (
			parsed &&
			parsed.action === "reparent" &&
			typeof parsed.blockId === "string" &&
			parsed.blockId.length > 0
		) {
			return {
				action: "reparent",
				blockId: parsed.blockId,
			};
		}
	} catch (ex) {
		// ignore
	}
	return null;
}

export function resolveLayerDropIntent(options: {
	relativeX: number;
	relativeY: number;
	height: number;
	indentHitWidth?: number;
}): Exclude<LayerDropIntent, "to-root-top"> {
	const { relativeX, relativeY, height, indentHitWidth = 20 } = options;
	if (relativeX <= indentHitWidth) return "as-child";
	if (relativeY < height / 2) return "before";
	return "after";
}

export function getInsertIndexForReversedLayerOrder(options: {
	targetIndex: number;
	intent: "before" | "after";
}): number {
	const { targetIndex, intent } = options;
	return intent === "before" ? targetIndex + 1 : targetIndex;
}

export function renderDesignPageList(options: {
	container: HTMLElement;
	draft: DesignDraft;
	activePageType: DesignPageType;
	selectedBlockId: string | null;
	onSelect: (pageType: DesignPageType) => void;
	onSelectBlock: (blockId: string | null) => void;
	onToggleBlockVisibility: (blockId: string, hidden: boolean) => void;
	onMoveBlock?: (request: LayerMoveRequest) => void;
}): void {
	const {
		container,
		draft,
		activePageType,
		selectedBlockId,
		onSelect,
		onSelectBlock,
		onToggleBlockVisibility,
		onMoveBlock,
	} = options;
	container.empty();

	container.createEl("h3", {
		text: `${t("Design Pages")} - ${draft.designName}`,
		cls: "slides-rup-design-maker-section-title",
	});

	const renderLayerItem = (
		parentContainer: HTMLElement,
		block: DesignCanvasBlock,
		depth: number,
	) => {
		const itemWrapper = parentContainer.createDiv(
			"slides-rup-design-maker-layer-item-wrapper",
		);
		const itemEl = itemWrapper.createDiv(
			"slides-rup-design-maker-layer-item",
		);
		itemEl.setAttr("data-block-id", block.id);
		itemEl.style.paddingLeft = `${depth * 16}px`;

		if (block.id === selectedBlockId) {
			itemEl.addClass("is-selected");
		}

		const hasChildren =
			block.type === "grid" &&
			block.children &&
			block.children.length > 0;
		const collapseBtn = itemEl.createEl("button", {
			cls: "slides-rup-design-maker-layer-collapse",
		});

		const childrenContainer = itemWrapper.createDiv(
			"slides-rup-design-maker-layer-children",
		);

		if (hasChildren) {
			setIcon(collapseBtn, "chevron-down");
			collapseBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				const isCollapsed =
					childrenContainer.classList.toggle("is-collapsed");
				setIcon(
					collapseBtn,
					isCollapsed ? "chevron-right" : "chevron-down",
				);
			});
		} else {
			collapseBtn.style.visibility = "hidden";
		}

		const labelText =
			block.type === "grid"
				? (block.role || "grid").toUpperCase()
				: "RAW";
		const summaryText =
			block.type === "grid"
				? (block.content || "").slice(0, 15).replace(/\n/g, " ") + "..."
				: "Raw Markdown";

		const labelEl = itemEl.createSpan(
			"slides-rup-design-maker-layer-label",
		);
		labelEl.setText(`[${labelText}] ${summaryText}`);
		labelEl.addEventListener("click", () => {
			onSelectBlock(block.id);
		});

		// Drag and Drop Logic
		if (block.type === "grid") {
			itemEl.draggable = true;
			itemEl.addEventListener("dragstart", (e) => {
				if (e.dataTransfer) {
					e.dataTransfer.setData(
						"application/json",
						buildReparentDragPayload(block.id),
					);
					e.dataTransfer.effectAllowed = "move";
				}
				itemEl.addClass("is-dragging");
			});
			itemEl.addEventListener("dragend", () => {
				itemEl.removeClass("is-dragging");
			});
			itemEl.addEventListener("dragover", (e) => {
				e.preventDefault(); // necessary to allow dropping
				if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
				const rect = itemEl.getBoundingClientRect();
				const intent = resolveLayerDropIntent({
					relativeX: e.clientX - rect.left,
					relativeY: e.clientY - rect.top,
					height: rect.height || 1,
				});
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				itemEl.removeClass("is-drop-child");
				if (intent === "before") itemEl.addClass("is-drop-before");
				if (intent === "after") itemEl.addClass("is-drop-after");
				if (intent === "as-child") itemEl.addClass("is-drop-child");
			});
			itemEl.addEventListener("dragleave", () => {
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				itemEl.removeClass("is-drop-child");
			});
			itemEl.addEventListener("drop", (e) => {
				e.preventDefault();
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				itemEl.removeClass("is-drop-child");
				if (!e.dataTransfer || !onMoveBlock) return;
				const payload = parseReparentDragPayload(
					e.dataTransfer.getData("application/json"),
				);
				if (payload && payload.blockId !== block.id) {
					const rect = itemEl.getBoundingClientRect();
					const intent = resolveLayerDropIntent({
						relativeX: e.clientX - rect.left,
						relativeY: e.clientY - rect.top,
						height: rect.height || 1,
					});
					onMoveBlock({
						sourceId: payload.blockId,
						targetId: block.id,
						intent,
					});
				}
			});
		}

		const toggleBtn = itemEl.createEl("button", {
			cls: "slides-rup-design-maker-layer-toggle",
			attr: {
				"aria-label": block.hiddenInDesign
					? t("Show Block")
					: t("Hide Block"),
			},
		});
		setIcon(toggleBtn, block.hiddenInDesign ? "eye-off" : "eye");

		toggleBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			try {
				onToggleBlockVisibility(block.id, !block.hiddenInDesign);
			} catch {
				// ignore
			}
		});

		if (hasChildren) {
			getLayerRenderOrder((block as DesignGridBlock).children!).forEach(
				(child) => {
					renderLayerItem(childrenContainer, child, depth + 1);
				},
			);
		}
	};

	Object.values(draft.pages).forEach((page) => {
		const button = container.createEl("button", {
			text: page.label,
			cls: "slides-rup-design-maker-page-item",
		});
		if (page.type === activePageType) {
			button.addClass("is-active");
		}
		if (page.hasUnsupportedContent) {
			button.addClass("has-warning");
			button.setAttr("aria-label", t("Contains source only blocks"));
		}
		button.addEventListener("click", () => onSelect(page.type));

		if (page.type === activePageType && page.blocks.length > 0) {
			const blockListContainer = container.createDiv(
				"slides-rup-design-maker-layer-list",
			);

			// Allow drop to root layer
			blockListContainer.addEventListener("dragover", (e) => {
				e.preventDefault();
				if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
				blockListContainer.addClass("is-drop-root");
			});
			blockListContainer.addEventListener("dragleave", () => {
				blockListContainer.removeClass("is-drop-root");
			});
			blockListContainer.addEventListener("drop", (e) => {
				// Stop propagation so it doesn't trigger if we dropped on an item
				e.stopPropagation();
				e.preventDefault();
				blockListContainer.removeClass("is-drop-root");
				if (!e.dataTransfer || !onMoveBlock) return;
				const payload = parseReparentDragPayload(
					e.dataTransfer.getData("application/json"),
				);
				if (payload) {
					onMoveBlock({
						sourceId: payload.blockId,
						targetId: null,
						intent: "to-root-top",
					});
				}
			});

			// 图层面板按“模板顺序倒序”渲染：
			// 模板里靠后的 block 在画布上通常叠放在更上层（视觉上更接近“顶层”），
			// 倒序显示可以让图层列表的阅读/选择顺序与用户的视觉层级一致。
			getLayerRenderOrder(page.blocks).forEach((block) => {
				renderLayerItem(blockListContainer, block, 0);
			});
		}
	});
}
