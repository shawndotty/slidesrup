"use strict";
exports.__esModule = true;
exports.normalizeDesignName = exports.inferDesignNameFromPath = exports.getDesignThemeFileName = exports.getDesignPageFileName = exports.getDesignPageDisplayName = exports.getDesignPageLabel = exports.getDesignPageDefinition = exports.DESIGN_PAGE_DEFINITIONS = void 0;
var helpers_1 = require("src/lang/helpers");
exports.DESIGN_PAGE_DEFINITIONS = [
    {
        type: "cover",
        labelKey: "Cover",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("Cover"), "-").concat(designName, ".md"); }
    },
    {
        type: "toc",
        labelKey: "TOC",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("TOC"), "-").concat(designName, ".md"); }
    },
    {
        type: "chapter",
        labelKey: "Chapter",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("Chapter"), "-").concat(designName, ".md"); }
    },
    {
        type: "content",
        labelKey: "ContentPage",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("ContentPage"), "-").concat(designName, ".md"); }
    },
    {
        type: "contentWithoutNav",
        labelKey: "ContentPage",
        getFileName: function (designName) {
            return "".concat((0, helpers_1.t)("ContentPage"), "-").concat((0, helpers_1.t)("WithoutNav"), "-").concat(designName, ".md");
        }
    },
    {
        type: "blank",
        labelKey: "BlankPage",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("BlankPage"), "-").concat(designName, ".md"); }
    },
    {
        type: "backCover",
        labelKey: "BackCover",
        getFileName: function (designName) { return "".concat((0, helpers_1.t)("BackCover"), "-").concat(designName, ".md"); }
    },
];
function getDesignPageDefinition(type) {
    return exports.DESIGN_PAGE_DEFINITIONS.find(function (item) { return item.type === type; });
}
exports.getDesignPageDefinition = getDesignPageDefinition;
function getDesignPageLabel(type) {
    var _a;
    return (0, helpers_1.t)((((_a = getDesignPageDefinition(type)) === null || _a === void 0 ? void 0 : _a.labelKey) || "Slide"));
}
exports.getDesignPageLabel = getDesignPageLabel;
function getDesignPageDisplayName(fileName) {
    var normalizedFileName = fileName.replace(/\.[^/.]+$/, "");
    var lastHyphenIndex = normalizedFileName.lastIndexOf("-");
    if (lastHyphenIndex === -1) {
        return normalizedFileName;
    }
    return normalizedFileName.slice(0, lastHyphenIndex);
}
exports.getDesignPageDisplayName = getDesignPageDisplayName;
function getDesignPageFileName(type, designName) {
    var _a;
    return ((_a = getDesignPageDefinition(type)) === null || _a === void 0 ? void 0 : _a.getFileName(designName)) || "";
}
exports.getDesignPageFileName = getDesignPageFileName;
function getDesignThemeFileName(designName) {
    return "sr-design-".concat(designName.toLowerCase(), ".css");
}
exports.getDesignThemeFileName = getDesignThemeFileName;
function inferDesignNameFromPath(path) {
    var lastPart = path.split("/").pop() || "";
    return lastPart.startsWith("Design-")
        ? lastPart.split("-").slice(1).join("-")
        : lastPart;
}
exports.inferDesignNameFromPath = inferDesignNameFromPath;
function normalizeDesignName(input) {
    return input.trim().replace(/[\\/:*?"<>|]/g, "-");
}
exports.normalizeDesignName = normalizeDesignName;
