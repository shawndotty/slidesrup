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
		value: `${Math.round(value)}`,
		cls: "slides-rup-design-maker-input",
	});
	input.step = "1";
	input.addEventListener("input", () =>
		onChange(Math.round(Number(input.value || 0))),
	);
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

function createSelectField(
	container: HTMLElement,
	label: string,
	value: string,
	options: { value: string; label: string }[],
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const select = row.createEl("select", {
		cls: "slides-rup-design-maker-input",
	});
	options.forEach((opt) => {
		const optionEl = select.createEl("option", {
			value: opt.value,
			text: opt.label,
		});
		if (opt.value === value) {
			optionEl.selected = true;
		}
	});
	select.addEventListener("change", () => onChange(select.value));
}

function createRangeField(
	container: HTMLElement,
	label: string,
	value: number,
	min: number,
	max: number,
	step: number,
	onChange: (value: number) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const input = row.createEl("input", {
		type: "number",
		value: `${value}`,
		cls: "slides-rup-design-maker-input",
	});
	input.min = `${min}`;
	input.max = `${max}`;
	input.step = `${step}`;
	input.addEventListener("input", () => {
		let val = Number(input.value);
		if (isNaN(val)) val = min;
		onChange(Math.min(max, Math.max(min, val)));
	});
}

export function renderDesignInspector(options: {
	container: HTMLElement;
	block: DesignCanvasBlock | null;
	showTitle?: boolean;
	onPatchBlock: (patcher: (block: DesignGridBlock) => void) => void;
}): void {
	const { container, block, onPatchBlock, showTitle = true } = options;
	container.empty();

	if (showTitle) {
		container.createEl("h3", {
			text: t("Block Inspector"),
			cls: "slides-rup-design-maker-section-title",
		});
	}

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
			nextBlock.rect.x = Math.round(Math.max(0, Math.min(100, value)));
		});
	});
	createNumberField(container, "Y", block.rect.y, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.y = Math.round(Math.max(0, Math.min(100, value)));
		});
	});
	createNumberField(container, "Width", block.rect.width, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.width = Math.round(
				Math.max(1, Math.min(100, value)),
			);
		});
	});
	createNumberField(container, "Height", block.rect.height, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.rect.height = Math.round(
				Math.max(1, Math.min(100, value)),
			);
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
	createTextField(container, "Background", block.bg, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.bg = value;
		});
	});
	createTextField(container, "Border", block.border, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.border = value;
		});
	});
	createSelectField(
		container,
		"Flow",
		block.flow,
		[
			{ value: "", label: "Default" },
			{ value: "col", label: "Column" },
			{ value: "row", label: "Row" },
		],
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.flow = value;
			});
		},
	);
	createSelectField(
		container,
		"Align",
		block.align,
		[
			{ value: "", label: "Default" },
			{ value: "left", label: "Left" },
			{ value: "right", label: "Right" },
			{ value: "center", label: "Center" },
			{ value: "justify", label: "Justify" },
			{ value: "block", label: "Block" },
			{ value: "top", label: "Top" },
			{ value: "bottom", label: "Bottom" },
			{ value: "topleft", label: "Top Left" },
			{ value: "topright", label: "Top Right" },
			{ value: "bottomleft", label: "Bottom Left" },
			{ value: "bottomright", label: "Bottom Right" },
			{ value: "stretch", label: "Stretch" },
		],
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.align = value;
			});
		},
	);
	createSelectField(
		container,
		"Justify Content",
		block.justifyContent,
		[
			{ value: "", label: "Default" },
			{ value: "start", label: "Start" },
			{ value: "end", label: "End" },
			{ value: "center", label: "Center" },
			{ value: "space-between", label: "Space Between" },
			{ value: "space-around", label: "Space Around" },
			{ value: "space-evenly", label: "Space Evenly" },
		],
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.justifyContent = value;
			});
		},
	);
	createSelectField(
		container,
		"Animation",
		block.animate,
		[
			{ value: "", label: "None" },
			{ value: "fadeIn", label: "Fade In" },
			{ value: "fadeOut", label: "Fade Out" },
			{ value: "slideRightIn", label: "Slide Right In" },
			{ value: "slideLeftIn", label: "Slide Left In" },
			{ value: "slideUpIn", label: "Slide Up In" },
			{ value: "slideDownIn", label: "Slide Down In" },
			{ value: "slideRightOut", label: "Slide Right Out" },
			{ value: "slideLeftOut", label: "Slide Left Out" },
			{ value: "slideUpOut", label: "Slide Up Out" },
			{ value: "slideDownOut", label: "Slide Down Out" },
			{ value: "scaleUp", label: "Scale Up" },
			{ value: "scaleUpOut", label: "Scale Up Out" },
			{ value: "scaleDown", label: "Scale Down" },
			{ value: "scaleDownOut", label: "Scale Down Out" },
			{ value: "slower", label: "Slower" },
			{ value: "faster", label: "Faster" },
		],
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.animate = value;
			});
		},
	);
	createTextField(container, "Filter", block.filter, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.filter = value;
		});
	});
	createRangeField(
		container,
		"Opacity",
		block.opacity ? Number(block.opacity) : 1,
		0,
		1,
		0.1,
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.opacity = value === 1 ? "" : value.toString();
			});
		},
	);
	createRangeField(
		container,
		"Rotate",
		block.rotate ? Number(block.rotate) : 0,
		0,
		360,
		1,
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.rotate = value === 0 ? "" : value.toString();
			});
		},
	);
	createTextField(container, "Fragment", block.frag, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.frag = value;
		});
	});
	createTextField(container, "Inline Style", block.style, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.style = value;
		});
	});

	const contentRow = container.createDiv(
		"slides-rup-design-maker-field is-stacked",
	);
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
