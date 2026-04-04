import { setIcon } from "obsidian";
import { t } from "src/lang/helpers";
import {
	DesignDraft,
	DesignPageType,
	DesignCanvasBlock,
} from "src/types/design-maker";

export function renderDesignPageList(options: {
	container: HTMLElement;
	draft: DesignDraft;
	activePageType: DesignPageType;
	selectedBlockId: string | null;
	onSelect: (pageType: DesignPageType) => void;
	onSelectBlock: (blockId: string | null) => void;
	onToggleBlockVisibility: (blockId: string, hidden: boolean) => void;
}): void {
	const {
		container,
		draft,
		activePageType,
		selectedBlockId,
		onSelect,
		onSelectBlock,
		onToggleBlockVisibility,
	} = options;
	container.empty();

	container.createEl("h3", {
		text: `${t("Design Pages")} - ${draft.designName}`,
		cls: "slides-rup-design-maker-section-title",
	});

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
			page.blocks.forEach((block: DesignCanvasBlock, index: number) => {
				const itemEl = blockListContainer.createDiv(
					"slides-rup-design-maker-layer-item",
				);
				if (block.id === selectedBlockId) {
					itemEl.addClass("is-selected");
				}

				const labelText =
					block.type === "grid"
						? (block.role || "grid").toUpperCase()
						: "RAW";
				const summaryText =
					block.type === "grid"
						? (block.content || "")
								.slice(0, 15)
								.replace(/\n/g, " ") + "..."
						: "Raw Markdown";

				const labelEl = itemEl.createSpan(
					"slides-rup-design-maker-layer-label",
				);
				labelEl.setText(`[${labelText}] ${summaryText}`);
				labelEl.addEventListener("click", () => {
					onSelectBlock(block.id);
				});

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
			});
		}
	});
}
