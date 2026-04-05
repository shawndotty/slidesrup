"use strict";
exports.__esModule = true;
exports.parseThemeDraft = exports.parseDesignPageDraft = void 0;
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
function parsePair(value, fallbackA, fallbackB) {
    if (!value)
        return [fallbackA, fallbackB];
    var parts = value
        .trim()
        .split(/\s+/)
        .map(function (item) { return Number(item); });
    if (parts.length >= 2 && parts.every(function (item) { return !isNaN(item); })) {
        return [parts[0], parts[1]];
    }
    if (value === "topleft")
        return [0, 0];
    if (value === "topright")
        return [50, 0];
    if (value === "bottomleft")
        return [0, 50];
    if (value === "bottomright")
        return [50, 50];
    return [fallbackA, fallbackB];
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
function createFootnotesBlock() {
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: "placeholder",
        rect: {
            x: 0,
            y: 92,
            width: 100,
            height: 8
        },
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
function createSideBarBlock() {
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: "placeholder",
        rect: {
            x: 95,
            y: 35,
            width: 5,
            height: 30
        },
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
function appendRawBlocksAndFootnotes(raw, blocks, state) {
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
                blocks.push(createFootnotesBlock());
                state.hasFootnotesBlock = true;
            }
        }
        else if (!state.hasSideBarBlock) {
            blocks.push(createSideBarBlock());
            state.hasSideBarBlock = true;
        }
        lastIndex = match.index + token.length;
        match = specialRegex.exec(normalizedRaw);
    }
    var tail = createRawBlock(normalizedRaw.slice(lastIndex));
    if (tail)
        blocks.push(tail);
}
function createGridBlock(attrSource, content) {
    var attrs = parseAttributes(attrSource);
    var _a = parsePair(attrs.drag || "", 100, 30), width = _a[0], height = _a[1];
    var _b = parsePair(attrs.drop || "", 0, 0), x = _b[0], y = _b[1];
    var cleanedContent = stripNestedGridMarkup(content);
    // Parse children recursively
    var rawChildren = parseGridBlocks(content, {
        hasFootnotesBlock: true,
        hasSideBarBlock: true
    }); // Prevent footnotes/sidebar inside nested grids
    var children = rawChildren.filter(function (c) { return c.type === "grid"; });
    return {
        id: nextBlockId("grid"),
        type: "grid",
        role: inferRole(content),
        rect: {
            x: clampInt(x, -100, 100),
            y: clampInt(y, -100, 100),
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
        extraAttributes: Object.entries(attrs).reduce(function (result, _a) {
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
        }, {}),
        children: children.length > 0 ? children : undefined
    };
}
function parseGridBlocks(markdown, footnotesState) {
    var blocks = [];
    var _a = parseGridSegments(markdown), topLevelRanges = _a.topLevelRanges, segments = _a.segments;
    if (topLevelRanges.length === 0) {
        appendRawBlocksAndFootnotes(markdown, blocks, footnotesState);
        return blocks;
    }
    var cursor = 0;
    topLevelRanges.forEach(function (range) {
        var before = markdown.slice(cursor, range.start);
        appendRawBlocksAndFootnotes(before, blocks, footnotesState);
        // Find the exact segment that corresponds to this topLevelRange
        var segment = segments.find(function (s) { return s.start === range.start && s.end === range.end; });
        if (segment) {
            blocks.push(createGridBlock(segment.attrSource, segment.content));
        }
        cursor = range.end;
    });
    appendRawBlocksAndFootnotes(markdown.slice(cursor), blocks, footnotesState);
    return blocks;
}
function parseDesignPageDraft(pageType, designName, filePath, markdown) {
    var fileName = (0, design_maker_schema_1.getDesignPageFileName)(pageType, designName);
    var footnotesState = {
        hasFootnotesBlock: false,
        hasSideBarBlock: false
    };
    var blocks = parseGridBlocks(markdown, footnotesState);
    return {
        type: pageType,
        label: (0, design_maker_schema_1.getDesignPageDisplayName)(fileName),
        fileName: fileName,
        filePath: filePath,
        blocks: blocks,
        rawMarkdown: markdown,
        hasUnsupportedContent: blocks.some(function (block) { return block.type === "raw"; })
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
