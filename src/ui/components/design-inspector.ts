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
import { InlineStyleAIModal } from "../modals/inline-style-ai-modal";
import {
	parseAspectRatio,
	resolveCropDimensions,
	type UnsplashImageItem,
	type UnsplashSearchOptions,
} from "src/services/unsplash-image-service";

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

const INSPECTOR_SELECT_OPTION_I18N_KEYS: Record<string, string> = {
	Default: "designInspector.option.default",
	None: "designInspector.option.none",
	Column: "designInspector.option.column",
	Row: "designInspector.option.row",
	Left: "designInspector.option.left",
	Right: "designInspector.option.right",
	Center: "designInspector.option.center",
	Justify: "designInspector.option.justify",
	Block: "designInspector.option.block",
	Top: "designInspector.option.top",
	Bottom: "designInspector.option.bottom",
	"Top Left": "designInspector.option.topLeft",
	"Top Right": "designInspector.option.topRight",
	"Bottom Left": "designInspector.option.bottomLeft",
	"Bottom Right": "designInspector.option.bottomRight",
	Stretch: "designInspector.option.stretch",
	Start: "designInspector.option.start",
	End: "designInspector.option.end",
	"Space Between": "designInspector.option.spaceBetween",
	"Space Around": "designInspector.option.spaceAround",
	"Space Evenly": "designInspector.option.spaceEvenly",
	"Fade In": "designInspector.option.fadeIn",
	"Fade Out": "designInspector.option.fadeOut",
	"Slide Right In": "designInspector.option.slideRightIn",
	"Slide Left In": "designInspector.option.slideLeftIn",
	"Slide Up In": "designInspector.option.slideUpIn",
	"Slide Down In": "designInspector.option.slideDownIn",
	"Slide Right Out": "designInspector.option.slideRightOut",
	"Slide Left Out": "designInspector.option.slideLeftOut",
	"Slide Up Out": "designInspector.option.slideUpOut",
	"Slide Down Out": "designInspector.option.slideDownOut",
	"Scale Up": "designInspector.option.scaleUp",
	"Scale Up Out": "designInspector.option.scaleUpOut",
	"Scale Down": "designInspector.option.scaleDown",
	"Scale Down Out": "designInspector.option.scaleDownOut",
	Slower: "designInspector.option.slower",
	Faster: "designInspector.option.faster",
	"Border None": "designInspector.option.borderNone",
	"Border Hidden": "designInspector.option.borderHidden",
	"Border Dotted": "designInspector.option.borderDotted",
	"Border Dashed": "designInspector.option.borderDashed",
	"Border Solid": "designInspector.option.borderSolid",
	"Border Double": "designInspector.option.borderDouble",
	"Border Groove": "designInspector.option.borderGroove",
	"Border Ridge": "designInspector.option.borderRidge",
	"Border Inset": "designInspector.option.borderInset",
	"Border Outset": "designInspector.option.borderOutset",
};

const warnedMissingInspectorOptionLabels = new Set<string>();

function warnMissingInspectorOptionI18n(label: string): void {
	if (warnedMissingInspectorOptionLabels.has(label)) return;
	warnedMissingInspectorOptionLabels.add(label);
	console.warn(
		`[slides-rup] Missing inspector i18n key for option label "${label}", fallback to raw label.`,
	);
}

function localizeInspectorOptionLabel(label: string): string {
	const translationKey = INSPECTOR_SELECT_OPTION_I18N_KEYS[label];
	if (!translationKey) {
		warnMissingInspectorOptionI18n(label);
		return label;
	}
	const localized = t(translationKey as any);
	if (!localized || localized === translationKey) {
		warnMissingInspectorOptionI18n(label);
		return label;
	}
	return localized;
}

export function localizeInspectorSelectOptions(
	options: { value: string; label: string }[],
): { value: string; label: string }[] {
	return options.map((option) => ({
		...option,
		label: localizeInspectorOptionLabel(option.label),
	}));
}

export function resetInspectorI18nWarnCacheForTests(): void {
	warnedMissingInspectorOptionLabels.clear();
}

const BORDER_STYLE_OPTIONS = [
	"none",
	"hidden",
	"dotted",
	"dashed",
	"solid",
	"double",
	"groove",
	"ridge",
	"inset",
	"outset",
] as const;

type BorderStyleOption = (typeof BORDER_STYLE_OPTIONS)[number];

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

export function buildMarkdownImageEmbed(url: string): string {
	return `![](${url.trim()})`;
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

export function insertMarkdownImageIntoContent(
	content: string,
	imageUrl: string,
): string {
	const embed = buildMarkdownImageEmbed(imageUrl);
	const current = (content || "").trimEnd();
	if (!current) return embed;
	return `${current}\n${embed}`;
}

function openUnsplashImagePicker(options: {
	app: App;
	triggerEl: HTMLElement;
	initialAspectRatio: string;
	aspectRatioPresets: string[];
	defaultCropWidth: number;
	defaultCropHeight: number;
	onSearch: (
		keyword: string,
		searchOptions?: UnsplashSearchOptions,
	) => Promise<UnsplashImageItem[]>;
	onRememberAspectRatio?: (ratio: string) => void;
	onSelect: (url: string) => void;
}): void {
	const {
		app,
		triggerEl,
		initialAspectRatio,
		aspectRatioPresets,
		defaultCropWidth,
		defaultCropHeight,
		onSearch,
		onRememberAspectRatio,
		onSelect,
	} = options;
	const pickerEl = document.body.createDiv(
		"slides-rup-design-maker-image-picker",
	);
	pickerEl.addClass("is-unsplash-picker");
	pickerEl.addClass("is-entering");
	const headerEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-header",
	);
	headerEl.createEl("strong", {
		text: t("Unsplash Picker" as any),
		cls: "slides-rup-design-maker-image-picker-title",
	});
	const closeButton = headerEl.createEl("button", {
		cls: "slides-rup-design-maker-image-picker-action",
		attr: { type: "button", "aria-label": t("Close picker" as any) },
	});
	setIcon(closeButton, "x");
	const searchInput = pickerEl.createEl("input", {
		type: "text",
		cls: "slides-rup-design-maker-image-picker-search",
		attr: {
			placeholder: t("Search Unsplash images" as any),
		},
	});
	const hintEl = pickerEl.createDiv({
		cls: "slides-rup-design-maker-image-picker-hint",
		text: t("Type keyword and press Enter" as any),
	});
	const ratioControlsEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-ratio-controls",
	);
	ratioControlsEl.createEl("label", {
		text: t("Ratio presets" as any),
		cls: "slides-rup-design-maker-image-picker-ratio-label",
	});
	const ratioSelect = ratioControlsEl.createEl("select", {
		cls: "slides-rup-design-maker-image-picker-ratio-select",
	});
	const ratioValues = Array.from(
		new Set(
			aspectRatioPresets
				.map((item) => (item || "").trim())
				.filter((item) => !!parseAspectRatio(item)),
		),
	);
	if (!ratioValues.length) ratioValues.push("16:9");
	ratioValues.forEach((ratio) => {
		ratioSelect.createEl("option", {
			value: ratio,
			text: ratio,
		});
	});
	ratioSelect.createEl("option", {
		value: "__custom__",
		text: `${t("Custom ratio" as any)}…`,
	});
	const customRatioInput = ratioControlsEl.createEl("input", {
		type: "text",
		cls: "slides-rup-design-maker-image-picker-ratio-custom",
		attr: {
			placeholder: t("Use custom ratio" as any),
		},
	});
	const ratioPreviewEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-ratio-preview",
	);
	const ratioPreviewFrame = ratioPreviewEl.createDiv(
		"slides-rup-design-maker-image-picker-ratio-preview-frame",
	);
	const ratioPreviewMeta = ratioPreviewEl.createDiv(
		"slides-rup-design-maker-image-picker-ratio-preview-meta",
	);

	const listEl = pickerEl.createDiv(
		"slides-rup-design-maker-image-picker-list",
	);

	let selectedIndex = -1;
	let rows: UnsplashImageItem[] = [];
	let closed = false;
	let currentRatio = parseAspectRatio(initialAspectRatio)?.label || "16:9";

	const updateRatioPreview = () => {
		const crop = resolveCropDimensions({
			aspectRatio: currentRatio,
			baseCropWidth: defaultCropWidth,
			baseCropHeight: defaultCropHeight,
		});
		ratioPreviewFrame.style.aspectRatio = `${crop.ratioLabel.replace(":", " / ")}`;
		ratioPreviewMeta.setText(
			`${t("Current ratio" as any)}: ${crop.ratioLabel} · ${t("Crop size" as any)}: ${crop.width}×${crop.height}`,
		);
	};

	const applyRatio = (rawRatio: string): boolean => {
		const parsed = parseAspectRatio(rawRatio);
		if (!parsed) return false;
		currentRatio = parsed.label;
		onRememberAspectRatio?.(currentRatio);
		updateRatioPreview();
		return true;
	};

	const close = () => {
		if (closed) return;
		closed = true;
		document.removeEventListener("mousedown", onDocumentMouseDown, true);
		document.removeEventListener("keydown", onDocumentKeyDown, true);
		pickerEl.removeClass("is-entering");
		pickerEl.addClass("is-closing");
		window.setTimeout(() => pickerEl.remove(), 130);
	};

	const onDocumentMouseDown = (event: MouseEvent) => {
		const target = event.target as Node;
		if (
			pickerEl.contains(target) ||
			triggerEl.contains(target as HTMLElement)
		) {
			return;
		}
		close();
	};

	const setSelectedIndex = (index: number) => {
		selectedIndex = index;
		const items = listEl.querySelectorAll(
			".slides-rup-design-maker-image-picker-item",
		);
		items.forEach((item, idx) => {
			item.classList.toggle("is-selected", idx === selectedIndex);
		});
		const selectedItem = items[selectedIndex] as HTMLElement | undefined;
		selectedItem?.scrollIntoView({ block: "nearest", inline: "nearest" });
	};

	const renderRows = () => {
		listEl.empty();
		if (!rows.length) {
			listEl.createDiv({
				cls: "slides-rup-design-maker-image-picker-empty",
				text: t("No Unsplash images found" as any),
			});
			selectedIndex = -1;
			return;
		}
		rows.forEach((row, index) => {
			const item = listEl.createDiv(
				"slides-rup-design-maker-image-picker-item",
			);
			const thumbWrap = item.createDiv(
				"slides-rup-design-maker-image-picker-thumb-wrap",
			);
			thumbWrap.createEl("img", {
				cls: "slides-rup-design-maker-image-picker-thumb",
				attr: {
					src: row.thumb || row.url,
					alt: row.alt || t("Unsplash image" as any),
					loading: "lazy",
					referrerpolicy: "no-referrer",
				},
			});
			const meta = item.createDiv(
				"slides-rup-design-maker-image-picker-meta",
			);
			const title = row.alt || t("Unsplash image" as any);
			meta.createDiv({
				cls: "slides-rup-design-maker-image-picker-meta-title",
				text: title,
			});
			meta.createDiv({
				cls: "slides-rup-design-maker-image-picker-meta-author",
				text: row.author,
			});
			item.setAttr("title", `${title} · ${row.author}`);
			item.addEventListener("click", () => {
				onSelect(row.url);
				close();
			});
			if (index === 0) item.addClass("is-selected");
		});
		setSelectedIndex(0);
	};

	const runSearch = async () => {
		const keyword = searchInput.value.trim();
		if (!keyword) return;
		hintEl.setText(t("Searching Unsplash..." as any));
		try {
			const crop = resolveCropDimensions({
				aspectRatio: currentRatio,
				baseCropWidth: defaultCropWidth,
				baseCropHeight: defaultCropHeight,
			});
			rows = await onSearch(keyword, {
				aspectRatio: currentRatio,
				baseCropWidth: crop.width,
				baseCropHeight: crop.height,
			});
			renderRows();
			if (rows.length === 1 && rows[0].id.startsWith("random-")) {
				hintEl.setText(
					t("Unsplash random mode (no access key)" as any),
				);
			} else {
				hintEl.setText(t("Select image to insert" as any));
			}
		} catch (error) {
			rows = [];
			renderRows();
			hintEl.setText(
				`${t("Failed to load Unsplash images" as any)}: ${error}`,
			);
		}
	};

	const onDocumentKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
			return;
		}
		if (event.key === "Enter") {
			if (document.activeElement === searchInput) {
				event.preventDefault();
				void runSearch();
				return;
			}
			if (selectedIndex >= 0 && rows[selectedIndex]) {
				event.preventDefault();
				onSelect(rows[selectedIndex].url);
				close();
			}
		}
		if (event.key === "ArrowDown" && rows.length > 0) {
			event.preventDefault();
			setSelectedIndex(
				getNextPickerSelectionIndex(selectedIndex, rows.length, 1),
			);
		}
		if (event.key === "ArrowUp" && rows.length > 0) {
			event.preventDefault();
			setSelectedIndex(
				getNextPickerSelectionIndex(selectedIndex, rows.length, -1),
			);
		}
	};

	const triggerRect = triggerEl.getBoundingClientRect();
	const pickerRect = pickerEl.getBoundingClientRect();
	const placement = computeImagePickerPlacement({
		triggerRect,
		pickerWidth: pickerRect.width || 360,
		pickerHeight: pickerRect.height || 320,
		viewportWidth: window.innerWidth,
		viewportHeight: window.innerHeight,
	});
	pickerEl.style.left = `${placement.left}px`;
	pickerEl.style.top = `${placement.top}px`;
	pickerEl.style.maxHeight = `${Math.max(180, placement.maxHeight)}px`;
	closeButton.addEventListener("click", close);
	const resolvedInitialRatio = parseAspectRatio(initialAspectRatio);
	if (
		resolvedInitialRatio &&
		ratioValues.includes(resolvedInitialRatio.label)
	) {
		ratioSelect.value = resolvedInitialRatio.label;
		currentRatio = resolvedInitialRatio.label;
		customRatioInput.style.display = "none";
	} else {
		ratioSelect.value = "__custom__";
		customRatioInput.value = currentRatio;
		customRatioInput.style.display = "";
	}
	updateRatioPreview();
	ratioSelect.addEventListener("change", () => {
		if (ratioSelect.value === "__custom__") {
			customRatioInput.style.display = "";
			customRatioInput.focus();
			return;
		}
		customRatioInput.style.display = "none";
		applyRatio(ratioSelect.value);
	});
	customRatioInput.addEventListener("change", () => {
		if (!applyRatio(customRatioInput.value)) {
			hintEl.setText(t("Invalid ratio, fallback to 16:9" as any));
			customRatioInput.value = "16:9";
			applyRatio("16:9");
		}
	});
	customRatioInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			customRatioInput.blur();
			void runSearch();
		}
	});
	searchInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			void runSearch();
		}
	});
	requestAnimationFrame(() => {
		pickerEl.removeClass("is-entering");
		document.addEventListener("mousedown", onDocumentMouseDown, true);
		document.addEventListener("keydown", onDocumentKeyDown, true);
		searchInput.focus();
	});
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

export function isValidInspectorColor(value: string): boolean {
	const normalized = (value || "").trim();
	if (!normalized) return true;
	const supportsApi =
		typeof CSS !== "undefined" && typeof CSS.supports === "function";
	if (supportsApi && CSS.supports("color", normalized)) return true;
	if (
		/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(normalized)
	) {
		return true;
	}
	if (/^rgba?\(\s*[-\d.%\s,]+\)$/i.test(normalized)) return true;
	if (/^hsla?\(\s*[-\d.%\s,]+\)$/i.test(normalized)) return true;
	return false;
}

export function normalizeInspectorColorToHex(value: string): string | null {
	const normalized = (value || "").trim();
	if (!normalized) return null;
	if (/^#([0-9a-f]{6})$/i.test(normalized)) return normalized.toLowerCase();
	if (/^#([0-9a-f]{3})$/i.test(normalized)) {
		const hex = normalized.slice(1);
		return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
	}
	if (typeof document === "undefined") return null;
	const probe = document.createElement("span");
	probe.style.color = normalized;
	if (!probe.style.color) return null;
	document.body.appendChild(probe);
	const computed = getComputedStyle(probe).color;
	probe.remove();
	const match = computed.match(
		/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\s*\)$/i,
	);
	if (!match) return null;
	const [r, g, b] = [match[1], match[2], match[3]].map((n) =>
		Math.max(0, Math.min(255, Number(n))),
	);
	return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function clampBorderWidth(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.round(value));
}

function normalizeBorderStyleOption(value: string): BorderStyleOption {
	const normalized = (value || "").trim().toLowerCase();
	return (BORDER_STYLE_OPTIONS as readonly string[]).includes(normalized)
		? (normalized as BorderStyleOption)
		: "solid";
}

export function parseBorderComposite(border: string): {
	width: number;
	style: BorderStyleOption;
	color: string;
} {
	const source = (border || "").trim();
	if (!source) {
		return { width: 0, style: "solid", color: "#ffffff" };
	}
	const widthMatch = source.match(/(\d+)\s*px/i);
	const width = clampBorderWidth(widthMatch ? Number(widthMatch[1]) : 0);
	const styleMatch = source.match(
		/\b(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)\b/i,
	);
	const style = normalizeBorderStyleOption(
		styleMatch ? styleMatch[1] : "solid",
	);
	let color = source;
	if (widthMatch?.[0]) color = color.replace(widthMatch[0], " ");
	if (styleMatch?.[0]) color = color.replace(styleMatch[0], " ");
	color = color.replace(/\s+/g, " ").trim();
	if (!color || !isValidInspectorColor(color)) color = "#ffffff";
	return { width, style, color };
}

export function composeBorderComposite(parts: {
	width: number;
	style: string;
	color: string;
}): string {
	const width = clampBorderWidth(parts.width);
	const style = normalizeBorderStyleOption(parts.style || "solid");
	const color = isValidInspectorColor((parts.color || "").trim())
		? (parts.color || "").trim()
		: "#ffffff";
	return `${width}px ${style} ${color}`;
}

function createColorPickerField(
	container: HTMLElement,
	label: string,
	value: string,
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	const header = row.createDiv("slides-rup-design-maker-color-header");
	header.createEl("label", { text: t(label as any) });

	const controls = row.createDiv("slides-rup-design-maker-color-controls");

	const textInput = controls.createEl("input", {
		type: "text",
		value,
		cls: "slides-rup-design-maker-input",
		attr: { placeholder: t("Hex/RGB/HSL" as any) },
	});

	const colorInput = controls.createEl("input", {
		type: "color",
		cls: "slides-rup-design-maker-input slides-rup-design-maker-color-input",
	});

	const syncUI = (next: string, emit: boolean) => {
		const normalized = next.trim();
		const valid = isValidInspectorColor(normalized);
		textInput.toggleClass("is-invalid", !valid);
		textInput.setAttr("aria-invalid", valid ? "false" : "true");
		if (!normalized) {
			colorInput.value = "#000000";
			if (emit) onChange("");
			return;
		}
		if (!valid) return;

		const hex = normalizeInspectorColorToHex(normalized);
		if (hex) colorInput.value = hex;
		if (emit) onChange(normalized);
	};

	textInput.addEventListener("input", () => syncUI(textInput.value, true));
	colorInput.addEventListener("input", () => {
		textInput.value = colorInput.value;
		syncUI(colorInput.value, true);
	});
	syncUI(value, false);
}

function createBorderCompositeField(
	container: HTMLElement,
	label: string,
	value: string,
	onChange: (value: string) => void,
): void {
	const initial = parseBorderComposite(value);
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const controls = row.createDiv("slides-rup-design-maker-border-controls");

	const widthInput = controls.createEl("input", {
		type: "number",
		cls: "slides-rup-design-maker-input",
		value: `${initial.width}`,
	});
	widthInput.min = "0";
	widthInput.step = "1";

	const styleSelect = controls.createEl("select", {
		cls: "slides-rup-design-maker-input",
	});
	localizeInspectorSelectOptions(
		BORDER_STYLE_OPTIONS.map((style) => ({
			value: style,
			label: `Border ${style[0].toUpperCase()}${style.slice(1)}`,
		})),
	).forEach((option) => {
		const optionEl = styleSelect.createEl("option", {
			value: option.value,
			text: option.label,
		});
		if (option.value === initial.style) optionEl.selected = true;
	});

	const colorTextInput = controls.createEl("input", {
		type: "text",
		value: initial.color,
		cls: "slides-rup-design-maker-input",
		attr: { placeholder: t("Hex/RGB/HSL" as any) },
	});

	const colorInput = controls.createEl("input", {
		type: "color",
		cls: "slides-rup-design-maker-input slides-rup-design-maker-color-input",
	});

	const syncColorUI = (nextColor: string) => {
		const normalized = nextColor.trim();
		const valid = isValidInspectorColor(normalized);
		colorTextInput.toggleClass("is-invalid", !valid);
		colorTextInput.setAttr("aria-invalid", valid ? "false" : "true");
		if (!normalized) {
			colorInput.value = "#ffffff";
			return;
		}
		if (!valid) return;
		const hex = normalizeInspectorColorToHex(normalized);
		if (hex) colorInput.value = hex;
	};

	const emit = () => {
		const merged = composeBorderComposite({
			width: Number(widthInput.value || 0),
			style: styleSelect.value,
			color: colorTextInput.value,
		});
		onChange(merged);
	};

	widthInput.addEventListener("input", () => {
		widthInput.value = `${clampBorderWidth(Number(widthInput.value || 0))}`;
		emit();
	});
	styleSelect.addEventListener("change", emit);
	colorTextInput.addEventListener("input", () => {
		syncColorUI(colorTextInput.value);
		if (isValidInspectorColor(colorTextInput.value.trim())) emit();
	});
	colorInput.addEventListener("input", () => {
		colorTextInput.value = colorInput.value;
		syncColorUI(colorInput.value);
		emit();
	});

	syncColorUI(initial.color);
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
	app: App | undefined,
	label: string,
	value: string,
	aiEnabled: boolean,
	onGenerateInlineStyleAI:
		| ((prompt: string, currentStyle: string) => Promise<string>)
		| undefined,
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field is-stacked");
	const header = row.createDiv("slides-rup-design-maker-inline-style-header");
	header.createEl("label", { text: t(label as any) });
	const aiButton = header.createEl("button", {
		cls: "slides-rup-design-maker-inline-style-ai-btn",
		attr: { type: "button", "aria-label": t("Generate with AI" as any) },
	});
	setIcon(aiButton, "sparkles");
	const editorContainer = row.createDiv(
		"slides-rup-design-maker-code-editor",
	);
	const initialDoc = formatInlineStyleForEditor(value);
	const editorView = new EditorView({
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
	const canUseAI = Boolean(app && aiEnabled && onGenerateInlineStyleAI);
	if (!canUseAI) {
		aiButton.disabled = true;
		aiButton.addClass("is-disabled");
		return;
	}
	aiButton.addEventListener("click", async () => {
		if (!app || !onGenerateInlineStyleAI) return;
		const modal = new InlineStyleAIModal(
			app,
			onGenerateInlineStyleAI,
			editorView.state.doc.toString(),
		);
		const generatedStyle = await modal.openAndGetValue();
		if (!generatedStyle) return;
		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: generatedStyle,
			},
		});
	});
}

function createFilterField(
	container: HTMLElement,
	app: App | undefined,
	label: string,
	value: string,
	aiEnabled: boolean,
	onGenerateFilterAI:
		| ((prompt: string, currentFilter: string) => Promise<string>)
		| undefined,
	onChange: (value: string) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field is-stacked");
	const header = row.createDiv("slides-rup-design-maker-inline-style-header");
	header.createEl("label", { text: t(label as any) });
	const aiButton = header.createEl("button", {
		cls: "slides-rup-design-maker-inline-style-ai-btn",
		attr: {
			type: "button",
			"aria-label": t("Generate Filter with AI" as any),
		},
	});
	setIcon(aiButton, "sparkles");
	const input = row.createEl("input", {
		type: "text",
		value,
		cls: "slides-rup-design-maker-input",
	});
	input.addEventListener("input", () => onChange(input.value));
	const canUseAI = Boolean(app && aiEnabled && onGenerateFilterAI);
	if (!canUseAI) {
		aiButton.disabled = true;
		aiButton.addClass("is-disabled");
		return;
	}
	aiButton.addEventListener("click", async () => {
		if (!app || !onGenerateFilterAI) return;
		const modal = new InlineStyleAIModal(
			app,
			onGenerateFilterAI,
			input.value,
		);
		const generated = await modal.openAndGetValue();
		if (!generated) return;
		input.value = generated;
		onChange(generated);
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
	localizeInspectorSelectOptions(options).forEach((opt) => {
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

export function clampOpacityValue(value: number): number {
	if (!Number.isFinite(value)) return 1;
	return Math.min(1, Math.max(0, value));
}

export function parseInspectorOpacityValue(
	value: string | number | null | undefined,
): number {
	if (value === "" || value === null || value === undefined) return 1;
	const numeric = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(numeric)) return 1;
	return clampOpacityValue(numeric);
}

export function formatOpacityPercentLabel(value: number): string {
	return `${Math.round(clampOpacityValue(value) * 100)}%`;
}

export function resolveOpacityFromTrackPosition(options: {
	clientX: number;
	trackLeft: number;
	trackWidth: number;
}): number {
	const { clientX, trackLeft, trackWidth } = options;
	if (trackWidth <= 0) return 0;
	return clampOpacityValue((clientX - trackLeft) / trackWidth);
}

function createOpacitySliderField(
	container: HTMLElement,
	label: string,
	value: number,
	onChange: (value: number) => void,
): void {
	const row = container.createDiv("slides-rup-design-maker-field");
	row.createEl("label", { text: t(label as any) });
	const control = row.createDiv("slides-rup-design-maker-opacity-control");
	const slider = control.createDiv("slides-rup-design-maker-opacity-slider");
	slider.tabIndex = 0;
	slider.setAttr("role", "slider");
	slider.setAttr("aria-label", t(label as any));
	slider.setAttr("aria-valuemin", "0");
	slider.setAttr("aria-valuemax", "100");
	const track = slider.createDiv("slides-rup-design-maker-opacity-track");
	const fill = track.createDiv("slides-rup-design-maker-opacity-fill");
	const thumb = slider.createDiv("slides-rup-design-maker-opacity-thumb");
	const percentLabel = control.createSpan({
		cls: "slides-rup-design-maker-opacity-value",
	});

	let currentValue = clampOpacityValue(value);

	const syncUI = () => {
		const percent = Math.round(currentValue * 100);
		fill.style.width = `${percent}%`;
		thumb.style.left = `${percent}%`;
		percentLabel.setText(formatOpacityPercentLabel(currentValue));
		slider.setAttr("aria-valuenow", `${percent}`);
		slider.setAttr(
			"aria-valuetext",
			formatOpacityPercentLabel(currentValue),
		);
	};

	const applyValue = (next: number) => {
		currentValue = clampOpacityValue(next);
		syncUI();
		onChange(currentValue);
	};

	const valueFromPointer = (clientX: number) => {
		const rect = track.getBoundingClientRect();
		return resolveOpacityFromTrackPosition({
			clientX,
			trackLeft: rect.left,
			trackWidth: rect.width,
		});
	};

	let isDragging = false;
	let dragPointerId: number | null = null;
	const onPointerMove = (event: PointerEvent) => {
		if (!isDragging || event.pointerId !== dragPointerId) return;
		event.preventDefault();
		applyValue(valueFromPointer(event.clientX));
	};
	const onPointerUp = (event: PointerEvent) => {
		if (event.pointerId !== dragPointerId) return;
		isDragging = false;
		dragPointerId = null;
		slider.removeClass("is-dragging");
		document.removeEventListener("pointermove", onPointerMove, true);
		document.removeEventListener("pointerup", onPointerUp, true);
		if (slider.hasPointerCapture(event.pointerId)) {
			slider.releasePointerCapture(event.pointerId);
		}
	};

	slider.addEventListener("pointerdown", (event) => {
		if (event.button !== 0) return;
		isDragging = true;
		dragPointerId = event.pointerId;
		slider.addClass("is-dragging");
		slider.setPointerCapture(event.pointerId);
		applyValue(valueFromPointer(event.clientX));
		document.addEventListener("pointermove", onPointerMove, true);
		document.addEventListener("pointerup", onPointerUp, true);
		event.preventDefault();
	});

	slider.addEventListener("keydown", (event) => {
		let next = currentValue;
		switch (event.key) {
			case "ArrowLeft":
			case "ArrowDown":
				next -= 0.01;
				break;
			case "ArrowRight":
			case "ArrowUp":
				next += 0.01;
				break;
			case "PageDown":
				next -= 0.1;
				break;
			case "PageUp":
				next += 0.1;
				break;
			case "Home":
				next = 0;
				break;
			case "End":
				next = 1;
				break;
			default:
				return;
		}
		event.preventDefault();
		applyValue(next);
	});

	syncUI();
}

export function renderDesignInspector(options: {
	app?: App;
	container: HTMLElement;
	block: DesignCanvasBlock | null;
	showTitle?: boolean;
	aiInlineStyleEnabled?: boolean;
	onGenerateInlineStyleAI?: (
		prompt: string,
		currentStyle: string,
	) => Promise<string>;
	onGenerateFilterAI?: (
		prompt: string,
		currentFilter: string,
	) => Promise<string>;
	unsplashEnabled?: boolean;
	unsplashAspectRatioPresets?: string[];
	unsplashInitialAspectRatio?: string;
	unsplashDefaultCropWidth?: number;
	unsplashDefaultCropHeight?: number;
	onSearchUnsplashImages?: (
		keyword: string,
		searchOptions?: UnsplashSearchOptions,
	) => Promise<UnsplashImageItem[]>;
	onRememberUnsplashAspectRatio?: (ratio: string) => void;
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
		aiInlineStyleEnabled = false,
		onGenerateInlineStyleAI,
		onGenerateFilterAI,
		unsplashEnabled = false,
		unsplashAspectRatioPresets = ["16:9", "4:3", "1:1"],
		unsplashInitialAspectRatio = "16:9",
		unsplashDefaultCropWidth = 1920,
		unsplashDefaultCropHeight = 1080,
		onSearchUnsplashImages,
		onRememberUnsplashAspectRatio,
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

	const contentRow = container.createDiv(
		"slides-rup-design-maker-field is-stacked",
	);
	const contentHeader = contentRow.createDiv(
		"slides-rup-design-maker-content-header",
	);
	contentHeader.createEl("label", { text: t("Block Content") });
	const contentActions = contentHeader.createDiv(
		"slides-rup-design-maker-content-actions",
	);
	const insertImageButton = contentActions.createEl("button", {
		cls: "slides-rup-design-maker-content-action",
		attr: {
			type: "button",
			"aria-label": t("Insert local image"),
		},
	});
	setIcon(insertImageButton, "image-plus");
	insertImageButton.title = t("Insert local image");
	const insertUnsplashButton = contentActions.createEl("button", {
		cls: "slides-rup-design-maker-content-action",
		attr: {
			type: "button",
			"aria-label": t("Insert Unsplash image" as any),
		},
	});
	setIcon(insertUnsplashButton, "image");
	insertUnsplashButton.title = t("Insert Unsplash image" as any);
	insertImageButton.disabled = !app;
	insertUnsplashButton.disabled =
		!app || !unsplashEnabled || !onSearchUnsplashImages;
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
	insertUnsplashButton.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (!app || !onSearchUnsplashImages) return;
		openUnsplashImagePicker({
			app,
			triggerEl: insertUnsplashButton,
			initialAspectRatio: unsplashInitialAspectRatio,
			aspectRatioPresets: unsplashAspectRatioPresets,
			defaultCropWidth: unsplashDefaultCropWidth,
			defaultCropHeight: unsplashDefaultCropHeight,
			onSearch: onSearchUnsplashImages,
			onRememberAspectRatio: onRememberUnsplashAspectRatio,
			onSelect: (url) => {
				textarea.value = insertMarkdownImageIntoContent(
					textarea.value,
					url,
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
	createColorPickerField(container, "Background", block.bg, (value) => {
		onPatchBlock((nextBlock) => {
			nextBlock.bg = value;
		});
	});
	createBorderCompositeField(container, "Border", block.border, (value) => {
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
	createFilterField(
		container,
		app,
		"Filter",
		block.filter,
		aiInlineStyleEnabled,
		onGenerateFilterAI,
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.filter = value;
			});
		},
	);
	createOpacitySliderField(
		container,
		"Opacity",
		parseInspectorOpacityValue(block.opacity),
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
	createCssEditorField(
		container,
		app,
		"Inline Style",
		block.style,
		aiInlineStyleEnabled,
		onGenerateInlineStyleAI,
		(value) => {
			onPatchBlock((nextBlock) => {
				nextBlock.style = value;
			});
		},
	);
}
