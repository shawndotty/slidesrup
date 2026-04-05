import assert from "assert";
import { parseDesignPageDraft } from "../src/services/design-maker-parser";
import { generatePageMarkdown } from "../src/services/design-maker-generator";

// Mock minimal dependencies
global.Math.max = Math.max;

function testNestedGridSerialization() {
	const markdown = `<grid drag="70 140" drop="-32 0" class="bg-with-front-color" style="margin-top: -216px" rotate="350">
\n\n<grid drag="5 40" drop="97 36" class="bg-with-back-color">\n\n</grid>
</grid>`;

	const draft = parseDesignPageDraft("cover", "test", "test.md", markdown);
	assert.strictEqual(draft.blocks.length, 1, "Should have 1 top-level block");
	
	const outerGrid = draft.blocks[0] as any;
	assert.strictEqual(outerGrid.type, "grid");
	assert.strictEqual(outerGrid.children.length, 1, "Should have 1 child grid");

	const innerGrid = outerGrid.children[0];
	assert.strictEqual(innerGrid.rect.width, 5);
	assert.strictEqual(innerGrid.rect.height, 40);
	assert.strictEqual(innerGrid.rect.x, 97);
	assert.strictEqual(innerGrid.rect.y, 36);

	const generated = generatePageMarkdown(draft);
	
	const reParsed = parseDesignPageDraft("cover", "test", "test.md", generated);
	assert.strictEqual(reParsed.blocks.length, 1);
	assert.strictEqual((reParsed.blocks[0] as any).children.length, 1);
	
	console.log("testNestedGridSerialization passed");
}

function runTests() {
	try {
		testNestedGridSerialization();
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

runTests();
