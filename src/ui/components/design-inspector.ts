import { t } from "src/lang/helpers";
import { DesignCanvasBlock, DesignGridBlock } from "src/types/design-maker";

function createNumberField(
	container: HTMLElement,
	label: string,
	value: number,
	onChange: (value: number) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const input = row.createEl("input", {
		type: "number",
		value: `${value}`,
		cls: "slides-rup-design-maker-input",
	});
	input.addEventListener("input", () => onChange(Number(input.value || 0)));
}

function createTextField(
	container: HTMLElement,
	label: string,
	value: string,
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const input = row.createEl("input", {
		type: "text",
		value,
		cls: "slides-rup-design-maker-input",
	});
	input.addEventListener("input", () => onChange(input.value));
}

export function renderDesignInspector(options: {
	container: HTMLElement;
	block: DesignCanvasBlock | null;
	onPatchBlock: (patcher: (block: DesignGridBlock) => void) => void;
}): void {
	const { container, block, onPatchBlock } = options;
	container.empty();

	container.createEl("h3", {
		text: t("Block Inspector"),
		cls: "slides-rup-design-maker-section-title",
	});

	if (!block) {
		container.createEl("p", {
			text: t("Select a block"),
			cls: "slides-rup-design-maker-empty-text",
		});
		return;
	}

	if (block.type === "raw") {
		container.createEl("p", {
			text: t("This block is source only"),
			cls: "slides-rup-design-maker-empty-text",
		});
		const textarea = container.createEl("textarea", {
			text: block.raw,
			cls: "slides-rup-design-maker-textarea",
		});
		textarea.readOnly = true;
		return;
	}

	createNumberField(container, "X", block.rect.x, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.x = Math.max(0, Math.min(100, value));
		});
	});
	createNumberField(container, "Y", block.rect.y, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.y = Math.max(0, Math.min(100, value));
		});
	});
	createNumberField(container, "Width", block.rect.width, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.width = Math.max(1, Math.min(100, value));
		});
	});
	createNumberField(container, "Height", block.rect.height, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.height = Math.max(1, Math.min(100, value));
		});
	});
	createTextField(container, "CSS Class", block.className, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.className = value;
		});
	});
	createTextField(container, "Padding", block.pad, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.pad = value;
		});
	});
	createTextField(container, "Align", block.align, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.align = value;
		});
	});
	createTextField(container, "Inline Style", block.style, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.style = value;
		});
	});

	const contentRow = container.createDiv("slides-rup-design-maker-field");
	contentRow.createEl("label", { text: t("Block Content") });
	const textarea = contentRow.createEl("textarea", {
		text: block.content,
		cls: "slides-rup-design-maker-textarea",
	});
	textarea.addEventListener("input", () => {
		onPatchBlock((nextBlock) => {
			nextBlock.content = textarea.value;
		});
	});
}
