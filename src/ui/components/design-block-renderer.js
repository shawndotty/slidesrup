"use strict";
exports.__esModule = true;
exports.renderBlockContent = void 0;
var obsidian_1 = require("obsidian");
function stripHtmlComments(content) {
    return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}
function extractStyleBlocks(content) {
    var matches = content.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || [];
    return matches
        .map(function (item) {
        return item
            .replace(/^<style\b[^>]*>/i, "")
            .replace(/<\/style>$/i, "")
            .trim();
    })
        .filter(Boolean);
}
function stripStyleBlocks(content) {
    return content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").trim();
}
function extractSvgMarkup(content) {
    var matches = content.match(/<svg[\s\S]*?<\/svg>/gi);
    if (!matches || matches.length === 0)
        return null;
    return matches.join("\n");
}
function extractImageUrl(content) {
    var markdownImageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (markdownImageMatch === null || markdownImageMatch === void 0 ? void 0 : markdownImageMatch[1])
        return markdownImageMatch[1];
    var obsidianImageMatch = content.match(/!\[\[([^|\]]+)/);
    if ((obsidianImageMatch === null || obsidianImageMatch === void 0 ? void 0 : obsidianImageMatch[1]) &&
        looksLikeImageResource(obsidianImageMatch[1])) {
        return obsidianImageMatch[1];
    }
    return null;
}
function extractObsidianEmbedTarget(content) {
    var _a;
    var obsidianEmbedMatch = content.match(/!\[\[([^|\]]+)/);
    return ((_a = obsidianEmbedMatch === null || obsidianEmbedMatch === void 0 ? void 0 : obsidianEmbedMatch[1]) === null || _a === void 0 ? void 0 : _a.trim()) || null;
}
function looksLikeImageResource(target) {
    return /\.(png|jpg|jpeg|gif|svg|webp|bmp|avif)$/i.test(target.trim());
}
function resolveObsidianImageUrl(target, context) {
    var normalized = target.trim();
    if (!normalized)
        return normalized;
    if (/^https?:\/\//i.test(normalized) ||
        /^data:/i.test(normalized) ||
        /^file:/i.test(normalized) ||
        normalized.startsWith("/")) {
        return normalized;
    }
    var app = context === null || context === void 0 ? void 0 : context.app;
    if (!app)
        return normalized;
    var sourcePath = (context === null || context === void 0 ? void 0 : context.sourcePath) || "";
    var linked = app.metadataCache.getFirstLinkpathDest(normalized, sourcePath);
    if (linked instanceof obsidian_1.TFile) {
        return app.vault.getResourcePath(linked);
    }
    var direct = app.vault.getAbstractFileByPath(normalized);
    if (direct instanceof obsidian_1.TFile) {
        return app.vault.getResourcePath(direct);
    }
    return normalized;
}
function renderSvg(container, markup) {
    container.addClass("slides-rup-design-maker-has-svg-content");
    var wrapper = container.createDiv("slides-rup-design-maker-rendered-svg");
    wrapper.innerHTML = markup;
    return true;
}
function renderImage(container, url) {
    var img = container.createEl("img", {
        cls: "slides-rup-design-maker-rendered-image"
    });
    img.src = url;
    img.alt = "";
    return true;
}
function injectHiddenStyles(container, styleBlocks) {
    styleBlocks.forEach(function (styleText) {
        var styleEl = container.createEl("style");
        styleEl.textContent = styleText;
    });
}
function extractPlaceholderTokens(content) {
    var matches = content.match(/<%[\s\S]*?%>|\{\{[\s\S]*?\}\}/g) || [];
    return matches.map(function (item) { return item.trim(); }).filter(Boolean);
}
function normalizePlaceholderLabel(token) {
    return token
        .replace(/^<%\??\s*/, "")
        .replace(/\s*%>$/, "")
        .replace(/^\{\{\s*/, "")
        .replace(/\s*\}\}$/, "")
        .replace(/_/g, " ")
        .trim();
}
function toDisplayPlaceholderLabel(label) {
    if (!label)
        return "";
    var normalized = label.replace(/\s+/g, " ").trim();
    if (normalized.toLowerCase() === "toc")
        return "TOC";
    return normalized.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
}
function getPlaceholderMeta(token) {
    var normalized = normalizePlaceholderLabel(token).toLowerCase();
    if (normalized.includes("content")) {
        return {
            icon: "▣",
            className: "is-layout",
            label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token))
        };
    }
    if (normalized.includes("toc") ||
        normalized.includes("nav") ||
        normalized.includes("chapter") ||
        normalized.includes("page index")) {
        return {
            icon: "☰",
            className: "is-navigation",
            label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token))
        };
    }
    if (normalized.includes("author") ||
        normalized.includes("presenter") ||
        normalized.includes("date")) {
        return {
            icon: "◔",
            className: "is-metadata",
            label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token))
        };
    }
    if (normalized.includes("tagline") ||
        normalized.includes("logo") ||
        normalized.includes("slogan") ||
        normalized.includes("chapter name") ||
        normalized.includes("slide name")) {
        return {
            icon: "✦",
            className: "is-branding",
            label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token))
        };
    }
    return {
        icon: "◇",
        className: "is-variable",
        label: toDisplayPlaceholderLabel(normalizePlaceholderLabel(token))
    };
}
function renderPlaceholders(container, tokens) {
    var wrapper = container.createDiv("slides-rup-design-maker-placeholder-stack");
    tokens.forEach(function (token) {
        var meta = getPlaceholderMeta(token);
        var chip = wrapper.createDiv("slides-rup-design-maker-placeholder-chip ".concat(meta.className));
        chip.createDiv({
            cls: "slides-rup-design-maker-placeholder-icon",
            text: meta.icon
        });
        chip.createDiv({
            cls: "slides-rup-design-maker-placeholder-label",
            text: meta.label
        });
    });
    return true;
}
function renderBlockContent(container, content, context) {
    var contentWithoutComments = stripHtmlComments(content);
    if (!contentWithoutComments) {
        return {
            rendered: false,
            hidden: false,
            textContent: ""
        };
    }
    var styleBlocks = extractStyleBlocks(contentWithoutComments);
    var normalizedContent = stripStyleBlocks(contentWithoutComments);
    if (styleBlocks.length > 0) {
        injectHiddenStyles(container, styleBlocks);
    }
    var svgMarkup = extractSvgMarkup(contentWithoutComments);
    if (svgMarkup) {
        return {
            rendered: renderSvg(container, svgMarkup),
            hidden: false,
            textContent: normalizedContent || ""
        };
    }
    if (!normalizedContent) {
        return {
            rendered: false,
            hidden: false,
            textContent: ""
        };
    }
    var imageUrl = extractImageUrl(normalizedContent);
    if (imageUrl) {
        return {
            rendered: renderImage(container, resolveObsidianImageUrl(imageUrl, context)),
            hidden: false,
            textContent: normalizedContent
        };
    }
    var tokens = extractPlaceholderTokens(normalizedContent);
    var embedTarget = extractObsidianEmbedTarget(normalizedContent);
    if (embedTarget && !looksLikeImageResource(embedTarget)) {
        tokens.push(embedTarget);
    }
    var remainingText = normalizedContent
        .replace(/<%[\s\S]*?%>|\{\{[\s\S]*?\}\}/g, "")
        .replace(/!\[\[[^|\]]+(?:\|[^\]]+)?\]\]/g, "")
        .trim();
    if (tokens.length > 0 && !remainingText) {
        return {
            rendered: renderPlaceholders(container, tokens),
            hidden: false,
            textContent: normalizedContent
        };
    }
    return {
        rendered: false,
        hidden: false,
        textContent: normalizedContent
    };
}
exports.renderBlockContent = renderBlockContent;
