"use strict";
exports.__esModule = true;
exports.GridTransformer = void 0;
var yamlStore_1 = require("src/yamlStore");
var GridTransformer = /** @class */ (function () {
    function GridTransformer() {
        this.gridAttributeRegex = /^(?:(-?\d+(?:px)?)(?:\s*|x)(-?\d+(?:px)?)|(center|top|bottom|left|right|topleft|topright|bottomleft|bottomright))$/m;
        this.maxWidth = yamlStore_1.YamlStore.getInstance().options.width;
        this.maxHeight = yamlStore_1.YamlStore.getInstance().options.height;
        this.isCenter = yamlStore_1.YamlStore.getInstance().options.center;
    }
    GridTransformer.prototype.transform = function (element) {
        var _a, _b;
        var defaultDrop;
        var defaultUnit;
        var isAbsolute = element.getAttribute("absolute") == "true";
        if (isAbsolute) {
            defaultDrop = "480px 700px";
            defaultUnit = "px";
        }
        else {
            defaultDrop = "50 100";
            defaultUnit = "%";
        }
        var drop = element.getAttribute("drop");
        if (drop != undefined) {
            var drag = (_a = element.getAttribute("drag")) !== null && _a !== void 0 ? _a : defaultDrop;
            var grid = this.read(drag, drop, isAbsolute);
            if (grid != undefined) {
                var left = this.leftOf(grid) + defaultUnit;
                var top_1 = this.topOf(grid) + defaultUnit;
                var height = this.heightOf(grid) + defaultUnit;
                var width = this.widthOf(grid) + defaultUnit;
                element.addStyle("position", "absolute");
                element.addStyle("left", left);
                element.addStyle("top", top_1);
                element.addStyle("height", height);
                element.addStyle("width", width);
                if (isAbsolute) {
                    element.addStyle("min-height", height);
                }
                element.deleteAttribute("drag");
                element.deleteAttribute("drop");
            }
        }
        if (element.getAttribute("align") || drop) {
            var flow = element.getAttribute("flow");
            var _c = this.getAlignment(element.getAttribute("align"), flow), align = _c[0], alignItems = _c[1], justifyContent = _c[2], stretch = _c[3];
            var justifyCtx = (_b = element.getAttribute("justify-content")) !== null && _b !== void 0 ? _b : justifyContent;
            if (align) {
                element.addAttribute("align", align, false);
            }
            if (stretch) {
                element.addClass(stretch);
            }
            switch (flow) {
                case "row":
                    element.addStyle("display", "flex");
                    element.addStyle("flex-direction", "row");
                    element.addStyle("align-items", alignItems);
                    element.addStyle("justify-content", justifyCtx);
                    element.addClass("flex-even");
                    break;
                case "col":
                default:
                    element.addStyle("display", "flex");
                    element.addStyle("flex-direction", "column");
                    element.addStyle("align-items", alignItems);
                    element.addStyle("justify-content", justifyCtx);
                    break;
            }
            if (this.isCenter != undefined && !this.isCenter) {
                element.addStyle("align-items", "start");
            }
            element.deleteAttribute("flow");
            element.deleteAttribute("justify-content");
        }
    };
    GridTransformer.prototype.getAlignment = function (input, flow) {
        var direction = flow !== null && flow !== void 0 ? flow : "col";
        switch (input) {
            case "topleft":
                if (direction == "col") {
                    return ["left", "flex-start", "flex-start", undefined];
                }
                else {
                    return ["left", "flex-start", "space-evenly", undefined];
                }
            case "topright":
                if (direction == "col") {
                    return ["right", "flex-end", "flex-start", undefined];
                }
                else {
                    return ["right", "flex-start", "space-evenly", undefined];
                }
            case "bottomright":
                if (direction == "col") {
                    return ["right", "flex-end", "flex-end", undefined];
                }
                else {
                    return ["right", "flex-end", "space-evenly", undefined];
                }
            case "bottomleft":
                if (direction == "col") {
                    return ["left", "flex-start", "flex-end", undefined];
                }
                else {
                    return ["left", "flex-end", "space-evenly", undefined];
                }
            case "left":
                if (direction == "col") {
                    return ["left", "flex-start", "space-evenly", undefined];
                }
                else {
                    return ["left", "center", "space-evenly", undefined];
                }
            case "right":
                if (direction == "col") {
                    return ["right", "flex-end", "space-evenly", undefined];
                }
                else {
                    return ["right", "center", "space-evenly", undefined];
                }
            case "top":
                if (direction == "col") {
                    return [undefined, "center", "flex-start", undefined];
                }
                else {
                    return [undefined, "flex-start", "space-evenly", undefined];
                }
            case "bottom":
                if (direction == "col") {
                    return [undefined, "center", "flex-end", undefined];
                }
                else {
                    return [undefined, "flex-end", "space-evenly", undefined];
                }
            case "stretch":
                if (direction == "col") {
                    return [
                        undefined,
                        "center",
                        "space-evenly",
                        "stretch-column",
                    ];
                }
                else {
                    return [undefined, "center", "space-evenly", "stretch-row"];
                }
            case "block":
            case "justify":
                return ["justify", "center", "space-evenly", undefined];
            case "center":
            default:
                // align - alignItems - justifyContent
                return [undefined, "center", "center", undefined];
        }
    };
    GridTransformer.prototype.read = function (drag, drop, isAbsolute) {
        try {
            var result = new Map();
            result.set("slideWidth", this.maxWidth);
            result.set("slideHeight", this.maxHeight);
            if (isAbsolute) {
                result.set("maxWidth", this.maxWidth);
                result.set("maxHeight", this.maxHeight);
                return this.readValues(drag, drop, result, this.toPixel);
            }
            else {
                result.set("maxWidth", 100);
                result.set("maxHeight", 100);
                return this.readValues(drag, drop, result, this.toRelativeValue);
            }
        }
        catch (ex) {
            return undefined;
        }
    };
    GridTransformer.prototype.readValues = function (drag, drop, result, valueTransformer) {
        try {
            var dragMatch = this.gridAttributeRegex.exec(drag);
            var dropMatch = this.gridAttributeRegex.exec(drop);
            var width = dragMatch === null || dragMatch === void 0 ? void 0 : dragMatch[1];
            var height = dragMatch === null || dragMatch === void 0 ? void 0 : dragMatch[2];
            var x = dropMatch === null || dropMatch === void 0 ? void 0 : dropMatch[1];
            var y = dropMatch === null || dropMatch === void 0 ? void 0 : dropMatch[2];
            var name_1 = dropMatch === null || dropMatch === void 0 ? void 0 : dropMatch[3];
            var parsedWidth = width ? this.parseWidthOrHeight(width) : null;
            var parsedHeight = height
                ? this.parseWidthOrHeight(height)
                : null;
            if (!parsedWidth || !parsedHeight)
                return undefined;
            result.set("width", valueTransformer(result.get("slideWidth"), parsedWidth));
            result.set("height", valueTransformer(result.get("slideHeight"), parsedHeight));
            if (name_1) {
                var _a = this.getXYof(name_1, result.get("width"), result.get("height"), result.get("maxWidth"), result.get("maxHeight")), nx = _a[0], ny = _a[1];
                result.set("x", nx);
                result.set("y", ny);
            }
            else {
                if (x) {
                    var parsedX = this.parseXY(x);
                    if (!parsedX)
                        return undefined;
                    result.set("x", valueTransformer(result.get("slideWidth"), parsedX));
                }
                else {
                    return undefined;
                }
                if (y) {
                    var parsedY = this.parseXY(y);
                    if (!parsedY)
                        return undefined;
                    result.set("y", valueTransformer(result.get("slideHeight"), parsedY));
                }
                else {
                    return undefined;
                }
            }
            return result;
        }
        catch (ex) {
            return undefined;
        }
    };
    GridTransformer.prototype.parseWidthOrHeight = function (input) {
        var trimmed = input.trim();
        if (!trimmed)
            return null;
        if (trimmed.toLowerCase().endsWith("px")) {
            var raw = trimmed.slice(0, -2).trim();
            if (!/^\d+$/.test(raw))
                return null;
            var px = Number(raw);
            if (!Number.isFinite(px) || px <= 0)
                return null;
            return "".concat(Math.round(px), "px");
        }
        if (!/^\d+$/.test(trimmed))
            return null;
        var ratio = Number(trimmed);
        if (!Number.isFinite(ratio) || ratio <= 0)
            return null;
        return "".concat(Math.round(ratio));
    };
    GridTransformer.prototype.parseXY = function (input) {
        var trimmed = input.trim();
        if (!trimmed)
            return null;
        if (trimmed.toLowerCase().endsWith("px")) {
            var raw = trimmed.slice(0, -2).trim();
            if (!/^-?\d+$/.test(raw))
                return null;
            var px = Number(raw);
            if (!Number.isFinite(px))
                return null;
            return "".concat(Math.round(px), "px");
        }
        if (!/^-?\d+$/.test(trimmed))
            return null;
        var ratio = Number(trimmed);
        if (!Number.isFinite(ratio))
            return null;
        return "".concat(Math.round(ratio));
    };
    GridTransformer.prototype.toRelativeValue = function (max, input) {
        if (input.toLowerCase().endsWith("px")) {
            return ((Number(input.toLowerCase().replace("px", "").trim()) / max) *
                100);
        }
        else {
            return Number(input);
        }
    };
    GridTransformer.prototype.toPixel = function (max, input) {
        if (input.toLowerCase().endsWith("px")) {
            return Number(input.toLowerCase().replace("px", "").trim());
        }
        else {
            return (max / 100) * Number(input);
        }
    };
    GridTransformer.prototype.getXYof = function (name, width, height, maxWidth, maxHeight) {
        switch (name) {
            case "topleft":
                return [0, 0];
            case "topright":
                return [maxWidth - width, 0];
            case "bottomleft":
                return [0, maxHeight - height];
            case "bottomright":
                return [maxWidth - width, maxHeight - height];
            case "left":
                return [0, (maxHeight - height) / 2];
            case "right":
                return [maxWidth - width, (maxHeight - height) / 2];
            case "top":
                return [(maxWidth - width) / 2, 0];
            case "bottom":
                return [(maxWidth - width) / 2, maxHeight - height];
            case "center":
                return [(maxWidth - width) / 2, (maxHeight - height) / 2];
            default:
                return [0, 0];
        }
    };
    GridTransformer.prototype.leftOf = function (grid) {
        if (grid.get("x") < 0) {
            return (grid.get("maxWidth") +
                grid.get("x") -
                grid.get("width"));
        }
        else {
            return grid.get("x");
        }
    };
    GridTransformer.prototype.topOf = function (grid) {
        if (grid.get("y") < 0) {
            return (grid.get("maxHeight") +
                grid.get("y") -
                grid.get("height"));
        }
        else {
            return grid.get("y");
        }
    };
    GridTransformer.prototype.heightOf = function (grid) {
        return grid.get("height");
    };
    GridTransformer.prototype.widthOf = function (grid) {
        return grid.get("width");
    };
    return GridTransformer;
}());
exports.GridTransformer = GridTransformer;
