import {
	DesignCanvasBlock,
	DesignGridBlock,
	DesignPageDraft,
	DesignPageType,
	DesignRectUnit,
	ThemeStyleDraft,
} from "src/types/design-maker";
import { DEFAULT_SETTINGS } from "src/models/default-settings";
import type { SlidesRupSettings } from "src/types";
import {
	getDesignPageDisplayName,
	getDesignPageFileName,
} from "./design-maker-schema";

let blockSeed = 0;

interface GridSegment {
	attrSource: string;
	content: string;
	start: number;
	end: number;
}

interface TextRange {
	start: number;
	end: number;
}

interface RectSizeContext {
	width: number;
	height: number;
}

function nextBlockId(prefix: string): string {
	blockSeed += 1;
	return `${prefix}-${blockSeed}`;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number): number {
	return Math.round(clamp(value, min, max));
}

function detectExplicitRectUnit(value: string): DesignRectUnit | null {
	const parts = (value || "").trim().split(/\s+/).filter(Boolean);
	for (const part of parts) {
		const match = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
		if (!match) continue;
		const unit = (match[2] || "").toLowerCase();
		if (unit === "px") return "px";
		if (unit === "%" || unit === "percent") return "percent";
	}
	return null;
}

/**
 * Represents the unit type for a design block's dimensions and coordinates.
 * - 'px': Absolute pixel values (e.g., 100px)
 * - 'percent': Relative percentage values based on slide dimensions (e.g., 50%)
 */
export function normalizeCoordinateString(value: string): string {
	if (!value) return value;
	const parts = value.trim().split(/\s+/);
	return parts
		.map((part) => {
			if (/^-?\d+(?:\.\d+)?$/.test(part)) {
				return `${part}px`;
			}
			return part;
		})
		.join(" ");
}

export function formatRectInputValue(
	value: number,
	rectUnit: DesignRectUnit,
): string {
	const rounded = Math.round(value);
	return rectUnit === "px" ? `${rounded}px` : `${rounded}`;
}

/**
 * Parses an input string into a numeric value and its detected unit.
 * @param raw The raw input string from the inspector (e.g. '100px', '50%')
 * @param defaultUnitForUnitless The unit to assign if the input is a pure number.
 */
export function parseRectInputValue(
	raw: string,
	defaultUnitForUnitless: DesignRectUnit = "percent",
): { value: number; rectUnit: DesignRectUnit } | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (trimmed.toLowerCase().endsWith("px")) {
		const num = Number(trimmed.slice(0, -2).trim());
		if (!Number.isFinite(num)) return null;
		return { value: num, rectUnit: "px" };
	}
	if (trimmed.endsWith("%")) {
		const num = Number(trimmed.slice(0, -1).trim());
		if (!Number.isFinite(num)) return null;
		return { value: num, rectUnit: "percent" };
	}
	const num = Number(trimmed);
	if (!Number.isFinite(num)) return null;
	return { value: num, rectUnit: defaultUnitForUnitless };
}

function parsePair(
	value: string,
	fallbackA: number,
	fallbackB: number,
	rectUnit: DesignRectUnit,
	warnings: string[],
	unitlessPercentBase?: RectSizeContext,
): [number, number] {
	if (!value) return [fallbackA, fallbackB];

	const trimmed = value.trim();
	if (rectUnit !== "px") {
		if (trimmed === "topleft") return [0, 0];
		if (trimmed === "topright") return [50, 0];
		if (trimmed === "bottomleft") return [0, 50];
		if (trimmed === "bottomright") return [50, 50];
	} else if (
		[
			"topleft",
			"topright",
			"bottomleft",
			"bottomright",
			"center",
			"top",
			"bottom",
			"left",
			"right",
		].includes(trimmed)
	) {
		warnings.push(
			`Detected keyword positioning "${trimmed}" in px mode; falling back to defaults.`,
		);
		return [fallbackA, fallbackB];
	}

	const parts = trimmed.split(/\s+/);
	if (parts.length >= 2) {
		const a = parseNumericToken(
			parts[0],
			rectUnit,
			"x",
			warnings,
			unitlessPercentBase?.width,
		);
		const b = parseNumericToken(
			parts[1],
			rectUnit,
			"y",
			warnings,
			unitlessPercentBase?.height,
		);
		if (a != null && b != null) return [a, b];
	}
	return [fallbackA, fallbackB];
}

const DEFAULT_DESIGN_BASE_WIDTH = 1920;
const DEFAULT_DESIGN_BASE_HEIGHT = 1080;

function parseNumericToken(
	token: string,
	rectUnit: DesignRectUnit,
	dimension: "x" | "y",
	warnings: string[],
	unitlessPercentBase?: number,
): number | null {
	const match = token.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
	if (!match) return null;
	const value = Number(match[1]);
	if (!Number.isFinite(value)) return null;
	const unit = (match[2] || "").toLowerCase();

	const isPx = unit === "px";
	const isPercent = unit === "%";
	const isUnitless = unit === "";

	if (rectUnit === "px") {
		if (isPercent) {
			const base =
				dimension === "x"
					? DEFAULT_DESIGN_BASE_WIDTH
					: DEFAULT_DESIGN_BASE_HEIGHT;
			return Math.round((value / 100) * base);
		}
		if (isUnitless) {
			if (unitlessPercentBase != null) {
				return Math.round((value / 100) * unitlessPercentBase);
			}
			return Math.round(value);
		}
		if (!isPx) {
			warnings.push(
				`Detected unsupported unit "${unit}" in px mode; treating it as px.`,
			);
		}
		return Math.round(value);
	} else {
		if (isPx) {
			const base =
				dimension === "x"
					? DEFAULT_DESIGN_BASE_WIDTH
					: DEFAULT_DESIGN_BASE_HEIGHT;
			return Math.round((value / base) * 100);
		}
		if (unit && unit !== "%") {
			warnings.push(
				`Detected unsupported unit "${unit}" in percent mode; stripping unit and treating it as a number.`,
			);
		}
		return Math.round(value);
	}
}

function detectDefaultRectUnit(markdown: string): {
	rectUnit: DesignRectUnit;
	warnings: string[];
} {
	const warnings: string[] = [];
	const unitsSeen = new Set<string>();
	let hasBareNumber = false;

	const attrRegex = /\b(?:drag|drop)\s*=\s*"([^"]*)"/g;
	let match = attrRegex.exec(markdown);
	while (match) {
		const value = match[1] || "";
		const parts = value.trim().split(/\s+/).filter(Boolean);
		for (const part of parts) {
			const m = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
			if (!m) continue;
			const unit = (m[2] || "").toLowerCase();
			if (!unit) hasBareNumber = true;
			else unitsSeen.add(unit);
		}
		match = attrRegex.exec(markdown);
	}

	const rectUnit: DesignRectUnit =
		unitsSeen.has("px") && !hasBareNumber ? "px" : "percent";
	const unsupportedUnits = Array.from(unitsSeen).filter(
		(u) => u !== "px" && u !== "%",
	);
	if (unsupportedUnits.length > 0) {
		warnings.push(
			`Detected unsupported units in template: ${unsupportedUnits.join(
				", ",
			)}. They will be auto-corrected.`,
		);
	}
	return { rectUnit, warnings };
}

function parseAttributes(raw: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	const attrRegex = /([:\w-]+)="([^"]*)"/g;
	let match = attrRegex.exec(raw);
	while (match) {
		attrs[match[1]] = match[2];
		match = attrRegex.exec(raw);
	}
	return attrs;
}

function parseGridSegments(source: string): {
	segments: GridSegment[];
	topLevelRanges: TextRange[];
} {
	const segments: GridSegment[] = [];
	const topLevelRanges: TextRange[] = [];
	const stack: Array<{
		attrSource: string;
		start: number;
		openEnd: number;
	}> = [];
	const tokenRegex = /<grid\b([^>]*)>|<\/grid>/g;
	let match = tokenRegex.exec(source);
	while (match) {
		const token = match[0];
		if (token.startsWith("<grid")) {
			stack.push({
				attrSource: match[1] || "",
				start: match.index,
				openEnd: tokenRegex.lastIndex,
			});
		} else {
			const opening = stack.pop();
			if (!opening) {
				match = tokenRegex.exec(source);
				continue;
			}
			const segment: GridSegment = {
				attrSource: opening.attrSource,
				content: source.slice(opening.openEnd, match.index),
				start: opening.start,
				end: tokenRegex.lastIndex,
			};
			segments.push(segment);
			if (stack.length === 0) {
				topLevelRanges.push({
					start: opening.start,
					end: tokenRegex.lastIndex,
				});
			}
		}
		match = tokenRegex.exec(source);
	}
	segments.sort((a, b) => a.start - b.start);
	topLevelRanges.sort((a, b) => a.start - b.start);
	return {
		segments,
		topLevelRanges,
	};
}

function stripNestedGridMarkup(content: string): string {
	const { topLevelRanges } = parseGridSegments(content);
	if (topLevelRanges.length === 0) {
		return content.trim();
	}
	let cursor = 0;
	let result = "";
	topLevelRanges.forEach((range) => {
		result += content.slice(cursor, range.start);
		cursor = range.end;
	});
	result += content.slice(cursor);
	return result.trim();
}

function inferRole(content: string): DesignGridBlock["role"] {
	const trimmed = content.trim();
	if (trimmed.includes("<% content %>")) return "content";
	if (trimmed.startsWith("![")) return "image";
	if (trimmed.includes("{{")) return "placeholder";
	if (!trimmed) return "grid";
	return "text";
}

function createRawBlock(raw: string): DesignCanvasBlock | null {
	if (!raw.trim()) return null;
	return {
		id: nextBlockId("raw"),
		type: "raw",
		raw: raw.trim(),
	};
}

function createFootnotesBlock(rectUnit: DesignRectUnit): DesignGridBlock {
	const rect =
		rectUnit === "px"
			? {
					x: 0,
					y: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 92) / 100),
					width: DEFAULT_DESIGN_BASE_WIDTH,
					height: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 8) / 100),
				}
			: { x: 0, y: 92, width: 100, height: 8 };
	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: "placeholder",
		rect,
		content: "<%? footnotes %>",
		className: "footnotes",
		style: "",
		pad: "0 40px",
		align: "topleft",
		flow: "",
		filter: "",
		justifyContent: "",
		bg: "",
		border: "",
		animate: "",
		opacity: "",
		rotate: "",
		frag: "",
		extraAttributes: {},
	};
}

function createSideBarBlock(rectUnit: DesignRectUnit): DesignGridBlock {
	const rect =
		rectUnit === "px"
			? {
					x: Math.round((DEFAULT_DESIGN_BASE_WIDTH * 95) / 100),
					y: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 35) / 100),
					width: Math.round((DEFAULT_DESIGN_BASE_WIDTH * 5) / 100),
					height: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 30) / 100),
				}
			: { x: 95, y: 35, width: 5, height: 30 };
	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: "placeholder",
		rect,
		content: "![[SR-SideBar]]",
		className: "sr-sidebar",
		style: "",
		pad: "0",
		align: "topleft",
		flow: "",
		filter: "",
		justifyContent: "",
		bg: "",
		border: "",
		animate: "",
		opacity: "",
		rotate: "",
		frag: "",
		extraAttributes: {},
	};
}

function appendRawBlocksAndFootnotes(
	raw: string,
	blocks: DesignCanvasBlock[],
	state: { hasFootnotesBlock: boolean; hasSideBarBlock: boolean },
	rectUnit: DesignRectUnit,
	warnings: string[],
): void {
	const normalizedRaw = raw.trim();
	if (!normalizedRaw) return;
	const specialRegex =
		/<%\?\s*footnotes\s*%>|!\[\[\s*SR-SideBar(?:\|[^\]]+)?\s*\]\]/g;
	if (!specialRegex.test(normalizedRaw)) {
		const rawBlock = createRawBlock(raw);
		if (rawBlock) blocks.push(rawBlock);
		return;
	}
	specialRegex.lastIndex = 0;
	let lastIndex = 0;
	let match = specialRegex.exec(normalizedRaw);
	while (match) {
		const segment = normalizedRaw.slice(lastIndex, match.index);
		const rawBlock = createRawBlock(segment);
		if (rawBlock) blocks.push(rawBlock);
		const token = match[0];
		if (token.includes("footnotes")) {
			if (!state.hasFootnotesBlock) {
				blocks.push(createFootnotesBlock(rectUnit));
				state.hasFootnotesBlock = true;
			}
		} else if (!state.hasSideBarBlock) {
			blocks.push(createSideBarBlock(rectUnit));
			state.hasSideBarBlock = true;
		}
		lastIndex = match.index + token.length;
		match = specialRegex.exec(normalizedRaw);
	}
	const tail = createRawBlock(normalizedRaw.slice(lastIndex));
	if (tail) blocks.push(tail);
}

function createGridBlock(
	attrSource: string,
	content: string,
	inheritedRectUnit: DesignRectUnit,
	warnings: string[],
	parentRectPx: RectSizeContext,
): DesignGridBlock {
	const attrs = parseAttributes(attrSource);
	const explicitUnit =
		detectExplicitRectUnit(attrs.drag || "") ||
		detectExplicitRectUnit(attrs.drop || "");
	const rectUnit = explicitUnit ?? inheritedRectUnit;
	const [width, height] = parsePair(
		attrs.drag || "",
		100,
		30,
		rectUnit,
		warnings,
	);

	const [x, y] = parsePair(
		attrs.drop || "",
		0,
		0,
		rectUnit,
		warnings,
		rectUnit === "px" ? parentRectPx : undefined,
	);
	const cleanedContent = stripNestedGridMarkup(content);
	const normalizedWidth = Math.max(1, Math.round(width));
	const normalizedHeight = Math.max(1, Math.round(height));
	const childParentRectPx: RectSizeContext =
		rectUnit === "px"
			? {
					width: normalizedWidth,
					height: normalizedHeight,
				}
			: {
					width: (parentRectPx.width * normalizedWidth) / 100,
					height: (parentRectPx.height * normalizedHeight) / 100,
				};

	// Parse children recursively
	const rawChildren = parseGridBlocks(
		content,
		{
			hasFootnotesBlock: true,
			hasSideBarBlock: true,
		},
		rectUnit,
		warnings,
		childParentRectPx,
	); // Prevent footnotes/sidebar inside nested grids
	const children = rawChildren.filter((c) => c.type === "grid");

	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: inferRole(content),
		rect: {
			x: rectUnit === "px" ? Math.round(x) : clampInt(x, -100, 100),
			y: rectUnit === "px" ? Math.round(y) : clampInt(y, -100, 100),
			width: normalizedWidth,
			height: normalizedHeight,
		},
		content: cleanedContent,
		className: attrs.class || "",
		style: attrs.style || "",
		pad: attrs.pad || "",
		align: attrs.align || "",
		flow: attrs.flow || "",
		filter: attrs.filter || "",
		justifyContent: attrs["justify-content"] || "",
		bg: attrs.bg || "",
		border: attrs.border || "",
		animate: attrs.animate || "",
		opacity: attrs.opacity || "",
		rotate: attrs.rotate || "",
		frag: attrs.frag || "",
		extraAttributes: (() => {
			const extra = Object.entries(attrs).reduce(
				(result, [key, value]) => {
					if (
						[
							"drag",
							"drop",
							"class",
							"style",
							"pad",
							"align",
							"flow",
							"filter",
							"justify-content",
							"bg",
							"border",
							"animate",
							"opacity",
							"rotate",
							"frag",
						].includes(key)
					) {
						return result;
					}
					result[key] = value;
					return result;
				},
				{} as Record<string, string>,
			);
			if (rectUnit === "px") {
				extra.rectUnit = "px";
			}
			return extra;
		})(),
		children: children.length > 0 ? children : undefined,
	};
}

function parseGridBlocks(
	markdown: string,
	footnotesState: { hasFootnotesBlock: boolean; hasSideBarBlock: boolean },
	rectUnit: DesignRectUnit,
	warnings: string[],
	parentRectPx: RectSizeContext,
): DesignCanvasBlock[] {
	const blocks: DesignCanvasBlock[] = [];
	const { topLevelRanges, segments } = parseGridSegments(markdown);
	if (topLevelRanges.length === 0) {
		appendRawBlocksAndFootnotes(
			markdown,
			blocks,
			footnotesState,
			rectUnit,
			warnings,
		);
		return blocks;
	}

	let cursor = 0;
	topLevelRanges.forEach((range) => {
		const before = markdown.slice(cursor, range.start);
		appendRawBlocksAndFootnotes(
			before,
			blocks,
			footnotesState,
			rectUnit,
			warnings,
		);

		// Find the exact segment that corresponds to this topLevelRange
		const segment = segments.find(
			(s) => s.start === range.start && s.end === range.end,
		);
		if (segment) {
			blocks.push(
				createGridBlock(
					segment.attrSource,
					segment.content,
					rectUnit,
					warnings,
					parentRectPx,
				),
			);
		}

		cursor = range.end;
	});

	appendRawBlocksAndFootnotes(
		markdown.slice(cursor),
		blocks,
		footnotesState,
		rectUnit,
		warnings,
	);
	return blocks;
}

export function parseDesignPageDraft(
	pageType: DesignPageType,
	designName: string,
	filePath: string,
	markdown: string,
): DesignPageDraft {
	const fileName = getDesignPageFileName(pageType, designName);
	const footnotesState = {
		hasFootnotesBlock: false,
		hasSideBarBlock: false,
	};

	const { rectUnit: defaultRectUnit, warnings } =
		detectDefaultRectUnit(markdown);
	const blocks = parseGridBlocks(
		markdown,
		footnotesState,
		defaultRectUnit,
		warnings,
		{
			width: DEFAULT_DESIGN_BASE_WIDTH,
			height: DEFAULT_DESIGN_BASE_HEIGHT,
		},
	);
	const units = new Set<DesignRectUnit>();
	const collect = (items: DesignCanvasBlock[]) => {
		items.forEach((block) => {
			if (block.type !== "grid") return;
			units.add(
				block.extraAttributes.rectUnit === "px" ? "px" : "percent",
			);
			if (block.children) collect(block.children);
		});
	};
	collect(blocks);
	const rectUnit: DesignRectUnit =
		units.has("px") && !units.has("percent") ? "px" : "percent";

	return {
		type: pageType,
		label: getDesignPageDisplayName(fileName),
		fileName,
		filePath,
		blocks,
		rawMarkdown: markdown,
		hasUnsupportedContent: blocks.some((block) => block.type === "raw"),
		rectUnit,
		unitWarnings: warnings.length > 0 ? warnings : undefined,
	};
}

function readCssValue(css: string, key: string, fallback: string): string {
	const match = css.match(new RegExp(`${key}\\s*:\\s*([^;]+);`));
	return match?.[1]?.trim() || fallback;
}

function readNumberValue(css: string, key: string, fallback: number): number {
	const value = readCssValue(css, key, `${fallback}`);
	const parsed = Number(value.replace(/[^\d.]/g, ""));
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseThemeDraft(
	designName: string,
	cssContent: string,
	settings?: Pick<SlidesRupSettings, "slidesRupThemeColor">,
): ThemeStyleDraft {
	const lines = cssContent.split("\n");
	const headerDirectives = lines.filter((line) => {
		const trimmed = line.trim();
		return trimmed.startsWith("/* @theme") || trimmed.startsWith("@import");
	});
	const rawCss = lines
		.filter((line) => !headerDirectives.includes(line))
		.join("\n")
		.trim();
	const fallbackPrimaryColor =
		settings?.slidesRupThemeColor || DEFAULT_SETTINGS.slidesRupThemeColor;

	return {
		themeName: `sr-design-${designName.toLowerCase()}`,
		primaryColor: readCssValue(
			rawCss,
			"--sr-dm-primary",
			fallbackPrimaryColor,
		),
		secondaryColor: readCssValue(rawCss, "--sr-dm-secondary", "#7c3aed"),
		backgroundColor: readCssValue(rawCss, "--sr-dm-background", "#ffffff"),
		textColor: readCssValue(rawCss, "--sr-dm-text", "#111111"),
		headingFont: readCssValue(rawCss, "--sr-dm-heading-font", "inherit"),
		bodyFont: readCssValue(rawCss, "--sr-dm-body-font", "inherit"),
		headingScale: readNumberValue(rawCss, "--sr-dm-heading-scale", 1),
		bodyScale: readNumberValue(rawCss, "--sr-dm-body-scale", 1),
		borderRadius: readNumberValue(rawCss, "--sr-dm-radius", 24),
		shadowOpacity: readNumberValue(rawCss, "--sr-dm-shadow-opacity", 0.18),
		mode:
			readCssValue(rawCss, "--sr-dm-mode", "light") === "dark"
				? "dark"
				: "light",
		headerDirectives,
		rawCss,
	};
}
