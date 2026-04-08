import * as module from "module";
const originalRequire = (module as any).Module.prototype.require;
(module as any).Module.prototype.require = function (...args: any[]) {
	if (args[0] === "obsidian") return {};
	return originalRequire.apply(this, args);
};

import assert from "assert";
import {
	parseDesignPageDraft,
	formatRectInputValue,
	parseRectInputValue,
	parseThemeDraft,
	normalizeCoordinateString,
} from "../services/design-maker-parser";
import {
	generateDesignMakerRuntimeCss,
	generatePageMarkdown,
	normalizeInlineStyleForTemplate,
	normalizePaddingForTemplate,
} from "../services/design-maker-generator";
import {
	clampCanvasZoomPercent,
	computeCanvasTransform,
	computePanForZoom,
	resolveHostDocument,
} from "../ui/components/design-canvas";
import {
	getPlainTextForBlock,
	renderBlockContent,
} from "../ui/components/design-block-renderer";
import {
	computeThumbnailVirtualWindow,
	formatThumbnailBlockCount,
	getNextThumbnailIndex,
} from "../ui/components/design-thumbnail-nav";
import {
	buildReparentDragPayload,
	getInsertIndexForReversedLayerOrder,
	getLayerRenderOrder,
	parseReparentDragPayload,
	resolveLayerDropIntent,
} from "../ui/components/design-page-list";
import {
	buildInlineStylePropertyCompletions,
	buildInlineStyleValueCompletions,
	buildMarkdownImageEmbed,
	clampImagePickerPosition,
	clampOpacityValue,
	detectInlineStyleCompletionMode,
	formatOpacityPercentLabel,
	formatInlineStyleForEditor,
	computeImagePickerPlacement,
	getNextPickerSelectionIndex,
	insertImageEmbedIntoContent,
	insertMarkdownImageIntoContent,
	insertSvgIntoContent,
	isLocalImagePath,
	localizeInspectorSelectOptions,
	normalizeInspectorColorToHex,
	parseBorderComposite,
	parseInspectorOpacityValue,
	resetInspectorI18nWarnCacheForTests,
	resolveOpacityFromTrackPosition,
	composeBorderComposite,
	composePaddingComposite,
	isValidInspectorColor,
	parsePaddingComposite,
	resolvePickerHost,
	syncInspectorRectFields,
	getHtmlElementColors,
	updateHtmlElementColors,
} from "../ui/components/design-inspector";
import { GridTransformer } from "../transformers/gridTransformer";
import { YamlStore } from "../yamlStore";
import en from "../lang/locale/en";
import zhCN from "../lang/locale/zh-cn";
import zhTW from "../lang/locale/zh-tw";
import { DEFAULT_SETTINGS } from "../models/default-settings";
import { dispatchThemeColorChange } from "../services/theme-color-dispatch";
import {
	sanitizeFilterAiOutput,
	sanitizeInlineStyleAiOutput,
	sanitizeSvgAiOutput,
} from "../services/inline-style-ai-service";
import { SecretStoreService } from "../services/secret-store-service";
import {
	buildMarkdownImageFromUrl,
	buildUnsplashCroppedImageUrl,
	buildUnsplashRandomUrl,
	parseAspectRatio,
	parseAspectRatioPresetList,
	resolveCropDimensions,
} from "../services/unsplash-image-service";

function testNestedGridSerialization() {
	const markdown = `<grid drag="70 140" drop="-32 0" class="bg-with-front-color" style="margin-top: -216px" rotate="350">

<grid drag="5 40" drop="97 36" class="bg-with-back-color">

</grid>
</grid>`;

	const draft = parseDesignPageDraft("cover", "test", "test.md", markdown);
	assert.strictEqual(draft.blocks.length, 1, "Should have 1 top-level block");

	const outerGrid = draft.blocks[0] as any;
	assert.strictEqual(outerGrid.type, "grid");
	assert.strictEqual(
		outerGrid.children.length,
		1,
		"Should have 1 child grid",
	);

	const innerGrid = outerGrid.children[0];
	assert.strictEqual(innerGrid.rect.width, 5);
	assert.strictEqual(innerGrid.rect.height, 40);
	assert.strictEqual(innerGrid.rect.x, 97);
	assert.strictEqual(innerGrid.rect.y, 36);

	const generated = generatePageMarkdown(draft);

	const reParsed = parseDesignPageDraft(
		"cover",
		"test",
		"test.md",
		generated,
	);
	assert.strictEqual(reParsed.blocks.length, 1);
	assert.strictEqual((reParsed.blocks[0] as any).children.length, 1);

	console.log("testNestedGridSerialization passed");
}

function testCoordinateConversion() {
	class MockDOMRect {
		constructor(
			public left: number,
			public top: number,
			public width: number,
			public height: number,
		) {}
	}

	const globalRect = new MockDOMRect(150, 150, 50, 50); // 50x50 block at global 150,150
	const parentRect = new MockDOMRect(100, 100, 200, 200); // 200x200 parent at global 100,100

	const newX = ((globalRect.left - parentRect.left) / parentRect.width) * 100;
	const newY = ((globalRect.top - parentRect.top) / parentRect.height) * 100;
	const newWidth = (globalRect.width / parentRect.width) * 100;
	const newHeight = (globalRect.height / parentRect.height) * 100;

	assert.strictEqual(newX, 25);
	assert.strictEqual(newY, 25);
	assert.strictEqual(newWidth, 25);
	assert.strictEqual(newHeight, 25);

	console.log("testCoordinateConversion passed");
}

function testTreeCircularDependency() {
	// mock the _findBlockById and circular dependency logic
	const blocks: any[] = [
		{
			id: "A",
			type: "grid",
			children: [
				{
					id: "B",
					type: "grid",
					children: [{ id: "C", type: "grid" }],
				},
			],
		},
	];

	const _findBlockById = (blocksArr: any[], id: string): any => {
		for (let i = 0; i < blocksArr.length; i++) {
			const block = blocksArr[i];
			if (block.id === id) return { block, index: i };
			if (block.type === "grid" && block.children) {
				const found = _findBlockById(block.children, id);
				if (found) return { ...found, parent: block };
			}
		}
		return null;
	};

	const sourceId = "A";
	const targetId = "C";

	// Check for circular dependency logic from design-maker-view.ts
	let hasCircular = false;
	const targetFound = _findBlockById(blocks, targetId);
	if (targetFound && targetFound.block.type === "grid") {
		let currentCheck = targetFound.parent;
		while (currentCheck) {
			if (currentCheck.id === sourceId) {
				hasCircular = true;
				break;
			}
			currentCheck = _findBlockById(blocks, currentCheck.id)?.parent;
		}
	}

	assert.strictEqual(
		hasCircular,
		true,
		"Should detect circular dependency when dropping A into C",
	);
	console.log("testTreeCircularDependency passed");
}

function testDesignMakerRuntimeCssHasHelperClasses() {
	const theme = parseThemeDraft("Test", "");
	const css = generateDesignMakerRuntimeCss(theme);
	assert.ok(
		css.includes(".bg-with-front-color"),
		"Should include .bg-with-front-color helper class",
	);
	assert.ok(
		css.includes(".bg-with-back-color"),
		"Should include .bg-with-back-color helper class",
	);
	assert.ok(
		css.includes(".slides-rup-design-maker-canvas") ||
			css.includes(".slides-rup-design-maker-preview"),
		"Should scope helper CSS to Design Maker containers",
	);
	console.log("testDesignMakerRuntimeCssHasHelperClasses passed");
}

function testParseThemeDraftPrimaryColorFallbackFromSettings() {
	const fallbackTheme = parseThemeDraft("Test", "");
	assert.strictEqual(
		fallbackTheme.primaryColor,
		DEFAULT_SETTINGS.slidesRupThemeColor,
		"primaryColor fallback should come from DEFAULT_SETTINGS.slidesRupThemeColor",
	);

	const settingsColor = "#123456";
	const settingsTheme = parseThemeDraft("Test", "", {
		slidesRupThemeColor: settingsColor,
	});
	assert.strictEqual(
		settingsTheme.primaryColor,
		settingsColor,
		"primaryColor fallback should use SlidesRupSettings.slidesRupThemeColor when provided",
	);

	const cssTheme = parseThemeDraft(
		"Test",
		":root { --sr-dm-primary: #abcdef; }",
		{ slidesRupThemeColor: settingsColor },
	);
	assert.strictEqual(
		cssTheme.primaryColor,
		"#abcdef",
		"CSS --sr-dm-primary should override settings fallback",
	);
	console.log("testParseThemeDraftPrimaryColorFallbackFromSettings passed");
}

function testSelectionDebounceStateMachine() {
	const machine = (() => {
		let lastApplied: string | null = null;
		let selected: string | null = null;
		return {
			select(next: string | null) {
				selected = next;
			},
			apply() {
				const previous = lastApplied;
				const next = selected;
				lastApplied = next;
				return { previous, next };
			},
		};
	})();

	machine.select("A");
	machine.select("B");
	machine.select("C");
	const first = machine.apply();
	assert.deepStrictEqual(first, { previous: null, next: "C" });

	machine.select(null);
	const second = machine.apply();
	assert.deepStrictEqual(second, { previous: "C", next: null });

	console.log("testSelectionDebounceStateMachine passed");
}

function testNestedBlockVisibilityToggle() {
	type Block = {
		id: string;
		type: "grid" | "raw";
		hiddenInDesign?: boolean;
		children?: Block[];
	};

	const findById = (blocks: Block[], id: string): Block | null => {
		for (const block of blocks) {
			if (block.id === id) return block;
			if (block.type === "grid" && block.children) {
				const found = findById(block.children, id);
				if (found) return found;
			}
		}
		return null;
	};

	const blocks: Block[] = [
		{
			id: "parent",
			type: "grid",
			children: [{ id: "child", type: "grid" }],
		},
	];

	const child = findById(blocks, "child");
	assert.ok(child, "Should find nested child block");
	assert.strictEqual(child.hiddenInDesign, undefined);
	child.hiddenInDesign = true;
	assert.strictEqual(findById(blocks, "child")?.hiddenInDesign, true);

	const parent = findById(blocks, "parent");
	assert.ok(parent, "Should find parent block");
	parent.hiddenInDesign = true;
	parent.hiddenInDesign = false;
	assert.strictEqual(findById(blocks, "parent")?.hiddenInDesign, false);

	console.log("testNestedBlockVisibilityToggle passed");
}

function testCanvasZoomTransformMath() {
	assert.strictEqual(clampCanvasZoomPercent(0), 25);
	assert.strictEqual(clampCanvasZoomPercent(500), 400);
	assert.strictEqual(clampCanvasZoomPercent(123.4), 123);

	const transform = computeCanvasTransform({
		frameWidth: 960,
		frameHeight: 540,
		baseWidth: 1920,
		baseHeight: 1080,
		zoomPercent: 200,
		panX: 10,
		panY: 20,
	});
	assert.strictEqual(transform.scale, 1);
	assert.strictEqual(transform.transform, "translate(10px, 20px) scale(1)");

	const resetTransform = computeCanvasTransform({
		frameWidth: 960,
		frameHeight: 540,
		baseWidth: 1920,
		baseHeight: 1080,
		zoomPercent: 100,
		panX: 0,
		panY: 0,
	});
	assert.strictEqual(resetTransform.scale, 0.5);
	assert.strictEqual(
		resetTransform.transform,
		"translate(0px, 0px) scale(0.5)",
	);

	const nextPan = computePanForZoom({
		cursorX: 100,
		cursorY: 100,
		panX: 0,
		panY: 0,
		currentScale: 1,
		nextScale: 2,
	});
	assert.deepStrictEqual(nextPan, { panX: -100, panY: -100 });

	console.log("testCanvasZoomTransformMath passed");
}

function testResolveHostDocumentForPopoutWindow() {
	const fallback = resolveHostDocument({} as HTMLElement);
	assert.ok(fallback, "Should fallback to current document when ownerDocument absent");
	const ownerDoc = { body: {} } as Document;
	const resolved = resolveHostDocument({
		ownerDocument: ownerDoc,
	} as unknown as HTMLElement);
	assert.strictEqual(
		resolved,
		ownerDoc,
		"Should prefer container.ownerDocument for popout-window safety",
	);
	console.log("testResolveHostDocumentForPopoutWindow passed");
}

function testResolvePickerHostForPopoutWindow() {
	const ownerDoc = { body: {}, defaultView: { innerWidth: 800 } } as any;
	const triggerEl = { ownerDocument: ownerDoc } as HTMLElement;
	const resolved = resolvePickerHost(triggerEl);
	assert.strictEqual(
		resolved.hostDocument,
		ownerDoc,
		"Should prefer trigger ownerDocument for picker host",
	);
	assert.strictEqual(
		resolved.hostWindow,
		ownerDoc.defaultView,
		"Should use ownerDocument.defaultView for picker host window",
	);
	console.log("testResolvePickerHostForPopoutWindow passed");
}

function testGridPlainTextFallbackRendering() {
	const plainResult = renderBlockContent({} as HTMLElement, "Hello Grid");
	assert.strictEqual(
		plainResult.rendered,
		false,
		"Plain text content should not be handled by rich renderer",
	);
	assert.strictEqual(
		getPlainTextForBlock(plainResult),
		"Hello Grid",
		"Plain text should fallback to text-node rendering path",
	);

	const styleHost = {
		createEl: () => ({ textContent: "" }),
	} as any as HTMLElement;
	const styleAndTextResult = renderBlockContent(
		styleHost,
		"<style>.x{color:red;}</style>Visible text",
	);
	assert.strictEqual(
		getPlainTextForBlock(styleAndTextResult),
		"Visible text",
		"Style blocks should be stripped and keep visible text fallback",
	);

	const renderedResult = {
		rendered: true,
		hidden: false,
		textContent: "ignored",
	};
	assert.strictEqual(
		getPlainTextForBlock(renderedResult),
		"",
		"Rendered rich content should not duplicate plain text fallback",
	);
	console.log("testGridPlainTextFallbackRendering passed");
}

function testDesignTemplateUnitConsistency() {
	const pxMarkdown = `<grid drag="80px 100px" drop="10px 20px" class="bg-with-front-color">\n</grid>`;
	const pxPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		pxMarkdown,
	);
	assert.strictEqual(
		pxPage.rectUnit,
		"px",
		"Should detect px unit from template",
	);
	const pxSerialized = generatePageMarkdown(pxPage);
	assert.ok(
		pxSerialized.includes(`drag="80px 100px"`),
		"Should keep px unit in drag on save",
	);
	assert.ok(
		pxSerialized.includes(`drop="10px 20px"`),
		"Should keep px unit in drop on save",
	);

	const percentMarkdown = `<grid drag="100 80" drop="0 0" class="bg-with-front-color">\n</grid>`;
	const percentPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		percentMarkdown,
	);
	assert.strictEqual(
		percentPage.rectUnit,
		"percent",
		"Should detect percent unit from bare numbers",
	);

	// Test the specific user case: drag in px, drop in mixed units
	const mixedUserMarkdown = `<grid drag="200px 200px" drop="45 20">\n</grid>`;
	const mixedUserPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		mixedUserMarkdown,
	);
	assert.strictEqual(
		mixedUserPage.rectUnit,
		"px",
		"Block with any px should be parsed as px unit overall",
	);
	const mixedUserGrid = mixedUserPage.blocks[0] as any;
	assert.strictEqual(
		mixedUserGrid.rect.width,
		200,
		"Width should be parsed as 200px",
	);
	assert.strictEqual(
		mixedUserGrid.rect.height,
		200,
		"Height should be parsed as 200px",
	);
	assert.strictEqual(
		mixedUserGrid.rect.x,
		864,
		"X should be parsed as 864px (45% of 1920) in px mode drop",
	);
	assert.strictEqual(
		mixedUserGrid.rect.y,
		216,
		"Y should be parsed as 216px (20% of 1080) in px mode drop",
	);

	const mixedPercentMarkdown = `<grid drag="200px 200px" drop="50% 100">\n</grid>`;
	const mixedPercentPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		mixedPercentMarkdown,
	);
	const mixedPercentGrid = mixedPercentPage.blocks[0] as any;
	assert.strictEqual(
		mixedPercentGrid.rect.x,
		960,
		"X should be 960px (50% of 1920)",
	);
	assert.strictEqual(
		mixedPercentGrid.rect.y,
		1080,
		"Y should be 1080px (100% of 1080) when drop uses unitless number in px mode",
	);

	const nestedSingleLevelMarkdown = `<grid drag="960px 540px" drop="0px 0px">\n<grid drag="200px 100px" drop="50 50">\n</grid>\n</grid>`;
	const nestedSingleLevelPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		nestedSingleLevelMarkdown,
	);
	const nestedSingleLevelParent = nestedSingleLevelPage.blocks[0] as any;
	const nestedSingleLevelChild = nestedSingleLevelParent.children?.[0] as any;
	assert.strictEqual(
		nestedSingleLevelChild.rect.x,
		480,
		"Single-level nested drop.x should use parent width (50% of 960)",
	);
	assert.strictEqual(
		nestedSingleLevelChild.rect.y,
		270,
		"Single-level nested drop.y should use parent height (50% of 540)",
	);

	const pxModeUnitlessDragMarkdown = `<grid drag="960px 540px" drop="0px 0px">\n<grid drag="200 100" drop="50 50">\n</grid>\n</grid>`;
	const pxModeUnitlessDragPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		pxModeUnitlessDragMarkdown,
	);
	const pxModeUnitlessDragParent = pxModeUnitlessDragPage.blocks[0] as any;
	const pxModeUnitlessDragChild = pxModeUnitlessDragParent
		.children?.[0] as any;
	assert.strictEqual(
		pxModeUnitlessDragChild.rect.width,
		200,
		"Regression: in px mode, unitless drag width should keep legacy px behavior",
	);
	assert.strictEqual(
		pxModeUnitlessDragChild.rect.height,
		100,
		"Regression: in px mode, unitless drag height should keep legacy px behavior",
	);
	assert.strictEqual(
		pxModeUnitlessDragChild.rect.x,
		480,
		"In px mode, drop unitless x should keep percent-to-parent conversion (50% of 960)",
	);
	assert.strictEqual(
		pxModeUnitlessDragChild.rect.y,
		270,
		"In px mode, drop unitless y should keep percent-to-parent conversion (50% of 540)",
	);

	const nestedMultiLevelMarkdown = `<grid drag="1000px 800px" drop="0px 0px">\n<grid drag="500px 400px" drop="10 25">\n<grid drag="100px 100px" drop="50 50">\n</grid>\n</grid>\n</grid>`;
	const nestedMultiLevelPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		nestedMultiLevelMarkdown,
	);
	const nestedOuter = nestedMultiLevelPage.blocks[0] as any;
	const nestedMiddle = nestedOuter.children?.[0] as any;
	const nestedInner = nestedMiddle.children?.[0] as any;
	assert.strictEqual(
		nestedMiddle.rect.x,
		100,
		"Multi-level middle drop.x should use outer width (10% of 1000)",
	);
	assert.strictEqual(
		nestedMiddle.rect.y,
		200,
		"Multi-level middle drop.y should use outer height (25% of 800)",
	);
	assert.strictEqual(
		nestedInner.rect.x,
		250,
		"Multi-level inner drop.x should use middle width (50% of 500)",
	);
	assert.strictEqual(
		nestedInner.rect.y,
		200,
		"Multi-level inner drop.y should use middle height (50% of 400)",
	);

	const mixedMarkdown = `<grid drag="80px 100px" drop="0px 0px">\n</grid>\n\n<grid drag="100 80" drop="0 0">\n</grid>`;
	const mixedPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		mixedMarkdown,
	);
	assert.strictEqual(
		mixedPage.rectUnit,
		"percent",
		"Mixed blocks should not force whole page to px",
	);
	const mixedGridA = mixedPage.blocks[0] as any;
	const mixedGridB = mixedPage.blocks[1] as any;
	assert.strictEqual(
		mixedGridA.extraAttributes.rectUnit,
		"px",
		"Px block should keep rectUnit=px",
	);
	assert.ok(
		!mixedGridB.extraAttributes.rectUnit,
		"Percent block should not be marked as px",
	);
	const mixedSerialized = generatePageMarkdown(mixedPage);
	assert.ok(
		mixedSerialized.includes(`drag="80px 100px"`),
		"Px block should serialize drag with px",
	);
	assert.ok(
		mixedSerialized.includes(`drag="100 80"`),
		"Percent block should serialize drag as bare numbers",
	);

	const remMarkdown = `<grid drag="2rem 3rem" drop="1rem 1rem">\n</grid>`;
	const remPage = parseDesignPageDraft(
		"content",
		"test",
		"test.md",
		remMarkdown,
	);
	assert.strictEqual(
		remPage.rectUnit,
		"percent",
		"Unsupported unit should not switch to px by itself",
	);
	assert.ok(
		(remPage.unitWarnings || []).length > 0,
		"Should warn for unsupported units",
	);
	const remSerialized = generatePageMarkdown(remPage);
	assert.ok(
		remSerialized.includes(`drag="2 3"`),
		"Unsupported units should be auto-corrected to numbers",
	);

	const pxLabel = formatRectInputValue(80, "px");
	const percentLabel = formatRectInputValue(100, "percent");
	assert.strictEqual(pxLabel, "80px", "Inspector should show px suffix");
	assert.strictEqual(
		percentLabel,
		"100",
		"Inspector should show bare number",
	);
	assert.deepStrictEqual(parseRectInputValue("80px"), {
		value: 80,
		rectUnit: "px",
	});
	assert.deepStrictEqual(parseRectInputValue("100"), {
		value: 100,
		rectUnit: "percent",
	});

	// Test the new normalization function and parsing logic
	assert.strictEqual(
		normalizeCoordinateString("100"),
		"100px",
		"Should add px to pure number",
	);
	assert.strictEqual(
		normalizeCoordinateString("100px"),
		"100px",
		"Should keep px unchanged",
	);
	assert.strictEqual(
		normalizeCoordinateString("50%"),
		"50%",
		"Should keep percent unchanged",
	);
	assert.strictEqual(
		normalizeCoordinateString("50% 100"),
		"50% 100px",
		"Should handle mixed units correctly",
	);

	// Test the new defaultUnitForUnitless in parseRectInputValue
	assert.deepStrictEqual(parseRectInputValue("100", "px"), {
		value: 100,
		rectUnit: "px",
	});
	assert.deepStrictEqual(parseRectInputValue("100", "percent"), {
		value: 100,
		rectUnit: "percent",
	});
	assert.deepStrictEqual(parseRectInputValue("50%", "px"), {
		value: 50,
		rectUnit: "percent",
	});

	const baseWidth = 1920;
	const widthPercent = 50;
	const expectedPx = (baseWidth * widthPercent) / 100;
	const actualPx = (baseWidth * widthPercent) / 100;
	assert.ok(
		Math.abs(actualPx - expectedPx) <= 1,
		"Percent-to-px rendering math should be within ±1px",
	);

	console.log("testDesignTemplateUnitConsistency passed");
}

function testAdvancedSlidesWidthHeightParsing() {
	(YamlStore.getInstance() as any).options = {
		width: 1920,
		height: 1080,
		center: true,
	};

	const transformer = new GridTransformer();

	const relRatio = transformer.read("5 12", "0 0", false);
	assert.ok(relRatio, "Relative ratio should parse");
	assert.strictEqual(relRatio?.get("width"), 5);
	assert.strictEqual(relRatio?.get("height"), 12);
	assert.strictEqual(relRatio?.get("x"), 0);
	assert.strictEqual(relRatio?.get("y"), 0);

	const relPx = transformer.read("200px 300px", "0 0", false);
	assert.ok(relPx, "Relative px should parse");
	assert.ok(
		Math.abs((relPx?.get("width") ?? 0) - 10.4166667) < 0.01,
		"Relative px width should convert to percentage",
	);
	assert.ok(
		Math.abs((relPx?.get("height") ?? 0) - 27.7777778) < 0.01,
		"Relative px height should convert to percentage",
	);

	const absRatio = transformer.read("5 10", "0 0", true);
	assert.ok(absRatio, "Absolute ratio should parse");
	assert.strictEqual(absRatio?.get("width"), 96);
	assert.strictEqual(absRatio?.get("height"), 108);

	const absPx = transformer.read("200px 300px", "0 0", true);
	assert.ok(absPx, "Absolute px should parse");
	assert.strictEqual(absPx?.get("width"), 200);
	assert.strictEqual(absPx?.get("height"), 300);

	const relNegXY = transformer.read("5 5", "-10 20", false);
	assert.ok(relNegXY, "Relative negative XY should parse");
	assert.strictEqual(relNegXY?.get("x"), -10);
	assert.strictEqual(relNegXY?.get("y"), 20);

	const absNegPxXY = transformer.read("5 5", "-20px 30px", true);
	assert.ok(absNegPxXY, "Absolute px negative XY should parse");
	assert.strictEqual(absNegPxXY?.get("x"), -20);
	assert.strictEqual(absNegPxXY?.get("y"), 30);

	assert.strictEqual(
		transformer.read("0px 300px", "0 0", false),
		undefined,
		"Invalid px width should be rejected",
	);
	assert.strictEqual(
		transformer.read("5.5 10", "0 0", false),
		undefined,
		"Invalid ratio width should be rejected",
	);
	assert.strictEqual(
		transformer.read("-5 10", "0 0", false),
		undefined,
		"Negative ratio width should be rejected",
	);

	console.log("testAdvancedSlidesWidthHeightParsing passed");
}

function testInspectorRectFieldRealtimeSync() {
	const inputMap: Record<string, any> = {
		x: { value: "", setAttr: (_name: string, _value: string) => {} },
		y: { value: "", setAttr: (_name: string, _value: string) => {} },
		width: { value: "", setAttr: (_name: string, _value: string) => {} },
		height: { value: "", setAttr: (_name: string, _value: string) => {} },
	};
	const container = {
		querySelector: (selector: string) => {
			const match = selector.match(
				/data-rect-field="(x|y|width|height)"/,
			);
			if (!match) return null;
			return inputMap[match[1]];
		},
	};

	syncInspectorRectFields({
		container: container as any,
		rect: { x: 12, y: 34, width: 220, height: 160 },
		rectUnit: "px",
	});
	assert.strictEqual(inputMap.x.value, "12px");
	assert.strictEqual(inputMap.y.value, "34px");
	assert.strictEqual(inputMap.width.value, "220px");
	assert.strictEqual(inputMap.height.value, "160px");

	syncInspectorRectFields({
		container: container as any,
		rect: { x: 7, y: 8, width: 40, height: 25 },
		rectUnit: "percent",
	});
	assert.strictEqual(inputMap.x.value, "7");
	assert.strictEqual(inputMap.y.value, "8");
	assert.strictEqual(inputMap.width.value, "40");
	assert.strictEqual(inputMap.height.value, "25");
	console.log("testInspectorRectFieldRealtimeSync passed");
}

function testOpacitySliderValueHelpers() {
	assert.strictEqual(
		clampOpacityValue(-0.5),
		0,
		"Opacity clamp should keep lower bound at 0",
	);
	assert.strictEqual(
		clampOpacityValue(1.5),
		1,
		"Opacity clamp should keep upper bound at 1",
	);
	assert.strictEqual(
		clampOpacityValue(Number.NaN),
		1,
		"Opacity clamp should fallback invalid value to 1",
	);

	assert.strictEqual(
		parseInspectorOpacityValue(""),
		1,
		"Empty opacity should fallback to 1",
	);
	assert.strictEqual(
		parseInspectorOpacityValue("0.42"),
		0.42,
		"Valid opacity string should parse as number",
	);
	assert.strictEqual(
		parseInspectorOpacityValue("abc"),
		1,
		"Invalid opacity string should fallback to 1",
	);

	assert.strictEqual(
		formatOpacityPercentLabel(0.245),
		"25%",
		"Opacity label should format to nearest integer percentage",
	);

	assert.strictEqual(
		resolveOpacityFromTrackPosition({
			clientX: 50,
			trackLeft: 0,
			trackWidth: 200,
		}),
		0.25,
		"Pointer position should map to proportional opacity value",
	);
	assert.strictEqual(
		resolveOpacityFromTrackPosition({
			clientX: -20,
			trackLeft: 0,
			trackWidth: 200,
		}),
		0,
		"Pointer left overflow should clamp to 0",
	);
	assert.strictEqual(
		resolveOpacityFromTrackPosition({
			clientX: 300,
			trackLeft: 0,
			trackWidth: 200,
		}),
		1,
		"Pointer right overflow should clamp to 1",
	);
	assert.strictEqual(
		resolveOpacityFromTrackPosition({
			clientX: 100,
			trackLeft: 0,
			trackWidth: 0,
		}),
		0,
		"Zero-width slider track should return 0 safely",
	);

	console.log("testOpacitySliderValueHelpers passed");
}

function testBackgroundColorPickerValueHelpers() {
	assert.strictEqual(
		isValidInspectorColor("#ff8800"),
		true,
		"Hex color should be valid",
	);
	assert.strictEqual(
		isValidInspectorColor("rgb(12, 34, 56)"),
		true,
		"RGB color should be valid",
	);
	assert.strictEqual(
		isValidInspectorColor("hsl(210, 40%, 50%)"),
		true,
		"HSL color should be valid",
	);
	assert.strictEqual(
		isValidInspectorColor("not-a-color"),
		false,
		"Invalid color token should be rejected",
	);
	assert.strictEqual(
		normalizeInspectorColorToHex("#abc"),
		"#aabbcc",
		"Short hex should normalize to 6-digit hex",
	);
	assert.strictEqual(
		normalizeInspectorColorToHex("#AABBCC"),
		"#aabbcc",
		"6-digit hex should normalize to lowercase",
	);
	console.log("testBackgroundColorPickerValueHelpers passed");
}

function testBorderCompositeHelpers() {
	const parsed = parseBorderComposite("2px dashed #ff0000");
	assert.deepStrictEqual(parsed, {
		width: 2,
		style: "dashed",
		color: "#ff0000",
	});
	const parsedComplex = parseBorderComposite("1px solid var(--accent-color)");
	assert.deepStrictEqual(parsedComplex, {
		width: 1,
		style: "solid",
		color: "#ffffff",
	});
	const parsedInvalid = parseBorderComposite("invalid-border-value");
	assert.deepStrictEqual(parsedInvalid, {
		width: 0,
		style: "solid",
		color: "#ffffff",
	});
	assert.strictEqual(
		composeBorderComposite({
			width: 0,
			style: "solid",
			color: "#ffffff",
		}),
		"0px solid #ffffff",
		"Width=0 should still compose structured border value",
	);
	const localizedBorderStyle = localizeInspectorSelectOptions([
		{ value: "solid", label: "Border Solid" },
	]);
	assert.ok(
		localizedBorderStyle[0].label !== "Border Solid",
		"Border style label should resolve from i18n map",
	);
	console.log("testBorderCompositeHelpers passed");
}

function testPaddingCompositeHelpers() {
	assert.deepStrictEqual(parsePaddingComposite(""), {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});
	assert.deepStrictEqual(parsePaddingComposite("12px"), {
		top: 12,
		right: 12,
		bottom: 12,
		left: 12,
	});
	assert.deepStrictEqual(parsePaddingComposite("12px 8px"), {
		top: 12,
		right: 8,
		bottom: 12,
		left: 8,
	});
	assert.deepStrictEqual(parsePaddingComposite("12px 8px 4px"), {
		top: 12,
		right: 8,
		bottom: 4,
		left: 8,
	});
	assert.deepStrictEqual(parsePaddingComposite("12px 8px 4px 2px"), {
		top: 12,
		right: 8,
		bottom: 4,
		left: 2,
	});
	assert.strictEqual(
		composePaddingComposite({ top: 12, right: 8, bottom: 4, left: 2 }),
		"12px 8px 4px 2px",
	);
	assert.strictEqual(
		normalizePaddingForTemplate("12px 8px"),
		"12px 8px 12px 8px",
		"Generator should normalize two-value shorthand to four values",
	);
	assert.strictEqual(
		normalizePaddingForTemplate(""),
		"",
		"Empty padding should stay empty in generator normalization",
	);
	console.log("testPaddingCompositeHelpers passed");
}

function testInsertLocalImageEmbed() {
	assert.strictEqual(isLocalImagePath("assets/logo.png"), true);
	assert.strictEqual(isLocalImagePath("assets/photo.JPEG"), true);
	assert.strictEqual(isLocalImagePath("assets/doc.md"), false);
	assert.strictEqual(isLocalImagePath("assets/noext"), false);

	assert.strictEqual(
		insertImageEmbedIntoContent("", "assets/cover.png"),
		"![[assets/cover.png]]",
	);
	assert.strictEqual(
		insertImageEmbedIntoContent("Hello", "assets/cover.png"),
		"Hello\n![[assets/cover.png]]",
	);
	assert.strictEqual(
		insertImageEmbedIntoContent("Hello\n", "assets/cover.png"),
		"Hello\n![[assets/cover.png]]",
	);

	console.log("testInsertLocalImageEmbed passed");
}

function testInsertSvgIntoContent() {
	const svg = `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="30" fill="currentColor" /></svg>`;
	assert.strictEqual(insertSvgIntoContent("", svg), svg);
	assert.strictEqual(
		insertSvgIntoContent("Hello", svg),
		`Hello\n${svg}`,
		"Should append SVG on a new line for non-empty content",
	);
	assert.strictEqual(
		insertSvgIntoContent("Hello\n", svg),
		`Hello\n${svg}`,
		"Should normalize trailing newline before append",
	);
	console.log("testInsertSvgIntoContent passed");
}

function testUnsplashImageInsertHelpers() {
	const url = "https://images.unsplash.com/photo-1";
	assert.strictEqual(
		buildMarkdownImageFromUrl(url),
		"![](https://images.unsplash.com/photo-1)",
	);
	assert.strictEqual(
		buildMarkdownImageEmbed(url),
		"![](https://images.unsplash.com/photo-1)",
	);
	assert.strictEqual(
		insertMarkdownImageIntoContent("", url),
		"![](https://images.unsplash.com/photo-1)",
	);
	assert.strictEqual(
		insertMarkdownImageIntoContent("Hello", url),
		"Hello\n![](https://images.unsplash.com/photo-1)",
	);
	const randomUrl = buildUnsplashRandomUrl("mountain night");
	assert.ok(
		randomUrl.includes("images.unsplash.com/photo-"),
		"Fallback Unsplash URL should use stable images.unsplash.com endpoint",
	);
	assert.strictEqual(
		randomUrl,
		buildUnsplashRandomUrl("mountain night"),
		"Fallback Unsplash URL should be deterministic for same keyword",
	);
	assert.ok(
		randomUrl.includes("fit=crop"),
		"Fallback Unsplash URL should include crop params",
	);
	assert.ok(
		randomUrl.includes("w=1920") && randomUrl.includes("h=1080"),
		"Fallback Unsplash URL should default to 1920x1080 crop",
	);
	const customCropRandom = buildUnsplashRandomUrl("mountain night", {
		aspectRatio: "1:1",
		baseCropWidth: 1200,
		baseCropHeight: 1200,
	});
	assert.ok(
		customCropRandom.includes("w=1200") && customCropRandom.includes("h=1200"),
		"Fallback random URL should respect custom crop dimensions",
	);
	const croppedUrl = buildUnsplashCroppedImageUrl(
		"https://images.unsplash.com/photo-1?ixid=abc",
		{ width: 1440, height: 1080 },
	);
	assert.ok(
		croppedUrl.includes("w=1440") && croppedUrl.includes("h=1080"),
		"Cropped URL builder should append width/height params",
	);
	console.log("testUnsplashImageInsertHelpers passed");
}

function testUnsplashRatioParsingAndCropResolve() {
	assert.deepStrictEqual(parseAspectRatio("16:9"), {
		label: "16:9",
		width: 16,
		height: 9,
	});
	assert.deepStrictEqual(parseAspectRatio(" 4 / 3 "), {
		label: "4:3",
		width: 4,
		height: 3,
	});
	assert.strictEqual(parseAspectRatio("0:3"), null);
	assert.strictEqual(parseAspectRatio("abc"), null);

	assert.deepStrictEqual(parseAspectRatioPresetList("16:9,4:3,16:9,1:1"), [
		"16:9",
		"4:3",
		"1:1",
	]);

	const cropDefault = resolveCropDimensions({
		aspectRatio: "16:9",
		baseCropWidth: 1920,
		baseCropHeight: 1080,
	});
	assert.deepStrictEqual(cropDefault, {
		width: 1920,
		height: 1080,
		ratioLabel: "16:9",
	});
	const cropSquare = resolveCropDimensions({
		aspectRatio: "1:1",
		baseCropWidth: 1920,
		baseCropHeight: 1080,
	});
	assert.deepStrictEqual(cropSquare, {
		width: 1080,
		height: 1080,
		ratioLabel: "1:1",
	});
	const cropPortrait = resolveCropDimensions({
		aspectRatio: "9:16",
		baseCropWidth: 1920,
		baseCropHeight: 1080,
	});
	assert.deepStrictEqual(cropPortrait, {
		width: 608,
		height: 1080,
		ratioLabel: "9:16",
	});
	console.log("testUnsplashRatioParsingAndCropResolve passed");
}

function testImagePickerPlacementAndSelection() {
	const bottomPlacement = computeImagePickerPlacement({
		triggerRect: {
			left: 700,
			right: 780,
			top: 100,
			bottom: 130,
		} as DOMRect,
		pickerWidth: 360,
		pickerHeight: 280,
		viewportWidth: 1280,
		viewportHeight: 720,
	});
	assert.strictEqual(bottomPlacement.placement, "bottom");
	assert.ok(
		bottomPlacement.top > 130,
		"Should place below when space is enough",
	);

	const topPlacement = computeImagePickerPlacement({
		triggerRect: {
			left: 700,
			right: 780,
			top: 690,
			bottom: 710,
		} as DOMRect,
		pickerWidth: 360,
		pickerHeight: 280,
		viewportWidth: 1280,
		viewportHeight: 720,
	});
	assert.strictEqual(topPlacement.placement, "top");
	assert.ok(
		topPlacement.top < 690,
		"Should place above when bottom space is too small",
	);

	const clamped = clampImagePickerPosition({
		left: -200,
		top: 900,
		pickerWidth: 360,
		pickerHeight: 300,
		viewportWidth: 1024,
		viewportHeight: 768,
		margin: 12,
	});
	assert.strictEqual(
		clamped.left,
		12,
		"Should clamp left to viewport margin",
	);
	assert.strictEqual(
		clamped.top,
		456,
		"Should clamp bottom overflow to max top",
	);

	assert.strictEqual(
		getNextPickerSelectionIndex(0, 3, 1),
		1,
		"ArrowDown should move forward",
	);
	assert.strictEqual(
		getNextPickerSelectionIndex(0, 3, -1),
		2,
		"ArrowUp should wrap to last item",
	);
	assert.strictEqual(
		getNextPickerSelectionIndex(-1, 3, 1),
		1,
		"Negative index should normalize before moving",
	);
	assert.strictEqual(
		getNextPickerSelectionIndex(1, 0, 1),
		-1,
		"Empty list should return -1",
	);

	console.log("testImagePickerPlacementAndSelection passed");
}

function testInspectorLocaleKeysCompleteness() {
	const requiredKeys = [
		"Coordinates",
		"Rel",
		"Glob",
		"X",
		"Y",
		"Width",
		"Height",
		"Insert local image",
		"Insert SVG By AI",
		"Search local images",
		"No local images found",
		"Image Picker",
		"Block Element Colors",
		"Pin picker",
		"Unpin picker",
		"Close picker",
		"Ratio presets",
		"Custom ratio",
		"Current ratio",
		"Crop size",
		"Generate SVG with AI",
		"Describe desired SVG shape",
		"Use natural language to describe expected SVG",
		"Generated SVG",
		"Apply Generated SVG",
		"Generating SVG...",
		"AI SVG generated",
		"Failed to generate SVG",
		"AI SVG System Prompt",
		"Optional custom system prompt for AI SVG generation",
		"Enter to insert · Esc to close",
		"Slide Thumbnails",
		"Switch to page",
		"Previous thumbnails",
		"Next thumbnails",
	];
	requiredKeys.forEach((key) => {
		assert.ok(
			(en as Record<string, string>)[key],
			`en missing key: ${key}`,
		);
		assert.ok(
			(zhCN as Record<string, string>)[key],
			`zh-cn missing key: ${key}`,
		);
		assert.ok(
			(zhTW as Record<string, string>)[key],
			`zh-tw missing key: ${key}`,
		);
	});
	console.log("testInspectorLocaleKeysCompleteness passed");
}

function testInspectorSelectOptionI18nAndFallback() {
	const settings = (globalThis as any).window.app.plugins.plugins[
		"slides-rup"
	].settings;
	settings.slidesRupRunningLanguage = "zh-cn";
	resetInspectorI18nWarnCacheForTests();

	const localized = localizeInspectorSelectOptions([
		{ value: "", label: "Default" },
		{ value: "col", label: "Column" },
		{ value: "custom", label: "Custom Label" },
	]);
	assert.strictEqual(
		localized[0].label,
		"默认",
		"Known label should use zh-CN JSON translation",
	);
	assert.strictEqual(
		localized[1].label,
		"纵向",
		"Known label should use zh-CN JSON translation",
	);
	assert.strictEqual(
		localized[2].label,
		"Custom Label",
		"Unknown label should fallback to raw label",
	);

	const originalWarn = console.warn;
	const warns: string[] = [];
	console.warn = (...args: any[]) => warns.push(args.join(" "));
	try {
		localizeInspectorSelectOptions([
			{ value: "u1", label: "Unknown Label" },
			{ value: "u2", label: "Unknown Label" },
		]);
		localizeInspectorSelectOptions([
			{ value: "u3", label: "Unknown Label" },
		]);
	} finally {
		console.warn = originalWarn;
	}
	assert.strictEqual(
		warns.length,
		1,
		"Missing option i18n warning should be emitted only once per label",
	);

	settings.slidesRupRunningLanguage = "en";
	resetInspectorI18nWarnCacheForTests();
	console.log("testInspectorSelectOptionI18nAndFallback passed");
}

function testThumbnailVirtualizationMath() {
	const nonVirtualWindow = computeThumbnailVirtualWindow({
		total: 7,
		containerWidth: 800,
		scrollLeft: 0,
	});
	assert.strictEqual(nonVirtualWindow.virtualized, false);
	assert.strictEqual(nonVirtualWindow.start, 0);
	assert.strictEqual(nonVirtualWindow.end, 7);

	const virtualWindowStart = computeThumbnailVirtualWindow({
		total: 120,
		containerWidth: 560,
		scrollLeft: 0,
	});
	assert.strictEqual(virtualWindowStart.virtualized, true);
	assert.strictEqual(virtualWindowStart.start, 0);
	assert.ok(
		virtualWindowStart.end < 120,
		"Virtualized window should not render all thumbnails at once",
	);

	const virtualWindowMiddle = computeThumbnailVirtualWindow({
		total: 120,
		containerWidth: 560,
		scrollLeft: 4200,
	});
	assert.strictEqual(virtualWindowMiddle.virtualized, true);
	assert.ok(
		virtualWindowMiddle.start > 0,
		"Scrolled window should start after index 0",
	);
	assert.ok(
		virtualWindowMiddle.end <= 120,
		"Window end should stay inside item bounds",
	);
	console.log("testThumbnailVirtualizationMath passed");
}

function testThumbnailKeyboardIndexMath() {
	assert.strictEqual(
		getNextThumbnailIndex({ currentIndex: 0, direction: -1, total: 7 }),
		0,
		"Left at first page should stay at first page",
	);
	assert.strictEqual(
		getNextThumbnailIndex({ currentIndex: 6, direction: 1, total: 7 }),
		6,
		"Right at last page should stay at last page",
	);
	assert.strictEqual(
		getNextThumbnailIndex({ currentIndex: 3, direction: 1, total: 7 }),
		4,
		"Right should move to next page",
	);
	assert.strictEqual(
		getNextThumbnailIndex({
			currentIndex: 0,
			direction: -1,
			total: 7,
			wrap: true,
		}),
		6,
		"Wrap mode should jump from first to last",
	);
	console.log("testThumbnailKeyboardIndexMath passed");
}

function testThumbnailBlockCountFormatting() {
	assert.strictEqual(
		formatThumbnailBlockCount(12),
		"12 blocks",
		"Should format integer counts",
	);
	assert.strictEqual(
		formatThumbnailBlockCount(3.7),
		"3 blocks",
		"Should floor decimal counts",
	);
	assert.strictEqual(
		formatThumbnailBlockCount(-2),
		"0 blocks",
		"Should clamp negative counts",
	);
	assert.strictEqual(
		formatThumbnailBlockCount(Number.NaN),
		"0 blocks",
		"Should fallback for invalid counts",
	);
	console.log("testThumbnailBlockCountFormatting passed");
}

function testLayerRenderOrderReverse() {
	const blocks = [
		{ id: "A", type: "raw", raw: "a" },
		{ id: "B", type: "raw", raw: "b" },
		{ id: "C", type: "raw", raw: "c" },
	] as any[];
	const ordered = getLayerRenderOrder(blocks);
	assert.deepStrictEqual(
		ordered.map((item) => item.id),
		["C", "B", "A"],
		"Layer panel should render in reverse template order",
	);
	assert.deepStrictEqual(
		blocks.map((item) => item.id),
		["A", "B", "C"],
		"Render ordering should not mutate original block array",
	);
	console.log("testLayerRenderOrderReverse passed");
}

function testLayerDragPayloadCompatibility() {
	const payload = buildReparentDragPayload("block-42");
	const parsed = parseReparentDragPayload(payload);
	assert.deepStrictEqual(parsed, {
		action: "reparent",
		blockId: "block-42",
	});

	assert.strictEqual(
		parseReparentDragPayload(""),
		null,
		"Invalid payload should be ignored",
	);
	assert.strictEqual(
		parseReparentDragPayload(
			JSON.stringify({ action: "copy", blockId: "x" }),
		),
		null,
		"Non-reparent payload should be ignored",
	);

	// Regression: reversing layer render order must not break drag/drop reparent ids.
	const reversedIds = getLayerRenderOrder([
		{ id: "grid-a", type: "grid" },
		{ id: "grid-b", type: "grid" },
	] as any[]).map((item) => item.id);
	assert.deepStrictEqual(reversedIds, ["grid-b", "grid-a"]);
	const dragFromTopLayer = parseReparentDragPayload(
		buildReparentDragPayload(reversedIds[0]),
	);
	assert.strictEqual(
		dragFromTopLayer?.blockId,
		"grid-b",
		"Drag payload should keep source block id after reverse rendering",
	);

	console.log("testLayerDragPayloadCompatibility passed");
}

function testLayerDropIntentAndInsertIndexMath() {
	assert.strictEqual(
		resolveLayerDropIntent({
			relativeX: 10,
			relativeY: 12,
			height: 30,
		}),
		"as-child",
		"Left indent hit zone should produce as-child intent",
	);
	assert.strictEqual(
		resolveLayerDropIntent({
			relativeX: 10,
			relativeY: 12,
			height: 30,
			allowAsChild: false,
		}),
		"before",
		"When child intent is not allowed, indent zone should fallback to reordering",
	);
	assert.strictEqual(
		resolveLayerDropIntent({
			relativeX: 40,
			relativeY: 8,
			height: 30,
		}),
		"before",
		"Upper half should produce before intent",
	);
	assert.strictEqual(
		resolveLayerDropIntent({
			relativeX: 40,
			relativeY: 25,
			height: 30,
		}),
		"after",
		"Lower half should produce after intent",
	);

	assert.strictEqual(
		getInsertIndexForReversedLayerOrder({
			targetIndex: 3,
			intent: "before",
		}),
		4,
		"In reversed render order, before means insert after target in source array",
	);
	assert.strictEqual(
		getInsertIndexForReversedLayerOrder({
			targetIndex: 3,
			intent: "after",
		}),
		3,
		"In reversed render order, after means insert at target index in source array",
	);
	console.log("testLayerDropIntentAndInsertIndexMath passed");
}

function testGeneratedMarkdownOrderAfterLayerMove() {
	const page = {
		type: "content",
		label: "Content",
		fileName: "content.md",
		filePath: "content.md",
		blocks: [
			{
				id: "a",
				type: "grid",
				role: "grid",
				rect: { x: 0, y: 0, width: 10, height: 10 },
				content: "A",
				className: "",
				style: "",
				pad: "",
				align: "",
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
				children: [],
			},
			{
				id: "b",
				type: "grid",
				role: "grid",
				rect: { x: 0, y: 0, width: 10, height: 10 },
				content: "B",
				className: "",
				style: "",
				pad: "",
				align: "",
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
				children: [],
			},
		],
		rawMarkdown: "",
		hasUnsupportedContent: false,
		rectUnit: "percent",
	} as any;

	const moved = page.blocks.splice(0, 1)[0];
	page.blocks.push(moved);
	const markdown = generatePageMarkdown(page);
	const normalized = markdown.replace(/\r\n/g, "\n");
	const indexA = normalized.indexOf("\nA\n</grid>");
	const indexB = normalized.indexOf("\nB\n</grid>");
	assert.ok(
		indexB < indexA,
		"When block order changes in arrays, generated markdown order should match new structure",
	);

	const parent = page.blocks[0] as any;
	if (!parent.children) parent.children = [];
	const childCandidate = page.blocks.splice(1, 1)[0];
	parent.children.unshift(childCandidate);
	const nestedMarkdown = generatePageMarkdown(page).replace(/\r\n/g, "\n");
	const parentContentIndex = nestedMarkdown.indexOf("\nB\n");
	const childContentIndex = nestedMarkdown.indexOf("\nA\n");
	assert.ok(
		parentContentIndex < childContentIndex,
		"When moved as child to top, markdown should place child inside parent content block",
	);
	console.log("testGeneratedMarkdownOrderAfterLayerMove passed");
}

function testInlineStyleEditorAndTemplateNormalization() {
	assert.strictEqual(
		formatInlineStyleForEditor("color:red; font-size:20px;"),
		"color:red;\nfont-size:20px;",
		"Single-line template style should expand to multi-line editor format",
	);
	assert.strictEqual(
		normalizeInlineStyleForTemplate("color:red;\nfont-size:20px"),
		"color:red; font-size:20px;",
		"Multi-line editor style should normalize to single-line template format",
	);
	assert.strictEqual(
		normalizeInlineStyleForTemplate(
			" color : red ; ; \n font-size : 20px ; ",
		),
		"color : red; font-size : 20px;",
		"Template style normalization should clean empty declarations and extra spaces",
	);
	console.log("testInlineStyleEditorAndTemplateNormalization passed");
}

function testInlineStyleCompletionDataSourceAndMode() {
	const propertyLabels = buildInlineStylePropertyCompletions("mar").map(
		(item) => item.label,
	);
	assert.ok(
		propertyLabels.includes("margin"),
		"Standard CSS property should appear in completion list",
	);
	assert.ok(
		!propertyLabels.includes("marker"),
		"Non-curated property should not appear in completion list",
	);
	assert.ok(
		!propertyLabels.includes("class"),
		"HTML attribute should not appear in CSS property completions",
	);
	const userSelectLabels = buildInlineStylePropertyCompletions("").map(
		(item) => item.label,
	);
	const standardIndex = userSelectLabels.indexOf("user-select");
	const vendorIndex = userSelectLabels.findIndex((label) =>
		label.startsWith("-"),
	);
	assert.ok(
		standardIndex >= 0 && vendorIndex >= 0 && standardIndex < vendorIndex,
		"Standard properties should rank before vendor-prefixed entries",
	);

	const valueLabels = buildInlineStyleValueCompletions("ca").map(
		(item) => item.label,
	);
	assert.ok(
		valueLabels.includes("calc()"),
		"Modern function syntax should be included in value completions",
	);

	assert.strictEqual(
		detectInlineStyleCompletionMode("margin: 10px; color:"),
		"value",
		"After colon should be in value completion mode",
	);
	assert.strictEqual(
		detectInlineStyleCompletionMode("margin: 10px; col"),
		"property",
		"Without colon in current declaration should be in property completion mode",
	);
	console.log("testInlineStyleCompletionDataSourceAndMode passed");
}

async function testDispatchThemeColorChange() {
	const calls: string[] = [];
	const plugin = {
		settings: {
			slidesRupThemeColor: "#0044FF",
		},
		saveSettings: async () => {
			calls.push("saveSettings");
		},
		services: {
			slidesRupStyleService: {
				modifyStyleSection: async (section: "hsl") => {
					calls.push(`modifyStyleSection:${section}`);
				},
			},
		},
	};

	await dispatchThemeColorChange(plugin, "#123456");
	assert.strictEqual(
		plugin.settings.slidesRupThemeColor,
		"#123456",
		"Theme color should sync to plugin.settings.slidesRupThemeColor",
	);
	assert.deepStrictEqual(calls, [
		"saveSettings",
		"modifyStyleSection:hsl",
	]);
	console.log("testDispatchThemeColorChange passed");
}

function testInlineStyleAiOutputSanitization() {
	assert.strictEqual(
		sanitizeInlineStyleAiOutput(
			"```css\ncolor: #fff; margin-top: 12px;\n```",
		),
		"color: #fff;\nmargin-top: 12px;",
		"Should sanitize fenced CSS to inline declarations",
	);
	assert.throws(
		() => sanitizeInlineStyleAiOutput("@media (max-width:600px){color:red;}"),
		/non-inline CSS syntax/,
		"Should reject @rules and braces",
	);
	console.log("testInlineStyleAiOutputSanitization passed");
}

function testSvgAiOutputSanitization() {
	assert.strictEqual(
		sanitizeSvgAiOutput("```svg\n<svg viewBox='0 0 10 10'></svg>\n```"),
		"<svg viewBox='0 0 10 10'></svg>",
		"Should extract fenced SVG snippet",
	);
	assert.throws(
		() => sanitizeSvgAiOutput("not svg"),
		/valid SVG/,
		"Non-SVG output should be rejected",
	);
	assert.throws(
		() =>
			sanitizeSvgAiOutput(
				"<svg viewBox='0 0 10 10'><script>alert(1)</script></svg>",
			),
		/unsafe SVG content/,
		"Script tags should be rejected",
	);
	assert.throws(
		() =>
			sanitizeSvgAiOutput(
				"<svg viewBox='0 0 10 10'><rect onload='x()' /></svg>",
			),
		/unsafe SVG content/,
		"Event handler attributes should be rejected",
	);
	console.log("testSvgAiOutputSanitization passed");
}

function testFilterAiOutputSanitization() {
	assert.strictEqual(
		sanitizeFilterAiOutput("blur(2px) saturate(120%)"),
		"blur(2px) saturate(120%)",
		"Should keep valid filter function chain",
	);
	assert.strictEqual(
		sanitizeFilterAiOutput("filter: contrast(110%)"),
		"contrast(110%)",
		"Should strip filter prefix and keep value",
	);
	assert.throws(
		() => sanitizeFilterAiOutput("```css\nfilter: blur(2px);\n```"),
		/invalid filter syntax/,
		"Semicolon-containing output should be rejected",
	);
	assert.throws(
		() => sanitizeFilterAiOutput("@media (max-width:600px){filter: blur(2px)}"),
		/invalid filter syntax/,
		"At-rules should be rejected",
	);
	console.log("testFilterAiOutputSanitization passed");
}

async function testSecretStoreFallbackBehavior() {
	const app = {} as any;
	const settings = {
		...DEFAULT_SETTINGS,
		aiProviderApiKeyFallback: "",
	} as any;
	let saved = false;
	const service = new SecretStoreService(app, settings, async () => {
		saved = true;
	});
	assert.strictEqual(
		service.getStorageMode(),
		"fallback",
		"Without keychain API should use fallback mode",
	);
	await service.setAIProviderApiKey("sk-fallback");
	assert.strictEqual(
		settings.aiProviderApiKeyFallback,
		"sk-fallback",
		"Fallback mode should persist API key into settings",
	);
	assert.strictEqual(saved, true, "Fallback mode should trigger saveSettings");
	assert.strictEqual(
		await service.getAIProviderApiKey(),
		"sk-fallback",
		"Fallback mode should read API key from settings",
	);
	console.log("testSecretStoreFallbackBehavior passed");
}

function testHtmlElementColorHelpers() {
	const block = {
		id: "grid-1",
		type: "grid",
		role: "grid",
		rect: { x: 0, y: 0, width: 50, height: 50 },
		content: "hello",
		className: "",
		style: "",
		pad: "",
		align: "",
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
	} as any;
	assert.deepStrictEqual(
		getHtmlElementColors(block),
		{},
		"Without style block, element colors should be empty",
	);
	updateHtmlElementColors(block, { h1: "#ff0000", p: "rgb(10, 20, 30)" });
	assert.ok(
		(block.extraAttributes.id || "").startsWith("grid-"),
		"When applying first element color, grid id should be auto-generated",
	);
	assert.ok(
		block.content.includes(`<style id="${block.extraAttributes.id}-colors">`),
		"Content should include managed style block",
	);
	assert.ok(
		block.content.includes(`#${block.extraAttributes.id} h1 { color: #ff0000; }`),
		"Managed style should contain h1 color rule",
	);
	assert.deepStrictEqual(
		getHtmlElementColors(block),
		{ h1: "#ff0000", p: "rgb(10, 20, 30)" },
		"Parser should read managed element colors from style block",
	);
	updateHtmlElementColors(block, { p: "rgb(10, 20, 30)" });
	assert.ok(
		!block.content.includes(`#${block.extraAttributes.id} h1 { color: #ff0000; }`),
		"Removing one element value should remove its rule",
	);
	updateHtmlElementColors(block, {});
	assert.ok(
		!block.content.includes(`<style id="${block.extraAttributes.id}-colors">`),
		"When all values are empty, managed style block should be removed",
	);
	assert.ok(
		(block.extraAttributes.id || "").startsWith("grid-"),
		"When all values are empty, grid id should be kept",
	);
	console.log("testHtmlElementColorHelpers passed");
}

async function runTests() {
	try {
		(globalThis as any).window = {
			app: {
				plugins: {
					plugins: {
						"slides-rup": {
							settings: {
								slidesRupRunningLanguage: "en",
							},
						},
					},
				},
			},
		};

		testNestedGridSerialization();
		testCoordinateConversion();
		testTreeCircularDependency();
		testDesignMakerRuntimeCssHasHelperClasses();
		testParseThemeDraftPrimaryColorFallbackFromSettings();
		testSelectionDebounceStateMachine();
		testNestedBlockVisibilityToggle();
		testCanvasZoomTransformMath();
		testResolveHostDocumentForPopoutWindow();
		testResolvePickerHostForPopoutWindow();
		testGridPlainTextFallbackRendering();
		testDesignTemplateUnitConsistency();
		testAdvancedSlidesWidthHeightParsing();
		testInspectorRectFieldRealtimeSync();
		testOpacitySliderValueHelpers();
		testBackgroundColorPickerValueHelpers();
		testBorderCompositeHelpers();
		testPaddingCompositeHelpers();
		testInsertLocalImageEmbed();
		testInsertSvgIntoContent();
		testUnsplashImageInsertHelpers();
		testUnsplashRatioParsingAndCropResolve();
		testImagePickerPlacementAndSelection();
		testInspectorLocaleKeysCompleteness();
		testInspectorSelectOptionI18nAndFallback();
		testThumbnailVirtualizationMath();
		testThumbnailKeyboardIndexMath();
		testThumbnailBlockCountFormatting();
		testLayerRenderOrderReverse();
		testLayerDragPayloadCompatibility();
		testLayerDropIntentAndInsertIndexMath();
		testGeneratedMarkdownOrderAfterLayerMove();
		testInlineStyleEditorAndTemplateNormalization();
		testInlineStyleCompletionDataSourceAndMode();
		await testDispatchThemeColorChange();
		testInlineStyleAiOutputSanitization();
		testSvgAiOutputSanitization();
		testFilterAiOutputSanitization();
		await testSecretStoreFallbackBehavior();
		testHtmlElementColorHelpers();
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
