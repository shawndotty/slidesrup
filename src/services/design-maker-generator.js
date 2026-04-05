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
exports.__esModule = true;
exports.syncDraftRawMarkdown = exports.generateThemeCss = exports.generatePageMarkdown = void 0;
function formatRectValue(value) {
    return "".concat(Math.round(value));
}
function serializeAttributes(block) {
    var attrs = {
        drag: "".concat(formatRectValue(block.rect.width), " ").concat(formatRectValue(block.rect.height)),
        drop: "".concat(formatRectValue(block.rect.x), " ").concat(formatRectValue(block.rect.y))
    };
    if (block.className.trim())
        attrs["class"] = block.className.trim();
    if (block.align.trim())
        attrs.align = block.align.trim();
    if (block.pad.trim())
        attrs.pad = block.pad.trim();
    if (block.style.trim())
        attrs.style = block.style.trim();
    if (block.flow.trim())
        attrs.flow = block.flow.trim();
    if (block.filter.trim())
        attrs.filter = block.filter.trim();
    if (block.bg.trim())
        attrs.bg = block.bg.trim();
    if (block.border.trim())
        attrs.border = block.border.trim();
    if (block.animate.trim())
        attrs.animate = block.animate.trim();
    if (block.opacity.trim())
        attrs.opacity = block.opacity.trim();
    if (block.rotate.trim())
        attrs.rotate = block.rotate.trim();
    if (block.frag.trim())
        attrs.frag = block.frag.trim();
    if (block.justifyContent.trim()) {
        attrs["justify-content"] = block.justifyContent.trim();
    }
    Object.entries(block.extraAttributes).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (!attrs[key] && value.trim()) {
            attrs[key] = value.trim();
        }
    });
    return Object.entries(attrs)
        .map(function (_a) {
        var key = _a[0], value = _a[1];
        return "".concat(key, "=\"").concat(value, "\"");
    })
        .join(" ");
}
function generateGridBlock(block) {
    var childrenStr = (block.children || [])
        .map(function (child) {
        return child.type === "grid" ? generateGridBlock(child) : child.raw.trim();
    })
        .filter(Boolean)
        .join("\n\n");
    var innerContent = [block.content, childrenStr]
        .filter(Boolean)
        .join("\n\n");
    return "<grid ".concat(serializeAttributes(block), ">\n").concat(innerContent, "\n</grid>");
}
function generatePageMarkdown(page) {
    return page.blocks
        .map(function (block) {
        return block.type === "grid" ? generateGridBlock(block) : block.raw.trim();
    })
        .filter(Boolean)
        .join("\n\n")
        .trim();
}
exports.generatePageMarkdown = generatePageMarkdown;
function generateThemeCss(theme, designName) {
    var header = theme.headerDirectives.length > 0
        ? theme.headerDirectives
        : [
            "/* @theme sr-design-".concat(designName.toLowerCase(), " */"),
            '@import "sr-base"',
        ];
    var generatedCss = "\n:root {\n\t--sr-dm-primary: ".concat(theme.primaryColor, ";\n\t--sr-dm-secondary: ").concat(theme.secondaryColor, ";\n\t--sr-dm-background: ").concat(theme.backgroundColor, ";\n\t--sr-dm-text: ").concat(theme.textColor, ";\n\t--sr-dm-heading-font: ").concat(theme.headingFont, ";\n\t--sr-dm-body-font: ").concat(theme.bodyFont, ";\n\t--sr-dm-heading-scale: ").concat(theme.headingScale, ";\n\t--sr-dm-body-scale: ").concat(theme.bodyScale, ";\n\t--sr-dm-radius: ").concat(theme.borderRadius, "px;\n\t--sr-dm-shadow-opacity: ").concat(theme.shadowOpacity, ";\n\t--sr-dm-mode: ").concat(theme.mode, ";\n}\n\nsection,\n.reveal section,\n.slides section {\n\tbackground: var(--sr-dm-background);\n\tcolor: var(--sr-dm-text);\n\tfont-family: var(--sr-dm-body-font);\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n\tfont-family: var(--sr-dm-heading-font);\n\tcolor: var(--sr-dm-primary);\n}\n\n.bg-with-back-color {\n\tbackground: var(--sr-dm-primary);\n\tcolor: #ffffff;\n}\n\n.bg-with-front-color {\n\tbackground: color-mix(in srgb, var(--sr-dm-background) 90%, var(--sr-dm-secondary) 10%);\n\tcolor: var(--sr-dm-text);\n\tborder-radius: var(--sr-dm-radius);\n\tbox-shadow: 0 18px 40px rgba(15, 23, 42, var(--sr-dm-shadow-opacity));\n}\n\n.has-dark-background {\n\tcolor: #ffffff;\n}\n\n.has-light-background {\n\tcolor: var(--sr-dm-text);\n}\n").trim();
    return "".concat(header.join("\n"), "\n\n").concat(generatedCss, "\n\n").concat(theme.rawCss.trim(), "\n");
}
exports.generateThemeCss = generateThemeCss;
function syncDraftRawMarkdown(draft) {
    var nextPages = __assign({}, draft.pages);
    Object.values(nextPages).forEach(function (page) {
        page.rawMarkdown = generatePageMarkdown(page);
    });
    return __assign(__assign({}, draft), { pages: nextPages });
}
exports.syncDraftRawMarkdown = syncDraftRawMarkdown;
