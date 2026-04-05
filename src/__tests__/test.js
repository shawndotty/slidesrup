"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var module = __importStar(require("module"));
var originalRequire = module.Module.prototype.require;
module.Module.prototype.require = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (args[0] === "obsidian")
        return {};
    return originalRequire.apply(this, args);
};
var assert_1 = __importDefault(require("assert"));
var design_maker_parser_1 = require("../services/design-maker-parser");
var design_maker_generator_1 = require("../services/design-maker-generator");
var design_canvas_1 = require("../ui/components/design-canvas");
var gridTransformer_1 = require("../transformers/gridTransformer");
var yamlStore_1 = require("../yamlStore");
function testNestedGridSerialization() {
    var markdown = "<grid drag=\"70 140\" drop=\"-32 0\" class=\"bg-with-front-color\" style=\"margin-top: -216px\" rotate=\"350\">\n\n<grid drag=\"5 40\" drop=\"97 36\" class=\"bg-with-back-color\">\n\n</grid>\n</grid>";
    var draft = (0, design_maker_parser_1.parseDesignPageDraft)("cover", "test", "test.md", markdown);
    assert_1["default"].strictEqual(draft.blocks.length, 1, "Should have 1 top-level block");
    var outerGrid = draft.blocks[0];
    assert_1["default"].strictEqual(outerGrid.type, "grid");
    assert_1["default"].strictEqual(outerGrid.children.length, 1, "Should have 1 child grid");
    var innerGrid = outerGrid.children[0];
    assert_1["default"].strictEqual(innerGrid.rect.width, 5);
    assert_1["default"].strictEqual(innerGrid.rect.height, 40);
    assert_1["default"].strictEqual(innerGrid.rect.x, 97);
    assert_1["default"].strictEqual(innerGrid.rect.y, 36);
    var generated = (0, design_maker_generator_1.generatePageMarkdown)(draft);
    var reParsed = (0, design_maker_parser_1.parseDesignPageDraft)("cover", "test", "test.md", generated);
    assert_1["default"].strictEqual(reParsed.blocks.length, 1);
    assert_1["default"].strictEqual(reParsed.blocks[0].children.length, 1);
    console.log("testNestedGridSerialization passed");
}
function testCoordinateConversion() {
    var MockDOMRect = /** @class */ (function () {
        function MockDOMRect(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        return MockDOMRect;
    }());
    var globalRect = new MockDOMRect(150, 150, 50, 50); // 50x50 block at global 150,150
    var parentRect = new MockDOMRect(100, 100, 200, 200); // 200x200 parent at global 100,100
    var newX = ((globalRect.left - parentRect.left) / parentRect.width) * 100;
    var newY = ((globalRect.top - parentRect.top) / parentRect.height) * 100;
    var newWidth = (globalRect.width / parentRect.width) * 100;
    var newHeight = (globalRect.height / parentRect.height) * 100;
    assert_1["default"].strictEqual(newX, 25);
    assert_1["default"].strictEqual(newY, 25);
    assert_1["default"].strictEqual(newWidth, 25);
    assert_1["default"].strictEqual(newHeight, 25);
    console.log("testCoordinateConversion passed");
}
function testTreeCircularDependency() {
    var _a;
    // mock the _findBlockById and circular dependency logic
    var blocks = [
        {
            id: "A",
            type: "grid",
            children: [
                {
                    id: "B",
                    type: "grid",
                    children: [{ id: "C", type: "grid" }]
                },
            ]
        },
    ];
    var _findBlockById = function (blocksArr, id) {
        for (var i = 0; i < blocksArr.length; i++) {
            var block = blocksArr[i];
            if (block.id === id)
                return { block: block, index: i };
            if (block.type === "grid" && block.children) {
                var found = _findBlockById(block.children, id);
                if (found)
                    return __assign(__assign({}, found), { parent: block });
            }
        }
        return null;
    };
    var sourceId = "A";
    var targetId = "C";
    // Check for circular dependency logic from design-maker-view.ts
    var hasCircular = false;
    var targetFound = _findBlockById(blocks, targetId);
    if (targetFound && targetFound.block.type === "grid") {
        var currentCheck = targetFound.parent;
        while (currentCheck) {
            if (currentCheck.id === sourceId) {
                hasCircular = true;
                break;
            }
            currentCheck = (_a = _findBlockById(blocks, currentCheck.id)) === null || _a === void 0 ? void 0 : _a.parent;
        }
    }
    assert_1["default"].strictEqual(hasCircular, true, "Should detect circular dependency when dropping A into C");
    console.log("testTreeCircularDependency passed");
}
function testDesignMakerRuntimeCssHasHelperClasses() {
    var theme = (0, design_maker_parser_1.parseThemeDraft)("Test", "");
    var css = (0, design_maker_generator_1.generateDesignMakerRuntimeCss)(theme);
    assert_1["default"].ok(css.includes(".bg-with-front-color"), "Should include .bg-with-front-color helper class");
    assert_1["default"].ok(css.includes(".bg-with-back-color"), "Should include .bg-with-back-color helper class");
    assert_1["default"].ok(css.includes(".slides-rup-design-maker-canvas") ||
        css.includes(".slides-rup-design-maker-preview"), "Should scope helper CSS to Design Maker containers");
    console.log("testDesignMakerRuntimeCssHasHelperClasses passed");
}
function testSelectionDebounceStateMachine() {
    var machine = (function () {
        var lastApplied = null;
        var selected = null;
        return {
            select: function (next) {
                selected = next;
            },
            apply: function () {
                var previous = lastApplied;
                var next = selected;
                lastApplied = next;
                return { previous: previous, next: next };
            }
        };
    })();
    machine.select("A");
    machine.select("B");
    machine.select("C");
    var first = machine.apply();
    assert_1["default"].deepStrictEqual(first, { previous: null, next: "C" });
    machine.select(null);
    var second = machine.apply();
    assert_1["default"].deepStrictEqual(second, { previous: "C", next: null });
    console.log("testSelectionDebounceStateMachine passed");
}
function testNestedBlockVisibilityToggle() {
    var _a, _b;
    var findById = function (blocks, id) {
        for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
            var block = blocks_1[_i];
            if (block.id === id)
                return block;
            if (block.type === "grid" && block.children) {
                var found = findById(block.children, id);
                if (found)
                    return found;
            }
        }
        return null;
    };
    var blocks = [
        {
            id: "parent",
            type: "grid",
            children: [{ id: "child", type: "grid" }]
        },
    ];
    var child = findById(blocks, "child");
    assert_1["default"].ok(child, "Should find nested child block");
    assert_1["default"].strictEqual(child.hiddenInDesign, undefined);
    child.hiddenInDesign = true;
    assert_1["default"].strictEqual((_a = findById(blocks, "child")) === null || _a === void 0 ? void 0 : _a.hiddenInDesign, true);
    var parent = findById(blocks, "parent");
    assert_1["default"].ok(parent, "Should find parent block");
    parent.hiddenInDesign = true;
    parent.hiddenInDesign = false;
    assert_1["default"].strictEqual((_b = findById(blocks, "parent")) === null || _b === void 0 ? void 0 : _b.hiddenInDesign, false);
    console.log("testNestedBlockVisibilityToggle passed");
}
function testCanvasZoomTransformMath() {
    assert_1["default"].strictEqual((0, design_canvas_1.clampCanvasZoomPercent)(0), 25);
    assert_1["default"].strictEqual((0, design_canvas_1.clampCanvasZoomPercent)(500), 400);
    assert_1["default"].strictEqual((0, design_canvas_1.clampCanvasZoomPercent)(123.4), 123);
    var transform = (0, design_canvas_1.computeCanvasTransform)({
        frameWidth: 960,
        frameHeight: 540,
        baseWidth: 1920,
        baseHeight: 1080,
        zoomPercent: 200,
        panX: 10,
        panY: 20
    });
    assert_1["default"].strictEqual(transform.scale, 1);
    assert_1["default"].strictEqual(transform.transform, "translate(10px, 20px) scale(1)");
    var resetTransform = (0, design_canvas_1.computeCanvasTransform)({
        frameWidth: 960,
        frameHeight: 540,
        baseWidth: 1920,
        baseHeight: 1080,
        zoomPercent: 100,
        panX: 0,
        panY: 0
    });
    assert_1["default"].strictEqual(resetTransform.scale, 0.5);
    assert_1["default"].strictEqual(resetTransform.transform, "translate(0px, 0px) scale(0.5)");
    var nextPan = (0, design_canvas_1.computePanForZoom)({
        cursorX: 100,
        cursorY: 100,
        panX: 0,
        panY: 0,
        currentScale: 1,
        nextScale: 2
    });
    assert_1["default"].deepStrictEqual(nextPan, { panX: -100, panY: -100 });
    console.log("testCanvasZoomTransformMath passed");
}
function testDesignTemplateUnitConsistency() {
    var pxMarkdown = "<grid drag=\"80px 100px\" drop=\"10px 20px\" class=\"bg-with-front-color\">\n</grid>";
    var pxPage = (0, design_maker_parser_1.parseDesignPageDraft)("content", "test", "test.md", pxMarkdown);
    assert_1["default"].strictEqual(pxPage.rectUnit, "px", "Should detect px unit from template");
    var pxSerialized = (0, design_maker_generator_1.generatePageMarkdown)(pxPage);
    assert_1["default"].ok(pxSerialized.includes("drag=\"80px 100px\""), "Should keep px unit in drag on save");
    assert_1["default"].ok(pxSerialized.includes("drop=\"10px 20px\""), "Should keep px unit in drop on save");
    var percentMarkdown = "<grid drag=\"100 80\" drop=\"0 0\" class=\"bg-with-front-color\">\n</grid>";
    var percentPage = (0, design_maker_parser_1.parseDesignPageDraft)("content", "test", "test.md", percentMarkdown);
    assert_1["default"].strictEqual(percentPage.rectUnit, "percent", "Should detect percent unit from bare numbers");
    // Test the specific user case: drag in px, drop in percent (unitless)
    var mixedUserMarkdown = "<grid drag=\"200px 200px\" drop=\"45 20\">\n</grid>";
    var mixedUserPage = (0, design_maker_parser_1.parseDesignPageDraft)("content", "test", "test.md", mixedUserMarkdown);
    assert_1["default"].strictEqual(mixedUserPage.rectUnit, "px", "Block with any px should be parsed as px unit overall");
    var mixedUserGrid = mixedUserPage.blocks[0];
    assert_1["default"].strictEqual(mixedUserGrid.rect.width, 200, "Width should be parsed as 200px");
    assert_1["default"].strictEqual(mixedUserGrid.rect.height, 200, "Height should be parsed as 200px");
    // 45% of 1920 = 864, 20% of 1080 = 216
    assert_1["default"].strictEqual(mixedUserGrid.rect.x, 864, "X should be parsed as 45% of 1920 = 864px");
    assert_1["default"].strictEqual(mixedUserGrid.rect.y, 216, "Y should be parsed as 20% of 1080 = 216px");
    var mixedMarkdown = "<grid drag=\"80px 100px\" drop=\"0px 0px\">\n</grid>\n\n<grid drag=\"100 80\" drop=\"0 0\">\n</grid>";
    var mixedPage = (0, design_maker_parser_1.parseDesignPageDraft)("content", "test", "test.md", mixedMarkdown);
    assert_1["default"].strictEqual(mixedPage.rectUnit, "percent", "Mixed blocks should not force whole page to px");
    var mixedGridA = mixedPage.blocks[0];
    var mixedGridB = mixedPage.blocks[1];
    assert_1["default"].strictEqual(mixedGridA.extraAttributes.rectUnit, "px", "Px block should keep rectUnit=px");
    assert_1["default"].ok(!mixedGridB.extraAttributes.rectUnit, "Percent block should not be marked as px");
    var mixedSerialized = (0, design_maker_generator_1.generatePageMarkdown)(mixedPage);
    assert_1["default"].ok(mixedSerialized.includes("drag=\"80px 100px\""), "Px block should serialize drag with px");
    assert_1["default"].ok(mixedSerialized.includes("drag=\"100 80\""), "Percent block should serialize drag as bare numbers");
    var remMarkdown = "<grid drag=\"2rem 3rem\" drop=\"1rem 1rem\">\n</grid>";
    var remPage = (0, design_maker_parser_1.parseDesignPageDraft)("content", "test", "test.md", remMarkdown);
    assert_1["default"].strictEqual(remPage.rectUnit, "percent", "Unsupported unit should not switch to px by itself");
    assert_1["default"].ok((remPage.unitWarnings || []).length > 0, "Should warn for unsupported units");
    var remSerialized = (0, design_maker_generator_1.generatePageMarkdown)(remPage);
    assert_1["default"].ok(remSerialized.includes("drag=\"2 3\""), "Unsupported units should be auto-corrected to numbers");
    var pxLabel = (0, design_maker_parser_1.formatRectInputValue)(80, "px");
    var percentLabel = (0, design_maker_parser_1.formatRectInputValue)(100, "percent");
    assert_1["default"].strictEqual(pxLabel, "80px", "Inspector should show px suffix");
    assert_1["default"].strictEqual(percentLabel, "100", "Inspector should show bare number");
    assert_1["default"].deepStrictEqual((0, design_maker_parser_1.parseRectInputValue)("80px"), {
        value: 80,
        rectUnit: "px"
    });
    assert_1["default"].deepStrictEqual((0, design_maker_parser_1.parseRectInputValue)("100"), {
        value: 100,
        rectUnit: "percent"
    });
    var baseWidth = 1920;
    var widthPercent = 50;
    var expectedPx = (baseWidth * widthPercent) / 100;
    var actualPx = (baseWidth * widthPercent) / 100;
    assert_1["default"].ok(Math.abs(actualPx - expectedPx) <= 1, "Percent-to-px rendering math should be within ±1px");
    console.log("testDesignTemplateUnitConsistency passed");
}
function testAdvancedSlidesWidthHeightParsing() {
    var _a, _b;
    yamlStore_1.YamlStore.getInstance().options = {
        width: 1920,
        height: 1080,
        center: true
    };
    var transformer = new gridTransformer_1.GridTransformer();
    var relRatio = transformer.read("5 12", "0 0", false);
    assert_1["default"].ok(relRatio, "Relative ratio should parse");
    assert_1["default"].strictEqual(relRatio === null || relRatio === void 0 ? void 0 : relRatio.get("width"), 5);
    assert_1["default"].strictEqual(relRatio === null || relRatio === void 0 ? void 0 : relRatio.get("height"), 12);
    assert_1["default"].strictEqual(relRatio === null || relRatio === void 0 ? void 0 : relRatio.get("x"), 0);
    assert_1["default"].strictEqual(relRatio === null || relRatio === void 0 ? void 0 : relRatio.get("y"), 0);
    var relPx = transformer.read("200px 300px", "0 0", false);
    assert_1["default"].ok(relPx, "Relative px should parse");
    assert_1["default"].ok(Math.abs(((_a = relPx === null || relPx === void 0 ? void 0 : relPx.get("width")) !== null && _a !== void 0 ? _a : 0) - 10.4166667) < 0.01, "Relative px width should convert to percentage");
    assert_1["default"].ok(Math.abs(((_b = relPx === null || relPx === void 0 ? void 0 : relPx.get("height")) !== null && _b !== void 0 ? _b : 0) - 27.7777778) < 0.01, "Relative px height should convert to percentage");
    var absRatio = transformer.read("5 10", "0 0", true);
    assert_1["default"].ok(absRatio, "Absolute ratio should parse");
    assert_1["default"].strictEqual(absRatio === null || absRatio === void 0 ? void 0 : absRatio.get("width"), 96);
    assert_1["default"].strictEqual(absRatio === null || absRatio === void 0 ? void 0 : absRatio.get("height"), 108);
    var absPx = transformer.read("200px 300px", "0 0", true);
    assert_1["default"].ok(absPx, "Absolute px should parse");
    assert_1["default"].strictEqual(absPx === null || absPx === void 0 ? void 0 : absPx.get("width"), 200);
    assert_1["default"].strictEqual(absPx === null || absPx === void 0 ? void 0 : absPx.get("height"), 300);
    var relNegXY = transformer.read("5 5", "-10 20", false);
    assert_1["default"].ok(relNegXY, "Relative negative XY should parse");
    assert_1["default"].strictEqual(relNegXY === null || relNegXY === void 0 ? void 0 : relNegXY.get("x"), -10);
    assert_1["default"].strictEqual(relNegXY === null || relNegXY === void 0 ? void 0 : relNegXY.get("y"), 20);
    var absNegPxXY = transformer.read("5 5", "-20px 30px", true);
    assert_1["default"].ok(absNegPxXY, "Absolute px negative XY should parse");
    assert_1["default"].strictEqual(absNegPxXY === null || absNegPxXY === void 0 ? void 0 : absNegPxXY.get("x"), -20);
    assert_1["default"].strictEqual(absNegPxXY === null || absNegPxXY === void 0 ? void 0 : absNegPxXY.get("y"), 30);
    assert_1["default"].strictEqual(transformer.read("0px 300px", "0 0", false), undefined, "Invalid px width should be rejected");
    assert_1["default"].strictEqual(transformer.read("5.5 10", "0 0", false), undefined, "Invalid ratio width should be rejected");
    assert_1["default"].strictEqual(transformer.read("-5 10", "0 0", false), undefined, "Negative ratio width should be rejected");
    console.log("testAdvancedSlidesWidthHeightParsing passed");
}
function runTests() {
    try {
        globalThis.window = {
            app: {
                plugins: {
                    plugins: {
                        "slides-rup": {
                            settings: {
                                slidesRupRunningLanguage: "en"
                            }
                        }
                    }
                }
            }
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
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
runTests();
