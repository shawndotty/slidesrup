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
		extraAttributes: {},
	};
}

function appendRawBlocksAndFootnotes(
	raw: string,
	blocks: DesignCanvasBlock[],
	state: {
		hasFootnotesBlock: boolean;
	},
): void {
	const normalizedRaw = raw.trim();
	if (!normalizedRaw) return;
	const footnotesRegex = /<%\?\s*footnotes\s*%>/g;
	if (!footnotesRegex.test(normalizedRaw)) {
		const rawBlock = createRawBlock(raw);
		if (rawBlock) blocks.push(rawBlock);
		return;
	}
	const segments = normalizedRaw.split(footnotesRegex);
	segments.forEach((segment, index) => {
		const rawBlock = createRawBlock(segment);
		if (rawBlock) blocks.push(rawBlock);
		if (index < segments.length - 1 && !state.hasFootnotesBlock) {
			blocks.push(createFootnotesBlock());
			state.hasFootnotesBlock = true;
		}
	});
}

function createGridBlock(attrSource: string, content: string): DesignGridBlock {
	const attrs = parseAttributes(attrSource);
	const [width, height] = parsePair(attrs.drag || "", 100, 30);
	const [x, y] = parsePair(attrs.drop || "", 0, 0);

	return {
		id: nextBlockId("grid"),
		type: "grid",
		role: inferRole(content),
		rect: {
			x: clampInt(x, 0, 100),
			y: clampInt(y, 0, 100),
			width: clampInt(width, 1, 100),
			height: clampInt(height, 1, 100),
		},
		content: content.trim(),
		className: attrs.class || "",
		style: attrs.style || "",
		pad: attrs.pad || "",
		align: attrs.align || "",
		flow: attrs.flow || "",
		filter: attrs.filter || "",
		justifyContent: attrs["justify-content"] || "",
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
					].includes(key)
				) {
					return result;
				}
				result[key] = value;
				return result;
			},
			{} as Record<string, string>,
		),
	};
}

export function parseDesignPageDraft(
	pageType: DesignPageType,
	designName: string,
	filePath: string,
	markdown: string,
): DesignPageDraft {
	const fileName = getDesignPageFileName(pageType, designName);
	const blocks: DesignCanvasBlock[] = [];
	const footnotesState = {
		hasFootnotesBlock: false,
	};
	const gridRegex = /<grid\b([^>]*)>([\s\S]*?)<\/grid>/g;
	let cursor = 0;
	let match = gridRegex.exec(markdown);

	while (match) {
		const before = markdown.slice(cursor, match.index);
		appendRawBlocksAndFootnotes(before, blocks, footnotesState);
		blocks.push(createGridBlock(match[1], match[2]));
		cursor = match.index + match[0].length;
		match = gridRegex.exec(markdown);
	}

	appendRawBlocksAndFootnotes(markdown.slice(cursor), blocks, footnotesState);

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
