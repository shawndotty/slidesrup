import { App, setIcon, TFile } from "obsidian";
import { EditorView, basicSetup, EditorState } from "@codemirror/basic-setup";
import { css } from "@codemirror/lang-css";
import {
	autocompletion,
	Completion,
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { t } from "src/lang/helpers";
import {
	formatRectInputValue,
	parseRectInputValue,
} from "src/services/design-maker-parser";
import {
	DesignCanvasBlock,
	DesignGridBlock,
	DesignRectUnit,
} from "src/types/design-maker";

const LOCAL_IMAGE_EXTENSIONS = new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"svg",
	"bmp",
	"ico",
	"avif",
	"heic",
]);

const INLINE_STYLE_STANDARD_PROPERTIES = [
	"align-content",
	"align-items",
	"align-self",
	"animation",
	"animation-delay",
	"animation-direction",
	"animation-duration",
	"animation-fill-mode",
	"animation-iteration-count",
	"animation-name",
	"animation-play-state",
	"animation-timing-function",
	"aspect-ratio",
	"background",
	"background-attachment",
	"background-blend-mode",
	"background-clip",
	"background-color",
	"background-image",
	"background-origin",
	"background-position",
	"background-repeat",
	"background-size",
	"border",
	"border-bottom",
	"border-bottom-color",
	"border-bottom-left-radius",
	"border-bottom-right-radius",
	"border-bottom-style",
	"border-bottom-width",
	"border-collapse",
	"border-color",
	"border-left",
	"border-left-color",
	"border-left-style",
	"border-left-width",
	"border-radius",
	"border-right",
	"border-right-color",
	"border-right-style",
	"border-right-width",
	"border-spacing",
	"border-style",
	"border-top",
	"border-top-color",
	"border-top-left-radius",
	"border-top-right-radius",
	"border-top-style",
	"border-top-width",
	"border-width",
	"bottom",
	"box-shadow",
	"box-sizing",
	"break-inside",
	"caption-side",
	"caret-color",
	"clear",
	"clip-path",
	"color",
	"column-count",
	"column-gap",
	"column-rule",
	"column-rule-color",
	"column-rule-style",
	"column-rule-width",
	"column-span",
	"column-width",
	"columns",
	"content",
	"cursor",
	"display",
	"filter",
	"flex",
	"flex-basis",
	"flex-direction",
	"flex-flow",
	"flex-grow",
	"flex-shrink",
	"flex-wrap",
	"float",
	"font",
	"font-family",
	"font-size",
	"font-style",
	"font-variant",
	"font-weight",
	"gap",
	"grid",
	"grid-area",
	"grid-auto-columns",
	"grid-auto-flow",
	"grid-auto-rows",
	"grid-column",
	"grid-column-end",
	"grid-column-gap",
	"grid-column-start",
	"grid-gap",
	"grid-row",
	"grid-row-end",
	"grid-row-gap",
	"grid-row-start",
	"grid-template",
	"grid-template-areas",
	"grid-template-columns",
	"grid-template-rows",
	"height",
	"inset",
	"inset-block",
	"inset-inline",
	"justify-content",
	"justify-items",
	"justify-self",
	"left",
	"letter-spacing",
	"line-height",
	"list-style",
	"list-style-image",
	"list-style-position",
	"list-style-type",
	"margin",
	"margin-bottom",
	"margin-left",
	"margin-right",
	"margin-top",
	"max-height",
	"max-width",
	"min-height",
	"min-width",
	"mix-blend-mode",
	"object-fit",
	"object-position",
	"opacity",
	"order",
	"outline",
	"outline-color",
	"outline-offset",
	"outline-style",
	"outline-width",
	"overflow",
	"overflow-x",
	"overflow-y",
	"padding",
	"padding-bottom",
	"padding-left",
	"padding-right",
	"padding-top",
	"perspective",
	"pointer-events",
	"position",
	"right",
	"row-gap",
	"text-align",
	"text-decoration",
	"text-decoration-color",
	"text-decoration-line",
	"text-decoration-style",
	"text-overflow",
	"text-shadow",
	"text-transform",
	"top",
	"transform",
	"transform-origin",
	"transform-style",
	"transition",
	"transition-delay",
	"transition-duration",
	"transition-property",
	"transition-timing-function",
	"user-select",
	"vertical-align",
	"visibility",
	"white-space",
	"width",
	"word-break",
	"word-spacing",
	"writing-mode",
	"z-index",
];

const INLINE_STYLE_VENDOR_PROPERTIES = [
	"-webkit-line-clamp",
	"-webkit-text-fill-color",
	"-webkit-text-stroke",
	"-webkit-text-stroke-color",
	"-webkit-text-stroke-width",
	"-webkit-user-select",
	"-moz-user-select",
	"-ms-user-select",
];

const INLINE_STYLE_VALUE_COMPLETIONS: Completion[] = [
	{ label: "inherit", type: "constant", boost: 90 },
	{ label: "initial", type: "constant", boost: 90 },
	{ label: "unset", type: "constant", boost: 90 },
	{ label: "revert", type: "constant", boost: 90 },
	{ label: "none", type: "constant", boost: 70 },
	{ label: "auto", type: "constant", boost: 70 },
	{ label: "normal", type: "constant", boost: 70 },
	{ label: "block", type: "constant", boost: 60 },
	{ label: "inline", type: "constant", boost: 60 },
	{ label: "flex", type: "constant", boost: 60 },
	{ label: "grid", type: "constant", boost: 60 },
	{ label: "relative", type: "constant", boost: 60 },
	{ label: "absolute", type: "constant", boost: 60 },
	{ label: "fixed", type: "constant", boost: 60 },
	{ label: "sticky", type: "constant", boost: 60 },
	{ label: "var(--)", type: "function", apply: "var(--$0)" },
	{ label: "calc()", type: "function", apply: "calc($0)" },
	{ label: "clamp()", type: "function", apply: "clamp($0)" },
	{ label: "min()", type: "function", apply: "min($0)" },
	{ label: "max()", type: "function", apply: "max($0)" },
	{ label: "rgba()", type: "function", apply: "rgba($0)" },
	{ label: "hsl()", type: "function", apply: "hsl($0)" },
];

export function buildInlineStylePropertyCompletions(
	prefix: string,
): Completion[] {
	const normalized = prefix.toLowerCase();
	const standard = INLINE_STYLE_STANDARD_PROPERTIES.filter((prop) =>
		prop.startsWith(normalized),
	).map(
		(prop) => ({ label: prop, type: "property", boost: 100 }) as Completion,
	);
	const vendor = INLINE_STYLE_VENDOR_PROPERTIES.filter((prop) =>
		prop.startsWith(normalized),
	).map(
		(prop) => ({ label: prop, type: "property", boost: 20 }) as Completion,
	);
	return [...standard, ...vendor];
}

export function buildInlineStyleValueCompletions(prefix: string): Completion[] {
	const normalized = prefix.toLowerCase();
	return INLINE_STYLE_VALUE_COMPLETIONS.filter((item) =>
		item.label.toLowerCase().startsWith(normalized),
	);
}

export function detectInlineStyleCompletionMode(
	textBeforeCursor: string,
): "property" | "value" {
	const declaration = textBeforeCursor.split(";").pop() || "";
	return declaration.includes(":") ? "value" : "property";
}

function createInlineStyleCompletionSource(
	context: CompletionContext,
): CompletionResult | null {
	const line = context.state.doc.lineAt(context.pos);
	const textBeforeCursor = line.text.slice(0, context.pos - line.from);
	const mode = detectInlineStyleCompletionMode(textBeforeCursor);
	const tokenMatch =
		mode === "property"
			? textBeforeCursor.match(/[\w-]*$/)
			: textBeforeCursor.match(/[\w-]*$/);
	const typed = tokenMatch ? tokenMatch[0] : "";
	const from = context.pos - typed.length;
	const options =
		mode === "property"
			? buildInlineStylePropertyCompletions(typed)
			: buildInlineStyleValueCompletions(typed);
	if (!options.length) return null;
	return {
		from,
		options,
		validFor: /^[\w-]*$/,
	};
}

type PickerPlacement = "top" | "bottom";

export function clampImagePickerPosition(options: {
	left: number;
	top: number;
	pickerWidth: number;
	pickerHeight: number;
	viewportWidth: number;
	viewportHeight: number;
	margin?: number;
}): { left: number; top: number } {
	const {
		left,
		top,
		pickerWidth,
		pickerHeight,
		viewportWidth,
		viewportHeight,
		margin = 12,
	} = options;
	const maxLeft = Math.max(margin, viewportWidth - pickerWidth - margin);
	const maxTop = Math.max(margin, viewportHeight - pickerHeight - margin);
	return {
		left: Math.min(maxLeft, Math.max(margin, left)),
		top: Math.min(maxTop, Math.max(margin, top)),
	};
}

export function computeImagePickerPlacement(options: {
	triggerRect: Pick<DOMRect, "left" | "right" | "top" | "bottom">;
	pickerWidth: number;
	pickerHeight: number;
	viewportWidth: number;
	viewportHeight: number;
	margin?: number;
	gap?: number;
}): {
	left: number;
	top: number;
	maxHeight: number;
	placement: PickerPlacement;
} {
	const {
		triggerRect,
		pickerWidth,
		pickerHeight,
		viewportWidth,
		viewportHeight,
		margin = 12,
		gap = 8,
	} = options;
	const belowSpace = Math.max(
		0,
		viewportHeight - triggerRect.bottom - margin,
	);
	const aboveSpace = Math.max(0, triggerRect.top - margin);
	const preferredPlacement: PickerPlacement =
		belowSpace >= 220 || belowSpace >= aboveSpace ? "bottom" : "top";
	const maxHeight = Math.max(
		160,
		(preferredPlacement === "bottom" ? belowSpace : aboveSpace) - gap,
	);
	const preferredLeft = triggerRect.right - pickerWidth;
	const preferredTop =
		preferredPlacement === "bottom"
			? triggerRect.bottom + gap
			: triggerRect.top - pickerHeight - gap;
	const clamped = clampImagePickerPosition({
		left: preferredLeft,
		top: preferredTop,
		pickerWidth,
		pickerHeight,
		viewportWidth,
		viewportHeight,
		margin,
	});
	return {
		left: clamped.left,
		top: clamped.top,
		maxHeight: Math.min(maxHeight, viewportHeight - margin * 2),
		placement: preferredPlacement,
	};
}

export function getNextPickerSelectionIndex(
	currentIndex: number,
	totalItems: number,
	direction: 1 | -1,
): number {
	if (totalItems <= 0) return -1;
	const normalized = currentIndex < 0 ? 0 : currentIndex;
	return (normalized + direction + totalItems) % totalItems;
}

export function isLocalImagePath(path: string): boolean {
	if (!path || !path.trim()) return false;
	const parts = path.toLowerCase().split(".");
	if (parts.length < 2) return false;
	return LOCAL_IMAGE_EXTENSIONS.has(parts[parts.length - 1]);
}

export function buildWikiImageEmbed(path: string): string {
	return `![[${path.trim()}]]`;
}

export function insertImageEmbedIntoContent(
	content: string,
	imagePath: string,
): string {
	const embed = buildWikiImageEmbed(imagePath);
	const current = (content || "").trimEnd();
	if (!current) return embed;
	return `${current}\n${embed}`;
}

function openLocalImagePicker(options: {
	app: App;
	triggerEl: HTMLElement;
	onSelect: (path: string) => void;
}): void {
	const { app, triggerEl, onSelect } = options;
	const imagePaths = app.vault
		.getFiles()
		.filter((file: TFile) => isLocalImagePath(file.path))
		.map((file) => file.path)
		.sort((a, b) => a.localeCompare(b));

	const pickerEl = document.body.createDiv(
		"slides-rup-design-maker-image-picker",
	);
	pickerEl.addClass("is-entering");
	const headerEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-header",
	);
	headerEl.createEl("strong", {
		text: t("Image Picker" as any),
		cls: "slides-rup-design-maker-image-picker-title",
	});
	const headerActions = headerEl.createDiv(
		"slides-rup-design-maker-image-picker-actions",
	);
	const pinButton = headerActions.createEl("button", {
		cls: "slides-rup-design-maker-image-picker-action",
		attr: { type: "button", "aria-label": t("Pin picker" as any) },
	});
	setIcon(pinButton, "pin");
	const closeButton = headerActions.createEl("button", {
		cls: "slides-rup-design-maker-image-picker-action",
		attr: { type: "button", "aria-label": t("Close picker" as any) },
	});
	setIcon(closeButton, "x");
	const searchInput = pickerEl.createEl("input", {
		type: "text",
		cls: "slides-rup-design-maker-image-picker-search",
		attr: {
			placeholder: t("Search local images"),
		},
	});
	const hintEl = pickerEl.createDiv({
		cls: "slides-rup-design-maker-image-picker-hint",
		text: t("Enter to insert · Esc to close" as any),
	});
	const listEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-list",
	);

	let pinned = false;
	let isDragging = false;
	let dragPointerId: number | null = null;
	let dragOffsetX = 0;
	let dragOffsetY = 0;
	let selectedIndex = 0;
	let hasManualPosition = false;
	let currentLeft = 12;
	let currentTop = 12;
	let matchedPaths: string[] = [];
	let isClosed = false;

	const updatePinnedState = () => {
		pickerEl.classList.toggle("is-pinned", pinned);
		pinButton.setAttr("aria-pressed", pinned ? "true" : "false");
		pinButton.setAttr(
			"aria-label",
			pinned ? t("Unpin picker" as any) : t("Pin picker" as any),
		);
		pinButton.title = pinned
			? t("Unpin picker" as any)
			: t("Pin picker" as any);
	};

	const applyPosition = (left: number, top: number) => {
		const rect = pickerEl.getBoundingClientRect();
		const clamped = clampImagePickerPosition({
			left,
			top,
			pickerWidth: rect.width || 360,
			pickerHeight: rect.height || 320,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		});
		currentLeft = clamped.left;
		currentTop = clamped.top;
		pickerEl.style.left = `${currentLeft}px`;
		pickerEl.style.top = `${currentTop}px`;
	};

	const placePicker = () => {
		const rect = triggerEl.getBoundingClientRect();
		const pickerRect = pickerEl.getBoundingClientRect();
		const placement = computeImagePickerPlacement({
			triggerRect: rect,
			pickerWidth: pickerRect.width || 360,
			pickerHeight: pickerRect.height || 320,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		});
		pickerEl.setAttr("data-placement", placement.placement);
		pickerEl.style.maxHeight = `${Math.max(180, placement.maxHeight)}px`;
		if (hasManualPosition) {
			applyPosition(currentLeft, currentTop);
			return;
		}
		applyPosition(placement.left, placement.top);
	};

	const setSelectedIndex = (
		nextIndex: number,
		options?: { scrollIntoView?: boolean },
	) => {
		selectedIndex = nextIndex;
		const items = listEl.querySelectorAll(
			".slides-rup-design-maker-image-picker-item",
		);
		items.forEach((item, index) => {
			item.classList.toggle("is-selected", index === selectedIndex);
		});
		if (options?.scrollIntoView && selectedIndex >= 0) {
			(items[selectedIndex] as HTMLElement | undefined)?.scrollIntoView({
				block: "nearest",
			});
		}
	};

	const selectCurrentPath = () => {
		const targetPath = matchedPaths[selectedIndex];
		if (!targetPath) return;
		onSelect(targetPath);
		close();
	};

	const close = () => {
		if (isClosed) return;
		isClosed = true;
		document.removeEventListener("mousedown", onDocumentMouseDown, true);
		document.removeEventListener(
			"pointermove",
			onDocumentPointerMove,
			true,
		);
		document.removeEventListener("pointerup", onDocumentPointerUp, true);
		window.removeEventListener("resize", onWindowResize);
		document.removeEventListener("keydown", onDocumentKeyDown, true);
		pickerEl.removeClass("is-entering");
		pickerEl.addClass("is-closing");
		window.setTimeout(() => pickerEl.remove(), 130);
	};

	const onDocumentMouseDown = (event: MouseEvent) => {
		if (pinned) return;
		const target = event.target as Node;
		if (
			pickerEl.contains(target) ||
			triggerEl.contains(target as HTMLElement)
		) {
			return;
		}
		close();
	};

	const onDocumentKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			selectCurrentPath();
			return;
		}
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedIndex(
				getNextPickerSelectionIndex(
					selectedIndex,
					matchedPaths.length,
					1,
				),
				{ scrollIntoView: true },
			);
			return;
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex(
				getNextPickerSelectionIndex(
					selectedIndex,
					matchedPaths.length,
					-1,
				),
				{ scrollIntoView: true },
			);
		}
	};

	const onDocumentPointerMove = (event: PointerEvent) => {
		if (!isDragging || dragPointerId !== event.pointerId) return;
		event.preventDefault();
		applyPosition(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
	};

	const onDocumentPointerUp = (event: PointerEvent) => {
		if (dragPointerId !== event.pointerId) return;
		isDragging = false;
		dragPointerId = null;
		headerEl.removeClass("is-dragging");
		if (headerEl.hasPointerCapture(event.pointerId)) {
			headerEl.releasePointerCapture(event.pointerId);
		}
	};

	const onWindowResize = () => {
		placePicker();
	};

	const renderList = () => {
		const keyword = searchInput.value.trim().toLowerCase();
		matchedPaths = keyword
			? imagePaths.filter((path) => path.toLowerCase().includes(keyword))
			: imagePaths;
		listEl.empty();
		if (!matchedPaths.length) {
			selectedIndex = -1;
			listEl.createDiv({
				cls: "slides-rup-design-maker-image-picker-empty",
				text: t("No local images found"),
			});
			return;
		}
		selectedIndex = Math.min(
			Math.max(0, selectedIndex),
			matchedPaths.length - 1,
		);
		matchedPaths.forEach((path, index) => {
			const button = listEl.createEl("button", {
				cls: "slides-rup-design-maker-image-picker-item",
				text: path,
				attr: { type: "button" },
			});
			button.addEventListener("pointerenter", () => {
				setSelectedIndex(index);
			});
			button.addEventListener("click", () => {
				setSelectedIndex(index);
				selectCurrentPath();
			});
		});
		setSelectedIndex(selectedIndex);
	};

	searchInput.addEventListener("input", renderList);
	pinButton.addEventListener("click", (event) => {
		event.preventDefault();
		pinned = !pinned;
		updatePinnedState();
	});
	closeButton.addEventListener("click", (event) => {
		event.preventDefault();
		close();
	});
	headerEl.addEventListener("pointerdown", (event) => {
		const target = event.target as HTMLElement;
		if (target.closest(".slides-rup-design-maker-image-picker-action"))
			return;
		isDragging = true;
		hasManualPosition = true;
		dragPointerId = event.pointerId;
		const rect = pickerEl.getBoundingClientRect();
		dragOffsetX = event.clientX - rect.left;
		dragOffsetY = event.clientY - rect.top;
		headerEl.addClass("is-dragging");
		headerEl.setPointerCapture(event.pointerId);
		event.preventDefault();
	});

	updatePinnedState();
	renderList();
	placePicker();

	requestAnimationFrame(() => {
		pickerEl.removeClass("is-entering");
		document.addEventListener("pointermove", onDocumentPointerMove, true);
		document.addEventListener("pointerup", onDocumentPointerUp, true);
		document.addEventListener("mousedown", onDocumentMouseDown, true);
		window.addEventListener("resize", onWindowResize);
		document.addEventListener("keydown", onDocumentKeyDown, true);
		searchInput.focus();
	});
}

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

export function formatInlineStyleForEditor(style: string): string {
	const declarations = style
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean);
	if (!declarations.length) return "";
	return `${declarations.join(";\n")};`;
}

function createCssEditorField(
	container: HTMLElement,
	label: string,
	value: string,
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field is-stacked");
	row.createEl("label", { text: t(label as any) });
	const editorContainer = row.createDiv(
		"slides-rup-design-maker-code-editor",
	);
	const initialDoc = formatInlineStyleForEditor(value);
	new EditorView({
		state: EditorState.create({
			doc: initialDoc,
			extensions: [
				basicSetup,
				css(),
				autocompletion({
					activateOnTyping: true,
					override: [createInlineStyleCompletionSource],
				}),
				...(document.body.classList.contains("theme-dark")
					? [oneDark]
					: []),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onChange(update.state.doc.toString());
					}
				}),
			],
		}),
		parent: editorContainer,
	});
}

function createRectField(
	container: HTMLElement,
	label: string,
	fieldKey: "x" | "y" | "width" | "height",
	value: number,
	rectUnit: DesignRectUnit,
	onChange: (value: number) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const input = row.createEl("input", {
		type: "text",
		value: formatRectInputValue(value, rectUnit),
		cls: "slides-rup-design-maker-input",
	});
	input.setAttr("data-rect-field", fieldKey);
	input.setAttr("data-rect-unit", rectUnit);
	input.addEventListener("input", () => {
		const defaultUnit = rectUnit === "px" ? "px" : "percent";
		const parsed = parseRectInputValue(input.value, defaultUnit);
		if (!parsed) return;
		onChange(Math.round(parsed.value));
	});
}

export function syncInspectorRectFields(options: {
	container: HTMLElement;
	rect: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	rectUnit: DesignRectUnit;
}): void {
	const { container, rect, rectUnit } = options;
	const keys: Array<keyof typeof rect> = ["x", "y", "width", "height"];
	keys.forEach((key) => {
		const input = container.querySelector(
			`input[data-rect-field="${key}"]`,
		) as HTMLInputElement | null;
		if (!input) return;
		input.value = formatRectInputValue(Math.round(rect[key]), rectUnit);
		input.setAttr("data-rect-unit", rectUnit);
	});
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
	app?: App;
	container: HTMLElement;
	block: DesignCanvasBlock | null;
	showTitle?: boolean;
	isGlobalCoords?: boolean;
	onToggleCoords?: (global: boolean) => void;
	getGlobalCoords?: () => { x: number; y: number } | null;
	setGlobalCoords?: (x: number, y: number) => void;
	onPatchBlock: (patcher: (block: DesignGridBlock) => void) => void;
}): void {
	const {
		app,
		container,
		block,
		onPatchBlock,
		showTitle = true,
		isGlobalCoords = false,
		onToggleCoords,
		getGlobalCoords,
		setGlobalCoords,
	} = options;
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

	const coordsHeader = container.createDiv(
		"slides-rup-design-maker-coords-header",
	);
	coordsHeader.createEl("strong", { text: t("Coordinates" as any) });

	const toggleContainer = coordsHeader.createDiv(
		"slides-rup-design-maker-coords-toggle",
	);
	const relativeLabel = toggleContainer.createSpan({
		text: t("Rel" as any),
		cls: "slides-rup-design-maker-coords-label",
	});
	const toggleBtn = toggleContainer.createEl("button", {
		text: isGlobalCoords ? t("Glob" as any) : t("Rel" as any),
	});
	const globalLabel = toggleContainer.createSpan({
		text: t("Glob" as any),
		cls: "slides-rup-design-maker-coords-label",
	});

	relativeLabel.style.opacity = isGlobalCoords ? "0.5" : "1";
	globalLabel.style.opacity = isGlobalCoords ? "1" : "0.5";

	toggleBtn.addEventListener("click", () => {
		if (onToggleCoords) onToggleCoords(!isGlobalCoords);
	});

	let displayX = block.rect.x;
	let displayY = block.rect.y;

	if (isGlobalCoords && getGlobalCoords) {
		const global = getGlobalCoords();
		if (global) {
			displayX = global.x;
			displayY = global.y;
		}
	}

	const rectUnit: DesignRectUnit =
		block.extraAttributes.rectUnit === "px" ? "px" : "percent";

	createRectField(container, "X", "x", displayX, rectUnit, (value) => {
		if (isGlobalCoords && setGlobalCoords) {
			setGlobalCoords(value, displayY);
		} else {
			onPatchBlock((nextBlock) => {
				nextBlock.rect.x = Math.round(value);
			});
		}
	});
	createRectField(container, "Y", "y", displayY, rectUnit, (value) => {
		if (isGlobalCoords && setGlobalCoords) {
			setGlobalCoords(displayX, value);
		} else {
			onPatchBlock((nextBlock) => {
				nextBlock.rect.y = Math.round(value);
			});
		}
	});
	createRectField(
		container,
		"Width",
		"width",
		block.rect.width,
		rectUnit,
		(v) => {
			onPatchBlock((nextBlock) => {
				nextBlock.rect.width = Math.round(Math.max(1, v));
			});
		},
	);
	createRectField(
		container,
		"Height",
		"height",
		block.rect.height,
		rectUnit,
		(v) => {
			onPatchBlock((nextBlock) => {
				nextBlock.rect.height = Math.round(Math.max(1, v));
			});
		},
	);
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
	createCssEditorField(container, "Inline Style", block.style, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.style = value;
		});
	});

	const contentRow = container.createDiv(
		"slides-rup-design-maker-field is-stacked",
	);
	const contentHeader = contentRow.createDiv(
		"slides-rup-design-maker-content-header",
	);
	contentHeader.createEl("label", { text: t("Block Content") });
	const insertImageButton = contentHeader.createEl("button", {
		cls: "slides-rup-design-maker-content-action",
		attr: {
			type: "button",
			"aria-label": t("Insert local image"),
		},
	});
	setIcon(insertImageButton, "image-plus");
	insertImageButton.title = t("Insert local image");
	insertImageButton.disabled = !app;
	const textarea = contentRow.createEl("textarea", {
		text: block.content,
		cls: "slides-rup-design-maker-textarea",
	});
	insertImageButton.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (!app) return;
		openLocalImagePicker({
			app,
			triggerEl: insertImageButton,
			onSelect: (path) => {
				textarea.value = insertImageEmbedIntoContent(
					textarea.value,
					path,
				);
				textarea.dispatchEvent(new Event("input"));
				textarea.focus();
			},
		});
	});
	textarea.addEventListener("input", () => {
		onPatchBlock((nextBlock) => {
			nextBlock.content = textarea.value;
		});
	});
}
