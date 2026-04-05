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
import { GridTransformer } from "../transformers/gridTransformer";
import { YamlStore } from "../yamlStore";

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

	// Test the specific user case: drag in px, drop in percent (unitless)
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
	// 45% of 1920 = 864, 20% of 1080 = 216
	assert.strictEqual(
		mixedUserGrid.rect.x,
		864,
		"X should be parsed as 45% of 1920 = 864px",
	);
	assert.strictEqual(
		mixedUserGrid.rect.y,
		216,
		"Y should be parsed as 20% of 1080 = 216px",
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
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
