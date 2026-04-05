"use strict";
exports.__esModule = true;
exports.parseThemeDraft = exports.parseDesignPageDraft = exports.parseRectInputValue = exports.formatRectInputValue = void 0;
var design_maker_schema_1 = require("./design-maker-schema");
var blockSeed = 0;
function nextBlockId(prefix) {
    blockSeed += 1;
    return "".concat(prefix, "-").concat(blockSeed);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function clampInt(value, min, max) {
    return Math.round(clamp(value, min, max));
}
function detectExplicitRectUnit(value) {
    var parts = (value || "").trim().split(/\s+/).filter(Boolean);
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        var match = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
        if (!match)
            continue;
        var unit = (match[2] || "").toLowerCase();
        if (unit === "px")
            return "px";
        if (unit === "%" || unit === "percent")
            return "percent";
    }
    return null;
}
function formatRectInputValue(value, rectUnit) {
    var rounded = Math.round(value);
    return rectUnit === "px" ? "".concat(rounded, "px") : "".concat(rounded);
}
exports.formatRectInputValue = formatRectInputValue;
function parseRectInputValue(raw) {
    var trimmed = raw.trim();
    if (!trimmed)
        return null;
    if (trimmed.toLowerCase().endsWith("px")) {
        var num_1 = Number(trimmed.slice(0, -2).trim());
        if (!Number.isFinite(num_1))
            return null;
        return { value: num_1, rectUnit: "px" };
    }
    var num = Number(trimmed);
    if (!Number.isFinite(num))
        return null;
    return { value: num, rectUnit: "percent" };
}
exports.parseRectInputValue = parseRectInputValue;
function parsePair(value, fallbackA, fallbackB, rectUnit, warnings) {
    if (!value)
        return [fallbackA, fallbackB];
    var trimmed = value.trim();
    if (rectUnit !== "px") {
        if (trimmed === "topleft")
            return [0, 0];
        if (trimmed === "topright")
            return [50, 0];
        if (trimmed === "bottomleft")
            return [0, 50];
        if (trimmed === "bottomright")
            return [50, 50];
    }
    else if ([
        "topleft",
        "topright",
        "bottomleft",
        "bottomright",
        "center",
        "top",
        "bottom",
        "left",
        "right",
    ].includes(trimmed)) {
        warnings.push("Detected keyword positioning \"".concat(trimmed, "\" in px mode; falling back to defaults."));
        return [fallbackA, fallbackB];
    }
    var parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        var a = parseNumericToken(parts[0], rectUnit, "x", warnings);
        var b = parseNumericToken(parts[1], rectUnit, "y", warnings);
        if (a != null && b != null)
            return [a, b];
    }
    return [fallbackA, fallbackB];
}
var DEFAULT_DESIGN_BASE_WIDTH = 1920;
var DEFAULT_DESIGN_BASE_HEIGHT = 1080;
function parseNumericToken(token, rectUnit, dimension, warnings) {
    var match = token.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
    if (!match)
        return null;
    var value = Number(match[1]);
    if (!Number.isFinite(value))
        return null;
    var unit = (match[2] || "").toLowerCase();
    var isPx = unit === "px";
    var isPercent = unit === "%" || unit === "";
    if (rectUnit === "px") {
        if (isPercent) {
            var base = dimension === "x"
                ? DEFAULT_DESIGN_BASE_WIDTH
                : DEFAULT_DESIGN_BASE_HEIGHT;
            return Math.round((value / 100) * base);
        }
        if (!isPx) {
            warnings.push("Detected unsupported unit \"".concat(unit, "\" in px mode; treating it as px."));
        }
        return Math.round(value);
    }
    else {
        if (isPx) {
            var base = dimension === "x"
                ? DEFAULT_DESIGN_BASE_WIDTH
                : DEFAULT_DESIGN_BASE_HEIGHT;
            return Math.round((value / base) * 100);
        }
        if (unit && unit !== "%") {
            warnings.push("Detected unsupported unit \"".concat(unit, "\" in percent mode; stripping unit and treating it as a number."));
        }
        return Math.round(value);
    }
}
function detectDefaultRectUnit(markdown) {
    var warnings = [];
    var unitsSeen = new Set();
    var hasBareNumber = false;
    var attrRegex = /\b(?:drag|drop)\s*=\s*"([^"]*)"/g;
    var match = attrRegex.exec(markdown);
    while (match) {
        var value = match[1] || "";
        var parts = value.trim().split(/\s+/).filter(Boolean);
        for (var _i = 0, parts_2 = parts; _i < parts_2.length; _i++) {
            var part = parts_2[_i];
            var m = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
            if (!m)
                continue;
            var unit = (m[2] || "").toLowerCase();
            if (!unit)
                hasBareNumber = true;
            else
                unitsSeen.add(unit);
        }
        match = attrRegex.exec(markdown);
    }
    var rectUnit = unitsSeen.has("px") && !hasBareNumber ? "px" : "percent";
    var unsupportedUnits = Array.from(unitsSeen).filter(function (u) { return u !== "px" && u !== "%"; });
    if (unsupportedUnits.length > 0) {
        warnings.push("Detected unsupported units in template: ".concat(unsupportedUnits.join(", "), ". They will be auto-corrected."));
    }
    return { rectUnit: rectUnit, warnings: warnings };
}
function parseAttributes(raw) {
    var attrs = {};
    var attrRegex = /([:\w-]+)="([^"]*)"/g;
    var match = attrRegex.exec(raw);
    while (match) {
        attrs[match[1]] = match[2];
        match = attrRegex.exec(raw);
    }
    return attrs;
}
function parseGridSegments(source) {
    var segments = [];
    var topLevelRanges = [];
    var stack = [];
    var tokenRegex = /<grid\b([^>]*)>|<\/grid>/g;
    var match = tokenRegex.exec(source);
    while (match) {
        var token = match[0];
        if (token.startsWith("<grid")) {
            stack.push({
                attrSource: match[1] || "",
                start: match.index,
                openEnd: tokenRegex.lastIndex
            });
        }
        else {
            var opening = stack.pop();
            if (!opening) {
                match = tokenRegex.exec(source);
                continue;
            }
            var segment = {
                attrSource: opening.attrSource,
                content: source.slice(opening.openEnd, match.index),
                start: opening.start,
                end: tokenRegex.lastIndex
            };
            segments.push(segment);
            if (stack.length === 0) {
                topLevelRanges.push({
                    start: opening.start,
                    end: tokenRegex.lastIndex
                });
            }
        }
        match = tokenRegex.exec(source);
    }
    segments.sort(function (a, b) { return a.start - b.start; });
    topLevelRanges.sort(function (a, b) { return a.start - b.start; });
    return {
        segments: segments,
        topLevelRanges: topLevelRanges
    };
}
function stripNestedGridMarkup(content) {
    var topLevelRanges = parseGridSegments(content).topLevelRanges;
    if (topLevelRanges.length === 0) {
        return content.trim();
    }
    var cursor = 0;
    var result = "";
    topLevelRanges.forEach(function (range) {
        result += content.slice(cursor, range.start);
        cursor = range.end;
    });
    result += content.slice(cursor);
    return result.trim();
}
function inferRole(content) {
    var trimmed = content.trim();
    if (trimmed.includes("<% content %>"))
        return "content";
    if (trimmed.startsWith("!["))
        return "image";
    if (trimmed.includes("{{"))
        return "placeholder";
    if (!trimmed)
        return "grid";
    return "text";
}
function createRawBlock(raw) {
    if (!raw.trim())
        return null;
    return {
        id: nextBlockId("raw"),
        type: "raw",
        raw: raw.trim()
    };
}
function createFootnotesBlock(rectUnit) {
    var rect = rectUnit === "px"
        ? {
            x: 0,
            y: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 92) / 100),
            width: DEFAULT_DESIGN_BASE_WIDTH,
            height: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 8) / 100)
        }
        : { x: 0, y: 92, width: 100, height: 8 };
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: "placeholder",
        rect: rect,
        content: "<%? footnotes %>",
        className: "footnotes",
        style: "",
        pad: "0 40px",
        align: "topleft",
        flow: "",
        filter: "",
        justifyContent: "",
        bg: "",
        border: "",
        animate: "",
        opacity: "",
        rotate: "",
        frag: "",
        extraAttributes: {}
    };
}
function createSideBarBlock(rectUnit) {
    var rect = rectUnit === "px"
        ? {
            x: Math.round((DEFAULT_DESIGN_BASE_WIDTH * 95) / 100),
            y: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 35) / 100),
            width: Math.round((DEFAULT_DESIGN_BASE_WIDTH * 5) / 100),
            height: Math.round((DEFAULT_DESIGN_BASE_HEIGHT * 30) / 100)
        }
        : { x: 95, y: 35, width: 5, height: 30 };
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: "placeholder",
        rect: rect,
        content: "![[SR-SideBar]]",
        className: "sr-sidebar",
        style: "",
        pad: "0",
        align: "topleft",
        flow: "",
        filter: "",
        justifyContent: "",
        bg: "",
        border: "",
        animate: "",
        opacity: "",
        rotate: "",
        frag: "",
        extraAttributes: {}
    };
}
function appendRawBlocksAndFootnotes(raw, blocks, state, rectUnit, warnings) {
    var normalizedRaw = raw.trim();
    if (!normalizedRaw)
        return;
    var specialRegex = /<%\?\s*footnotes\s*%>|!\[\[\s*SR-SideBar(?:\|[^\]]+)?\s*\]\]/g;
    if (!specialRegex.test(normalizedRaw)) {
        var rawBlock = createRawBlock(raw);
        if (rawBlock)
            blocks.push(rawBlock);
        return;
    }
    specialRegex.lastIndex = 0;
    var lastIndex = 0;
    var match = specialRegex.exec(normalizedRaw);
    while (match) {
        var segment = normalizedRaw.slice(lastIndex, match.index);
        var rawBlock = createRawBlock(segment);
        if (rawBlock)
            blocks.push(rawBlock);
        var token = match[0];
        if (token.includes("footnotes")) {
            if (!state.hasFootnotesBlock) {
                blocks.push(createFootnotesBlock(rectUnit));
                state.hasFootnotesBlock = true;
            }
        }
        else if (!state.hasSideBarBlock) {
            blocks.push(createSideBarBlock(rectUnit));
            state.hasSideBarBlock = true;
        }
        lastIndex = match.index + token.length;
        match = specialRegex.exec(normalizedRaw);
    }
    var tail = createRawBlock(normalizedRaw.slice(lastIndex));
    if (tail)
        blocks.push(tail);
}
function createGridBlock(attrSource, content, inheritedRectUnit, warnings) {
    var attrs = parseAttributes(attrSource);
    var explicitUnit = detectExplicitRectUnit(attrs.drag || "") ||
        detectExplicitRectUnit(attrs.drop || "");
    var rectUnit = explicitUnit !== null && explicitUnit !== void 0 ? explicitUnit : inheritedRectUnit;
    var _a = parsePair(attrs.drag || "", 100, 30, rectUnit, warnings), width = _a[0], height = _a[1];
    var _b = parsePair(attrs.drop || "", 0, 0, rectUnit, warnings), x = _b[0], y = _b[1];
    var cleanedContent = stripNestedGridMarkup(content);
    // Parse children recursively
    var rawChildren = parseGridBlocks(content, {
        hasFootnotesBlock: true,
        hasSideBarBlock: true
    }, rectUnit, warnings); // Prevent footnotes/sidebar inside nested grids
    var children = rawChildren.filter(function (c) { return c.type === "grid"; });
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: inferRole(content),
        rect: {
            x: rectUnit === "px" ? Math.round(x) : clampInt(x, -100, 100),
            y: rectUnit === "px" ? Math.round(y) : clampInt(y, -100, 100),
            width: Math.max(1, Math.round(width)),
            height: Math.max(1, Math.round(height))
        },
        content: cleanedContent,
        className: attrs["class"] || "",
        style: attrs.style || "",
        pad: attrs.pad || "",
        align: attrs.align || "",
        flow: attrs.flow || "",
        filter: attrs.filter || "",
        justifyContent: attrs["justify-content"] || "",
        bg: attrs.bg || "",
        border: attrs.border || "",
        animate: attrs.animate || "",
        opacity: attrs.opacity || "",
        rotate: attrs.rotate || "",
        frag: attrs.frag || "",
        extraAttributes: (function () {
            var extra = Object.entries(attrs).reduce(function (result, _a) {
                var key = _a[0], value = _a[1];
                if ([
                    "drag",
                    "drop",
                    "class",
                    "style",
                    "pad",
                    "align",
                    "flow",
                    "filter",
                    "justify-content",
                    "bg",
                    "border",
                    "animate",
                    "opacity",
                    "rotate",
                    "frag",
                ].includes(key)) {
                    return result;
                }
                result[key] = value;
                return result;
            }, {});
            if (rectUnit === "px") {
                extra.rectUnit = "px";
            }
            return extra;
        })(),
        children: children.length > 0 ? children : undefined
    };
}
function parseGridBlocks(markdown, footnotesState, rectUnit, warnings) {
    var blocks = [];
    var _a = parseGridSegments(markdown), topLevelRanges = _a.topLevelRanges, segments = _a.segments;
    if (topLevelRanges.length === 0) {
        appendRawBlocksAndFootnotes(markdown, blocks, footnotesState, rectUnit, warnings);
        return blocks;
    }
    var cursor = 0;
    topLevelRanges.forEach(function (range) {
        var before = markdown.slice(cursor, range.start);
        appendRawBlocksAndFootnotes(before, blocks, footnotesState, rectUnit, warnings);
        // Find the exact segment that corresponds to this topLevelRange
        var segment = segments.find(function (s) { return s.start === range.start && s.end === range.end; });
        if (segment) {
            blocks.push(createGridBlock(segment.attrSource, segment.content, rectUnit, warnings));
        }
        cursor = range.end;
    });
    appendRawBlocksAndFootnotes(markdown.slice(cursor), blocks, footnotesState, rectUnit, warnings);
    return blocks;
}
function parseDesignPageDraft(pageType, designName, filePath, markdown) {
    var fileName = (0, design_maker_schema_1.getDesignPageFileName)(pageType, designName);
    var footnotesState = {
        hasFootnotesBlock: false,
        hasSideBarBlock: false
    };
    var _a = detectDefaultRectUnit(markdown), defaultRectUnit = _a.rectUnit, warnings = _a.warnings;
    var blocks = parseGridBlocks(markdown, footnotesState, defaultRectUnit, warnings);
    var units = new Set();
    var collect = function (items) {
        items.forEach(function (block) {
            if (block.type !== "grid")
                return;
            units.add(block.extraAttributes.rectUnit === "px" ? "px" : "percent");
            if (block.children)
                collect(block.children);
        });
    };
    collect(blocks);
    var rectUnit = units.has("px") && !units.has("percent") ? "px" : "percent";
    return {
        type: pageType,
        label: (0, design_maker_schema_1.getDesignPageDisplayName)(fileName),
        fileName: fileName,
        filePath: filePath,
        blocks: blocks,
        rawMarkdown: markdown,
        hasUnsupportedContent: blocks.some(function (block) { return block.type === "raw"; }),
        rectUnit: rectUnit,
        unitWarnings: warnings.length > 0 ? warnings : undefined
    };
}
exports.parseDesignPageDraft = parseDesignPageDraft;
function readCssValue(css, key, fallback) {
    var _a;
    var match = css.match(new RegExp("".concat(key, "\\s*:\\s*([^;]+);")));
    return ((_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim()) || fallback;
}
function readNumberValue(css, key, fallback) {
    var value = readCssValue(css, key, "".concat(fallback));
    var parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
}
function parseThemeDraft(designName, cssContent) {
    var lines = cssContent.split("\n");
    var headerDirectives = lines.filter(function (line) {
        var trimmed = line.trim();
        return trimmed.startsWith("/* @theme") || trimmed.startsWith("@import");
    });
    var rawCss = lines
        .filter(function (line) { return !headerDirectives.includes(line); })
        .join("\n")
        .trim();
    return {
        themeName: "sr-design-".concat(designName.toLowerCase()),
        primaryColor: readCssValue(rawCss, "--sr-dm-primary", "#0044ff"),
        secondaryColor: readCssValue(rawCss, "--sr-dm-secondary", "#7c3aed"),
        backgroundColor: readCssValue(rawCss, "--sr-dm-background", "#ffffff"),
        textColor: readCssValue(rawCss, "--sr-dm-text", "#111111"),
        headingFont: readCssValue(rawCss, "--sr-dm-heading-font", "inherit"),
        bodyFont: readCssValue(rawCss, "--sr-dm-body-font", "inherit"),
        headingScale: readNumberValue(rawCss, "--sr-dm-heading-scale", 1),
        bodyScale: readNumberValue(rawCss, "--sr-dm-body-scale", 1),
        borderRadius: readNumberValue(rawCss, "--sr-dm-radius", 24),
        shadowOpacity: readNumberValue(rawCss, "--sr-dm-shadow-opacity", 0.18),
        mode: readCssValue(rawCss, "--sr-dm-mode", "light") === "dark"
            ? "dark"
            : "light",
        headerDirectives: headerDirectives,
        rawCss: rawCss
    };
}
exports.parseThemeDraft = parseThemeDraft;
