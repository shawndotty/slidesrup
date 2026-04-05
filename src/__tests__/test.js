"use strict";
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
exports.__esModule = true;
var assert_1 = __importDefault(require("assert"));
var design_maker_parser_1 = require("../services/design-maker-parser");
var design_maker_generator_1 = require("../services/design-maker-generator");
function testNestedGridSerialization() {
	var markdown =
		'<grid drag="70 140" drop="-32 0" class="bg-with-front-color" style="margin-top: -216px" rotate="350">\n\n<grid drag="5 40" drop="97 36" class="bg-with-back-color">\n\n</grid>\n</grid>';
	var draft = (0, design_maker_parser_1.parseDesignPageDraft)(
		"cover",
		"test",
		"test.md",
		markdown,
	);
	assert_1["default"].strictEqual(
		draft.blocks.length,
		1,
		"Should have 1 top-level block",
	);
	var outerGrid = draft.blocks[0];
	assert_1["default"].strictEqual(outerGrid.type, "grid");
	assert_1["default"].strictEqual(
		outerGrid.children.length,
		1,
		"Should have 1 child grid",
	);
	var innerGrid = outerGrid.children[0];
	assert_1["default"].strictEqual(innerGrid.rect.width, 5);
	assert_1["default"].strictEqual(innerGrid.rect.height, 40);
	assert_1["default"].strictEqual(innerGrid.rect.x, 97);
	assert_1["default"].strictEqual(innerGrid.rect.y, 36);
	var generated = (0, design_maker_generator_1.generatePageMarkdown)(draft);
	var reParsed = (0, design_maker_parser_1.parseDesignPageDraft)(
		"cover",
		"test",
		"test.md",
		generated,
	);
	assert_1["default"].strictEqual(reParsed.blocks.length, 1);
	assert_1["default"].strictEqual(reParsed.blocks[0].children.length, 1);
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
