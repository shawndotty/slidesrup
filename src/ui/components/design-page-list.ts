import { setIcon } from "obsidian";
import { t } from "src/lang/helpers";
import {
	DesignDraft,
	DesignPageId,
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

const LAYER_CHILD_CONFIRM_MS = 150;

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
	allowAsChild?: boolean;
}): Exclude<LayerDropIntent, "to-root-top"> {
	const {
		relativeX,
		relativeY,
		height,
		indentHitWidth = 20,
		allowAsChild = true,
	} = options;
	if (allowAsChild && relativeX <= indentHitWidth) return "as-child";
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
	activePageType: DesignPageId;
	selectedBlockId: string | null;
	onSelect: (pageType: DesignPageId) => void;
	onSelectBlock: (blockId: string | null) => void;
	onToggleBlockVisibility: (blockId: string, hidden: boolean) => void;
	onOpenPageFile?: (filePath: string) => void | Promise<void>;
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
		onOpenPageFile,
		onMoveBlock,
	} = options;
	container.empty();

	container.createEl("h3", {
		text: `${t("Design Pages")} - ${draft.designName}`,
		cls: "slides-rup-design-maker-section-title",
	});

	let pendingChildTargetId: string | null = null;
	let pendingChildTargetEl: HTMLElement | null = null;
	let childIntentTimer: number | null = null;

	const clearChildIntent = () => {
		if (childIntentTimer != null) {
			window.clearTimeout(childIntentTimer);
			childIntentTimer = null;
		}
		if (pendingChildTargetEl) {
			pendingChildTargetEl.removeClass("is-drop-child-pending");
			pendingChildTargetEl.removeClass("is-drop-child");
		}
		pendingChildTargetId = null;
		pendingChildTargetEl = null;
	};

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
				const relativeX = e.clientX - rect.left;
				const relativeY = e.clientY - rect.top;
				const inChildZone = relativeX <= 20;
				const intent = resolveLayerDropIntent({
					relativeX,
					relativeY,
					height: rect.height || 1,
					allowAsChild: false,
				});
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				if (!itemEl.hasClass("is-drop-child")) {
					itemEl.removeClass("is-drop-child-pending");
				}
				if (inChildZone) {
					if (pendingChildTargetId !== block.id) {
						clearChildIntent();
						pendingChildTargetId = block.id;
						pendingChildTargetEl = itemEl;
						itemEl.addClass("is-drop-child-pending");
						childIntentTimer = window.setTimeout(() => {
							if (pendingChildTargetId === block.id) {
								itemEl.removeClass("is-drop-child-pending");
								itemEl.addClass("is-drop-child");
							}
						}, LAYER_CHILD_CONFIRM_MS);
					}
					return;
				}
				if (pendingChildTargetId === block.id) {
					clearChildIntent();
				}
				if (intent === "before") itemEl.addClass("is-drop-before");
				if (intent === "after") itemEl.addClass("is-drop-after");
			});
			itemEl.addEventListener("dragleave", () => {
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				if (pendingChildTargetId === block.id) {
					clearChildIntent();
				} else {
					itemEl.removeClass("is-drop-child-pending");
					itemEl.removeClass("is-drop-child");
				}
			});
			itemEl.addEventListener("drop", (e) => {
				e.preventDefault();
				itemEl.removeClass("is-drop-before");
				itemEl.removeClass("is-drop-after");
				if (!e.dataTransfer || !onMoveBlock) return;
				const payload = parseReparentDragPayload(
					e.dataTransfer.getData("application/json"),
				);
				if (payload && payload.blockId !== block.id) {
					const rect = itemEl.getBoundingClientRect();
					const intent = itemEl.hasClass("is-drop-child")
						? "as-child"
						: resolveLayerDropIntent({
								relativeX: e.clientX - rect.left,
								relativeY: e.clientY - rect.top,
								height: rect.height || 1,
								allowAsChild: false,
							});
					onMoveBlock({
						sourceId: payload.blockId,
						targetId: block.id,
						intent,
					});
				}
				clearChildIntent();
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
		const pageItemEl = container.createDiv(
			"slides-rup-design-maker-page-item-row",
		);
		const button = pageItemEl.createEl("button", {
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
		const openPageButton = pageItemEl.createEl("button", {
			cls: "slides-rup-design-maker-page-link-btn",
			attr: {
				type: "button",
				"aria-label": t("Open page note in new tab"),
				title: t("Open page note in new tab"),
			},
		});
		setIcon(openPageButton, "external-link");
		if (!onOpenPageFile) {
			openPageButton.disabled = true;
		}
		openPageButton.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			void onOpenPageFile?.(page.filePath);
		});

		if (page.type === activePageType && page.blocks.length > 0) {
			const blockListContainer = container.createDiv(
				"slides-rup-design-maker-layer-list",
			);

			getLayerRenderOrder(page.blocks).forEach((block) => {
				renderLayerItem(blockListContainer, block, 0);
			});

			const rootDropZone = container.createDiv(
				"slides-rup-design-maker-layer-root-dropzone",
			);
			rootDropZone.addEventListener("dragover", (e) => {
				e.preventDefault();
				if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
				rootDropZone.addClass("is-drop-root");
			});
			rootDropZone.addEventListener("dragleave", () => {
				rootDropZone.removeClass("is-drop-root");
			});
			rootDropZone.addEventListener("drop", (e) => {
				e.stopPropagation();
				e.preventDefault();
				rootDropZone.removeClass("is-drop-root");
				clearChildIntent();
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
		}
	});
}
