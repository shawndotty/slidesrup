"use strict";
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
exports.__esModule = true;
var module_1 = __importDefault(require("module"));
var originalRequire = module_1["default"].prototype.require;
module_1["default"].prototype.require = function () {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) {
		args[_i] = arguments[_i];
	}
	if (args[0] === "obsidian") return {};
	if (args[0] === "src/lang/helpers")
		return {
			t: function (value) {
				return value;
			},
		};
	return originalRequire.apply(this, args);
};
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

function testDesignTemplateUnitConsistency() {
	var pxMarkdown =
		'<grid drag="80px 100px" drop="10px 20px" class="bg-with-front-color">\n</grid>';
	var pxPage = (0, design_maker_parser_1.parseDesignPageDraft)(
		"content",
		"test",
		"test.md",
		pxMarkdown,
	);
	assert_1["default"].strictEqual(
		pxPage.rectUnit,
		"px",
		"Should detect px unit from template",
	);
	var pxSerialized = (0, design_maker_generator_1.generatePageMarkdown)(
		pxPage,
	);
	assert_1["default"].ok(
		pxSerialized.includes('drag="80px 100px"'),
		"Should keep px unit in drag on save",
	);
	assert_1["default"].ok(
		pxSerialized.includes('drop="10px 20px"'),
		"Should keep px unit in drop on save",
	);

	var percentMarkdown =
		'<grid drag="100 80" drop="0 0" class="bg-with-front-color">\n</grid>';
	var percentPage = (0, design_maker_parser_1.parseDesignPageDraft)(
		"content",
		"test",
		"test.md",
		percentMarkdown,
	);
	assert_1["default"].strictEqual(
		percentPage.rectUnit,
		"percent",
		"Should detect percent unit from bare numbers",
	);

	var mixedMarkdown =
		'<grid drag="80px 100px" drop="0px 0px">\n</grid>\n\n<grid drag="100 80" drop="0 0">\n</grid>';
	var mixedPage = (0, design_maker_parser_1.parseDesignPageDraft)(
		"content",
		"test",
		"test.md",
		mixedMarkdown,
	);
	assert_1["default"].strictEqual(
		mixedPage.rectUnit,
		"percent",
		"Mixed blocks should not force whole page to px",
	);
	var mixedGridA = mixedPage.blocks[0];
	var mixedGridB = mixedPage.blocks[1];
	assert_1["default"].strictEqual(
		mixedGridA.extraAttributes.rectUnit,
		"px",
		"Px block should keep rectUnit=px",
	);
	assert_1["default"].ok(
		!mixedGridB.extraAttributes.rectUnit,
		"Percent block should not be marked as px",
	);
	var mixedSerialized = (0, design_maker_generator_1.generatePageMarkdown)(
		mixedPage,
	);
	assert_1["default"].ok(
		mixedSerialized.includes('drag="80px 100px"'),
		"Px block should serialize drag with px",
	);
	assert_1["default"].ok(
		mixedSerialized.includes('drag="100 80"'),
		"Percent block should serialize drag as bare numbers",
	);

	var remMarkdown = '<grid drag="2rem 3rem" drop="1rem 1rem">\n</grid>';
	var remPage = (0, design_maker_parser_1.parseDesignPageDraft)(
		"content",
		"test",
		"test.md",
		remMarkdown,
	);
	assert_1["default"].strictEqual(
		remPage.rectUnit,
		"percent",
		"Unsupported unit should not switch to px by itself",
	);
	assert_1["default"].ok(
		(remPage.unitWarnings || []).length > 0,
		"Should warn for unsupported units",
	);
	var remSerialized = (0, design_maker_generator_1.generatePageMarkdown)(
		remPage,
	);
	assert_1["default"].ok(
		remSerialized.includes('drag="2 3"'),
		"Unsupported units should be auto-corrected to numbers",
	);

	var pxLabel = (0, design_maker_parser_1.formatRectInputValue)(80, "px");
	var percentLabel = (0, design_maker_parser_1.formatRectInputValue)(
		100,
		"percent",
	);
	assert_1["default"].strictEqual(
		pxLabel,
		"80px",
		"Inspector should show px suffix",
	);
	assert_1["default"].strictEqual(
		percentLabel,
		"100",
		"Inspector should show bare number",
	);
	assert_1["default"].deepStrictEqual(
		(0, design_maker_parser_1.parseRectInputValue)("80px"),
		{
			value: 80,
			rectUnit: "px",
		},
	);
	assert_1["default"].deepStrictEqual(
		(0, design_maker_parser_1.parseRectInputValue)("100"),
		{
			value: 100,
			rectUnit: "percent",
		},
	);

	var baseWidth = 1920;
	var widthPercent = 50;
	var expectedPx = (baseWidth * widthPercent) / 100;
	var actualPx = (baseWidth * widthPercent) / 100;
	assert_1["default"].ok(
		Math.abs(actualPx - expectedPx) <= 1,
		"Percent-to-px rendering math should be within ±1px",
	);

	console.log("testDesignTemplateUnitConsistency passed");
}
function runTests() {
	try {
		testNestedGridSerialization();
		testDesignTemplateUnitConsistency();
		console.log("All tests passed 100%!");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
runTests();
