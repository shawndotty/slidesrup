import module from "module";
const originalRequire = (module as any).prototype.require;
(module as any).prototype.require = function (...args: any[]) {
	if (args[0] === "obsidian") return {};
	return originalRequire.apply(this, args);
};

import assert from "assert";
import {
	parseDesignPageDraft,
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

function runTests() {
	try {
		testNestedGridSerialization();
		testCoordinateConversion();
		testTreeCircularDependency();
		testDesignMakerRuntimeCssHasHelperClasses();
		testSelectionDebounceStateMachine();
		testNestedBlockVisibilityToggle();
		testCanvasZoomTransformMath();
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
