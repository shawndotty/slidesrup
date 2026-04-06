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
} from "../services/design-maker-generator";
import {
	clampCanvasZoomPercent,
	computeCanvasTransform,
	computePanForZoom,
} from "../ui/components/design-canvas";
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
	clampImagePickerPosition,
	detectInlineStyleCompletionMode,
	formatInlineStyleForEditor,
	computeImagePickerPlacement,
	getNextPickerSelectionIndex,
	insertImageEmbedIntoContent,
	isLocalImagePath,
	localizeInspectorSelectOptions,
	resetInspectorI18nWarnCacheForTests,
	syncInspectorRectFields,
} from "../ui/components/design-inspector";
import { GridTransformer } from "../transformers/gridTransformer";
import { YamlStore } from "../yamlStore";
import en from "../lang/locale/en";
import zhCN from "../lang/locale/zh-cn";
import zhTW from "../lang/locale/zh-tw";
import { DEFAULT_SETTINGS } from "../models/default-settings";
import { dispatchThemeColorChange } from "../services/theme-color-dispatch";

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
		"Search local images",
		"No local images found",
		"Image Picker",
		"Pin picker",
		"Unpin picker",
		"Close picker",
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
		testDesignTemplateUnitConsistency();
		testAdvancedSlidesWidthHeightParsing();
		testInspectorRectFieldRealtimeSync();
		testInsertLocalImageEmbed();
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
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
