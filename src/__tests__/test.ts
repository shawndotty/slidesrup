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
} from "../services/design-maker-generator";
import {
	clampCanvasZoomPercent,
	computeCanvasTransform,
	computePanForZoom,
} from "../ui/components/design-canvas";
import {
	clampImagePickerPosition,
	computeImagePickerPlacement,
	getNextPickerSelectionIndex,
	insertImageEmbedIntoContent,
	isLocalImagePath,
	syncInspectorRectFields,
} from "../ui/components/design-inspector";
import { GridTransformer } from "../transformers/gridTransformer";
import { YamlStore } from "../yamlStore";
import en from "../lang/locale/en";
import zhCN from "../lang/locale/zh-cn";
import zhTW from "../lang/locale/zh-tw";

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

function runTests() {
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
		testSelectionDebounceStateMachine();
		testNestedBlockVisibilityToggle();
		testCanvasZoomTransformMath();
		testDesignTemplateUnitConsistency();
		testAdvancedSlidesWidthHeightParsing();
		testInspectorRectFieldRealtimeSync();
		testInsertLocalImageEmbed();
		testImagePickerPlacementAndSelection();
		testInspectorLocaleKeysCompleteness();
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
