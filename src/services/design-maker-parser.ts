import {
	DesignCanvasBlock,
	DesignGridBlock,
	DesignPageDraft,
	DesignPageType,
	ThemeStyleDraft,
} from "src/types/design-maker";
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

function parsePair(
	value: string,
	fallbackA: number,
	fallbackB: number,
): [number, number] {
	if (!value) return [fallbackA, fallbackB];
	const parts = value
		.trim()
		.split(/\s+/)
		.map((item) => Number(item));
	if (parts.length >= 2 && parts.every((item) => !isNaN(item))) {
		return [parts[0], parts[1]];
	}
	if (value === "topleft") return [0, 0];
	if (value === "topright") return [50, 0];
	if (value === "bottomleft") return [0, 50];
	if (value === "bottomright") return [50, 50];
	return [fallbackA, fallbackB];
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

function createFootnotesBlock(): DesignGridBlock {
	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: "placeholder",
		rect: {
			x: 0,
			y: 92,
			width: 100,
			height: 8,
		},
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

function createSideBarBlock(): DesignGridBlock {
	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: "placeholder",
		rect: {
			x: 95,
			y: 35,
			width: 5,
			height: 30,
		},
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
	state: {
		hasFootnotesBlock: boolean;
		hasSideBarBlock: boolean;
	},
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
				blocks.push(createFootnotesBlock());
				state.hasFootnotesBlock = true;
			}
		} else if (!state.hasSideBarBlock) {
			blocks.push(createSideBarBlock());
			state.hasSideBarBlock = true;
		}
		lastIndex = match.index + token.length;
		match = specialRegex.exec(normalizedRaw);
	}
	const tail = createRawBlock(normalizedRaw.slice(lastIndex));
	if (tail) blocks.push(tail);
}

function createGridBlock(attrSource: string, content: string): DesignGridBlock {
	const attrs = parseAttributes(attrSource);
	const [width, height] = parsePair(attrs.drag || "", 100, 30);
	const [x, y] = parsePair(attrs.drop || "", 0, 0);
	const cleanedContent = stripNestedGridMarkup(content);

	// Parse children recursively
	const rawChildren = parseGridBlocks(content, {
		hasFootnotesBlock: true,
		hasSideBarBlock: true,
	}); // Prevent footnotes/sidebar inside nested grids
	const children = rawChildren.filter((c) => c.type === "grid");

	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: inferRole(content),
		rect: {
			x: clampInt(x, -100, 100),
			y: clampInt(y, -100, 100),
			width: Math.max(1, Math.round(width)),
			height: Math.max(1, Math.round(height)),
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
		extraAttributes: Object.entries(attrs).reduce(
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
		),
		children: children.length > 0 ? children : undefined,
	};
}

function parseGridBlocks(
	markdown: string,
	footnotesState: { hasFootnotesBlock: boolean; hasSideBarBlock: boolean },
): DesignCanvasBlock[] {
	const blocks: DesignCanvasBlock[] = [];
	const { topLevelRanges, segments } = parseGridSegments(markdown);
	if (topLevelRanges.length === 0) {
		appendRawBlocksAndFootnotes(markdown, blocks, footnotesState);
		return blocks;
	}

	let cursor = 0;
	topLevelRanges.forEach((range) => {
		const before = markdown.slice(cursor, range.start);
		appendRawBlocksAndFootnotes(before, blocks, footnotesState);

		// Find the exact segment that corresponds to this topLevelRange
		const segment = segments.find(
			(s) => s.start === range.start && s.end === range.end,
		);
		if (segment) {
			blocks.push(createGridBlock(segment.attrSource, segment.content));
		}

		cursor = range.end;
	});

	appendRawBlocksAndFootnotes(markdown.slice(cursor), blocks, footnotesState);
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

	const blocks = parseGridBlocks(markdown, footnotesState);

	return {
		type: pageType,
		label: getDesignPageDisplayName(fileName),
		fileName,
		filePath,
		blocks,
		rawMarkdown: markdown,
		hasUnsupportedContent: blocks.some((block) => block.type === "raw"),
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

	return {
		themeName: `sr-design-${designName.toLowerCase()}`,
		primaryColor: readCssValue(rawCss, "--sr-dm-primary", "#0044ff"),
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
