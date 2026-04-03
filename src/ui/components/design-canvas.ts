import { t } from "src/lang/helpers";
import { DesignPageDraft, DesignGridBlock } from "src/types/design-maker";

type InsertBlockKind = "grid" | "text" | "image" | "placeholder" | "content";

function createTemplateBlock(kind: InsertBlockKind): DesignGridBlock {
	const contentMap: Record<InsertBlockKind, string> = {
		grid: "",
		text: "Editable text",
		image: "![](https://via.placeholder.com/800x450)",
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

export function renderDesignCanvas(options: {
	container: HTMLElement;
	page: DesignPageDraft;
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
		selectedBlockId,
		onSelect,
		onPatchBlock,
		onAddBlock,
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
		deleteButton.addEventListener("click", () => onDeleteBlock(selectedBlockId));
	}

	const canvas = container.createDiv("slides-rup-design-maker-canvas");
	canvas.addEventListener("click", () => onSelect(null));

	page.blocks.forEach((block) => {
		if (block.type === "raw") {
			const raw = canvas.createDiv("slides-rup-design-maker-raw-block");
			raw.setText(block.raw);
			return;
		}

		const el = canvas.createDiv("slides-rup-design-maker-block");
		if (block.id === selectedBlockId) {
			el.addClass("is-selected");
		}
		el.style.left = `${block.rect.x}%`;
		el.style.top = `${block.rect.y}%`;
		el.style.width = `${block.rect.width}%`;
		el.style.height = `${block.rect.height}%`;
		el.setText(block.content || t("Empty Block"));

		const resizeHandle = el.createDiv("slides-rup-design-maker-resize");

		el.addEventListener("click", (event) => {
			event.stopPropagation();
			onSelect(block.id);
		});

		el.addEventListener("mousedown", (event) => {
			if ((event.target as HTMLElement).classList.contains("slides-rup-design-maker-resize")) {
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
				const deltaX = ((moveEvent.clientX - startX) / bounds.width) * 100;
				const deltaY = ((moveEvent.clientY - startY) / bounds.height) * 100;
				onPatchBlock(block.id, (nextBlock) => {
					nextBlock.rect.x = Math.max(
						0,
						Math.min(100 - nextBlock.rect.width, startRect.x + deltaX),
					);
					nextBlock.rect.y = Math.max(
						0,
						Math.min(100 - nextBlock.rect.height, startRect.y + deltaY),
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
				const deltaX = ((moveEvent.clientX - startX) / bounds.width) * 100;
				const deltaY = ((moveEvent.clientY - startY) / bounds.height) * 100;
				onPatchBlock(block.id, (nextBlock) => {
					nextBlock.rect.width = Math.max(
						5,
						Math.min(100 - nextBlock.rect.x, startRect.width + deltaX),
					);
					nextBlock.rect.height = Math.max(
						5,
						Math.min(100 - nextBlock.rect.y, startRect.height + deltaY),
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
}
