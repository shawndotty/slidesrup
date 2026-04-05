import { setIcon } from "obsidian";
import { t } from "src/lang/helpers";
import {
	DesignDraft,
	DesignPageType,
	DesignCanvasBlock,
	DesignGridBlock,
} from "src/types/design-maker";

export function renderDesignPageList(options: {
	container: HTMLElement;
	draft: DesignDraft;
	activePageType: DesignPageType;
	selectedBlockId: string | null;
	onSelect: (pageType: DesignPageType) => void;
	onSelectBlock: (blockId: string | null) => void;
	onToggleBlockVisibility: (blockId: string, hidden: boolean) => void;
	onReparentBlock?: (sourceId: string, targetId: string | null) => void;
}): void {
	const {
		container,
		draft,
		activePageType,
		selectedBlockId,
		onSelect,
		onSelectBlock,
		onToggleBlockVisibility,
		onReparentBlock,
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
						JSON.stringify({
							action: "reparent",
							blockId: block.id,
						}),
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
				itemEl.addClass("is-drag-over");
			});
			itemEl.addEventListener("dragleave", () => {
				itemEl.removeClass("is-drag-over");
			});
			itemEl.addEventListener("drop", (e) => {
				e.preventDefault();
				itemEl.removeClass("is-drag-over");
				if (!e.dataTransfer || !onReparentBlock) return;
				try {
					const data = JSON.parse(
						e.dataTransfer.getData("application/json"),
					);
					if (
						data.action === "reparent" &&
						data.blockId &&
						data.blockId !== block.id
					) {
						// Only reparent if it's a grid (raw cannot be parent)
						onReparentBlock(data.blockId, block.id);
					}
				} catch (ex) {
					// ignore
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
			onToggleBlockVisibility(block.id, !block.hiddenInDesign);
		});

		if (hasChildren) {
			(block as DesignGridBlock).children!.forEach((child) => {
				renderLayerItem(childrenContainer, child, depth + 1);
			});
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
			});
			blockListContainer.addEventListener("drop", (e) => {
				// Stop propagation so it doesn't trigger if we dropped on an item
				e.stopPropagation();
				e.preventDefault();
				if (!e.dataTransfer || !onReparentBlock) return;
				try {
					const data = JSON.parse(
						e.dataTransfer.getData("application/json"),
					);
					if (data.action === "reparent" && data.blockId) {
						onReparentBlock(data.blockId, null);
					}
				} catch (ex) {
					// ignore
				}
			});

			page.blocks.forEach((block) => {
				renderLayerItem(blockListContainer, block, 0);
			});
		}
	});
}
