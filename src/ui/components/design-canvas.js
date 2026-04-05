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
exports.renderDesignCanvas = exports.renderDesignToolbar = exports.applyGridFlexStyles = exports.applyBlockRectStyles = exports.computePanForZoom = exports.computeCanvasTransform = exports.computeBaselineScale = exports.clampCanvasZoomPercent = void 0;
var helpers_1 = require("src/lang/helpers");
var design_block_renderer_1 = require("./design-block-renderer");
var DESIGN_MAKER_SLIDE_WIDTH = 1920;
var DESIGN_MAKER_SLIDE_HEIGHT = 1080;
function clampCanvasZoomPercent(value) {
    if (!Number.isFinite(value))
        return 100;
    return Math.max(25, Math.min(400, Math.round(value)));
}
exports.clampCanvasZoomPercent = clampCanvasZoomPercent;
function computeBaselineScale(options) {
    var frameWidth = options.frameWidth, frameHeight = options.frameHeight, baseWidth = options.baseWidth, baseHeight = options.baseHeight;
    if (!frameWidth || !frameHeight || !baseWidth || !baseHeight)
        return 1;
    return Math.min(frameWidth / baseWidth, frameHeight / baseHeight);
}
exports.computeBaselineScale = computeBaselineScale;
function computeCanvasTransform(options) {
    var zoomPercent = clampCanvasZoomPercent(options.zoomPercent);
    var zoomScale = zoomPercent / 100;
    var baselineScale = computeBaselineScale(options);
    var scale = baselineScale * zoomScale;
    var panX = Number.isFinite(options.panX) ? options.panX : 0;
    var panY = Number.isFinite(options.panY) ? options.panY : 0;
    return {
        scale: scale,
        transform: "translate(".concat(panX, "px, ").concat(panY, "px) scale(").concat(scale, ")")
    };
}
exports.computeCanvasTransform = computeCanvasTransform;
function computePanForZoom(options) {
    var cursorX = options.cursorX, cursorY = options.cursorY, panX = options.panX, panY = options.panY, currentScale = options.currentScale, nextScale = options.nextScale;
    if (!Number.isFinite(currentScale) || currentScale <= 0) {
        return { panX: panX, panY: panY };
    }
    var ratio = nextScale / currentScale;
    var nextPanX = cursorX - ratio * (cursorX - panX);
    var nextPanY = cursorY - ratio * (cursorY - panY);
    return {
        panX: Number.isFinite(nextPanX) ? nextPanX : panX,
        panY: Number.isFinite(nextPanY) ? nextPanY : panY
    };
}
exports.computePanForZoom = computePanForZoom;
function applyBlockRectStyles(el, block, rectUnit) {
    if (rectUnit === void 0) { rectUnit = "percent"; }
    if (rectUnit === "px") {
        if (block.rect.x < 0) {
            el.style.right = "".concat(Math.abs(block.rect.x), "px");
            el.style.left = "";
        }
        else {
            el.style.left = "".concat(block.rect.x, "px");
            el.style.right = "";
        }
        if (block.rect.y < 0) {
            el.style.bottom = "".concat(Math.abs(block.rect.y), "px");
            el.style.top = "";
        }
        else {
            el.style.top = "".concat(block.rect.y, "px");
            el.style.bottom = "";
        }
        el.style.width = "".concat(block.rect.width, "px");
        el.style.height = "".concat(block.rect.height, "px");
        return;
    }
    if (block.rect.x < 0) {
        el.style.right = "".concat(Math.abs(block.rect.x), "%");
        el.style.left = "";
    }
    else {
        el.style.left = "".concat(block.rect.x, "%");
        el.style.right = "";
    }
    if (block.rect.y < 0) {
        el.style.bottom = "".concat(Math.abs(block.rect.y), "%");
        el.style.top = "";
    }
    else {
        el.style.top = "".concat(block.rect.y, "%");
        el.style.bottom = "";
    }
    el.style.width = "".concat(block.rect.width, "%");
    el.style.height = "".concat(block.rect.height, "%");
}
exports.applyBlockRectStyles = applyBlockRectStyles;
function applyGridFlexStyles(el, block) {
    el.style.display = "flex";
    var flow = block.flow.trim().toLowerCase();
    var isRow = flow === "row";
    el.style.flexDirection = isRow ? "row" : "column";
    if (block.pad && block.pad.trim()) {
        el.style.padding = block.pad.trim();
    }
    var explicitJustify = false;
    if (block.justifyContent && block.justifyContent.trim()) {
        el.style.justifyContent = block.justifyContent.trim();
        explicitJustify = true;
    }
    else {
        el.style.justifyContent = "center";
    }
    el.style.alignItems = "center";
    if (block.align && block.align.trim()) {
        var align = block.align.trim().toLowerCase();
        if (align.includes("left")) {
            el.style.alignItems = isRow ? "center" : "flex-start";
            el.style.textAlign = "left";
            if (isRow && !explicitJustify)
                el.style.justifyContent = "flex-start";
        }
        else if (align.includes("right")) {
            el.style.alignItems = isRow ? "center" : "flex-end";
            el.style.textAlign = "right";
            if (isRow && !explicitJustify)
                el.style.justifyContent = "flex-end";
        }
        else if (align === "center") {
            el.style.alignItems = "center";
            el.style.textAlign = "center";
        }
        else if (align === "stretch") {
            el.style.alignItems = "stretch";
        }
        else if (align === "justify") {
            el.style.textAlign = "justify";
        }
        if (!explicitJustify) {
            if (align.includes("top")) {
                if (isRow)
                    el.style.alignItems = "flex-start";
                else
                    el.style.justifyContent = "flex-start";
            }
            else if (align.includes("bottom")) {
                if (isRow)
                    el.style.alignItems = "flex-end";
                else
                    el.style.justifyContent = "flex-end";
            }
        }
    }
}
exports.applyGridFlexStyles = applyGridFlexStyles;
function toInt(value) {
    return Math.round(value);
}
function applySlideBaselineScale(slideEl, frameEl, baseWidth, baseHeight) {
    var frameRect = frameEl.getBoundingClientRect();
    if (!frameRect.width || !frameRect.height)
        return;
    var scale = computeBaselineScale({
        frameWidth: frameRect.width,
        frameHeight: frameRect.height,
        baseWidth: baseWidth,
        baseHeight: baseHeight
    });
    slideEl.style.transform = "scale(".concat(scale, ")");
    slideEl.style.transformOrigin = "top left";
}
function renderDesignToolbar(options) {
    var container = options.container, selectedBlockId = options.selectedBlockId, hasFootnotesBlock = options.hasFootnotesBlock, hasSideBarBlock = options.hasSideBarBlock, _a = options.rectUnit, rectUnit = _a === void 0 ? "percent" : _a, _b = options.slideBaseWidth, slideBaseWidth = _b === void 0 ? DESIGN_MAKER_SLIDE_WIDTH : _b, _c = options.slideBaseHeight, slideBaseHeight = _c === void 0 ? DESIGN_MAKER_SLIDE_HEIGHT : _c, onAddBlock = options.onAddBlock, onAddFootnotes = options.onAddFootnotes, onAddSideBar = options.onAddSideBar, onDeleteBlock = options.onDeleteBlock, onDuplicateBlock = options.onDuplicateBlock;
    container.empty();
    var toolbar = container.createDiv("slides-rup-design-maker-toolbar");
    [
        ["grid", "Add Grid"],
        ["text", "Add Text"],
        ["image", "Add Image"],
        ["placeholder", "Add Placeholder"],
        ["content", "Add Content Slot"],
    ].forEach(function (_a) {
        var kind = _a[0], label = _a[1];
        var button = toolbar.createEl("button", { text: (0, helpers_1.t)(label) });
        button.draggable = true;
        button.addEventListener("dragstart", function (e) {
            if (e.dataTransfer) {
                e.dataTransfer.setData("application/json", JSON.stringify({ action: "add", kind: kind }));
            }
        });
        button.addEventListener("click", function () {
            return onAddBlock(createTemplateBlock(kind, rectUnit, slideBaseWidth, slideBaseHeight));
        });
    });
    var footnotesButton = toolbar.createEl("button", {
        text: (0, helpers_1.t)("Add Footnotes")
    });
    footnotesButton.disabled = hasFootnotesBlock;
    footnotesButton.addEventListener("click", function () { return onAddFootnotes(); });
    var sideBarButton = toolbar.createEl("button", {
        text: (0, helpers_1.t)("Add SR-SideBar")
    });
    sideBarButton.disabled = hasSideBarBlock;
    sideBarButton.addEventListener("click", function () { return onAddSideBar(); });
    if (selectedBlockId) {
        var duplicateButton = toolbar.createEl("button", {
            text: (0, helpers_1.t)("Duplicate Block")
        });
        duplicateButton.addEventListener("click", function () {
            return onDuplicateBlock(selectedBlockId);
        });
        var deleteButton = toolbar.createEl("button", {
            text: (0, helpers_1.t)("Delete Block")
        });
        deleteButton.addEventListener("click", function () {
            return onDeleteBlock(selectedBlockId);
        });
    }
}
exports.renderDesignToolbar = renderDesignToolbar;
function createTemplateBlock(kind, rectUnit, slideBaseWidth, slideBaseHeight) {
    var contentMap = {
        grid: "",
        text: "Editable text",
        image: "![](https://placehold.co/800x450)",
        placeholder: "{{LOGO_OR_TAGLINE}}",
        content: "<% content %>"
    };
    var percentRect = { x: 10, y: 10, width: 40, height: 24 };
    var rect = rectUnit === "px"
        ? {
            x: Math.round((slideBaseWidth * percentRect.x) / 100),
            y: Math.round((slideBaseHeight * percentRect.y) / 100),
            width: Math.round((slideBaseWidth * percentRect.width) / 100),
            height: Math.round((slideBaseHeight * percentRect.height) / 100)
        }
        : percentRect;
    return {
        id: "grid-".concat(Date.now(), "-").concat(Math.random().toString(16).slice(2, 8)),
        type: "grid",
        role: kind,
        rect: rect,
        content: contentMap[kind],
        className: kind === "text" ? "bg-with-front-color" : "",
        style: "",
        pad: "24px",
        align: "left",
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
function renderDesignCanvas(options) {
    var _a;
    var app = options.app, container = options.container, page = options.page, _b = options.themeRawCss, themeRawCss = _b === void 0 ? "" : _b, _c = options.presentationCss, presentationCss = _c === void 0 ? "" : _c, _d = options.slideBaseWidth, slideBaseWidth = _d === void 0 ? DESIGN_MAKER_SLIDE_WIDTH : _d, _e = options.slideBaseHeight, slideBaseHeight = _e === void 0 ? DESIGN_MAKER_SLIDE_HEIGHT : _e, _f = options.canvasZoomPercent, canvasZoomPercent = _f === void 0 ? 100 : _f, _g = options.canvasPanX, canvasPanX = _g === void 0 ? 0 : _g, _h = options.canvasPanY, canvasPanY = _h === void 0 ? 0 : _h, _j = options.isPanKeyDown, isPanKeyDown = _j === void 0 ? function () { return false; } : _j, onPanChange = options.onPanChange, onZoomChange = options.onZoomChange, selectedBlockId = options.selectedBlockId, onSelect = options.onSelect, onPatchBlock = options.onPatchBlock, onAddBlock = options.onAddBlock, onDeleteBlock = options.onDeleteBlock, onDuplicateBlock = options.onDuplicateBlock;
    var rectUnit = (_a = page.rectUnit) !== null && _a !== void 0 ? _a : "percent";
    var zoomPercent = canvasZoomPercent;
    var panX = canvasPanX;
    var panY = canvasPanY;
    container.empty();
    var frame = container.createDiv("slides-rup-design-maker-canvas-frame");
    frame.style.aspectRatio = "".concat(slideBaseWidth, " / ").concat(slideBaseHeight);
    var canvas = frame.createDiv("slides-rup-design-maker-canvas");
    canvas.style.width = "".concat(slideBaseWidth, "px");
    canvas.style.height = "".concat(slideBaseHeight, "px");
    if (presentationCss.trim()) {
        var styleEl = canvas.createEl("style");
        styleEl.textContent = presentationCss;
    }
    if (themeRawCss.trim()) {
        var styleEl = canvas.createEl("style");
        styleEl.textContent = themeRawCss;
    }
    canvas.addEventListener("click", function () { return onSelect(null); });
    var applyCanvasTransform = function () {
        var rect = frame.getBoundingClientRect();
        var transform = computeCanvasTransform({
            frameWidth: rect.width,
            frameHeight: rect.height,
            baseWidth: slideBaseWidth,
            baseHeight: slideBaseHeight,
            zoomPercent: zoomPercent,
            panX: panX,
            panY: panY
        }).transform;
        canvas.style.transform = transform;
        canvas.style.transformOrigin = "top left";
    };
    applyCanvasTransform();
    frame.addEventListener("wheel", function (e) {
        if (!onZoomChange)
            return;
        if (!e.ctrlKey && !e.metaKey)
            return;
        e.preventDefault();
        var rect = frame.getBoundingClientRect();
        var cursorX = e.clientX - rect.left;
        var cursorY = e.clientY - rect.top;
        var current = computeCanvasTransform({
            frameWidth: rect.width,
            frameHeight: rect.height,
            baseWidth: slideBaseWidth,
            baseHeight: slideBaseHeight,
            zoomPercent: zoomPercent,
            panX: panX,
            panY: panY
        });
        var step = e.deltaY < 0 ? 10 : -10;
        var nextZoomPercent = clampCanvasZoomPercent(zoomPercent + step);
        var nextScale = computeCanvasTransform({
            frameWidth: rect.width,
            frameHeight: rect.height,
            baseWidth: slideBaseWidth,
            baseHeight: slideBaseHeight,
            zoomPercent: nextZoomPercent,
            panX: panX,
            panY: panY
        }).scale;
        var nextPan = computePanForZoom({
            cursorX: cursorX,
            cursorY: cursorY,
            panX: panX,
            panY: panY,
            currentScale: current.scale,
            nextScale: nextScale
        });
        zoomPercent = nextZoomPercent;
        panX = nextPan.panX;
        panY = nextPan.panY;
        applyCanvasTransform();
        onZoomChange(nextZoomPercent, panX, panY);
    }, { passive: false });
    var isPanning = false;
    var panStartX = 0;
    var panStartY = 0;
    var panStartOffsetX = 0;
    var panStartOffsetY = 0;
    frame.addEventListener("mousedown", function (e) {
        if (!onPanChange)
            return;
        if (e.button !== 0)
            return;
        if (!isPanKeyDown())
            return;
        e.preventDefault();
        e.stopPropagation();
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartOffsetX = panX;
        panStartOffsetY = panY;
        frame.addClass("is-panning");
        var onMove = function (moveEvent) {
            if (!isPanning)
                return;
            var dx = moveEvent.clientX - panStartX;
            var dy = moveEvent.clientY - panStartY;
            panX = panStartOffsetX + dx;
            panY = panStartOffsetY + dy;
            applyCanvasTransform();
            onPanChange(panX, panY);
        };
        var onUp = function () {
            isPanning = false;
            frame.removeClass("is-panning");
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, true);
    canvas.addEventListener("dragover", function (e) {
        e.preventDefault();
    });
    var getCanvasScale = function () {
        var canvasBounds = canvas.getBoundingClientRect();
        if (!canvasBounds.width || !slideBaseWidth)
            return 1;
        var scale = canvasBounds.width / slideBaseWidth;
        return Number.isFinite(scale) && scale > 0 ? scale : 1;
    };
    canvas.addEventListener("drop", function (e) {
        e.preventDefault();
        if (!e.dataTransfer)
            return;
        try {
            var data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data.action === "add" && data.kind) {
                var block = createTemplateBlock(data.kind, rectUnit, slideBaseWidth, slideBaseHeight);
                var canvasBounds = canvas.getBoundingClientRect();
                if (rectUnit === "px") {
                    var x = ((e.clientX - canvasBounds.left) / canvasBounds.width) *
                        slideBaseWidth;
                    var y = ((e.clientY - canvasBounds.top) / canvasBounds.height) *
                        slideBaseHeight;
                    block.rect.x = Math.round(x);
                    block.rect.y = Math.round(y);
                }
                else {
                    var x = ((e.clientX - canvasBounds.left) / canvasBounds.width) *
                        100;
                    var y = ((e.clientY - canvasBounds.top) / canvasBounds.height) *
                        100;
                    block.rect.x = Math.round(x);
                    block.rect.y = Math.round(y);
                }
                options.onAddBlock(block);
            }
        }
        catch (ex) {
            // ignore
        }
    });
    var renderBlock = function (parentEl, block) {
        var _a;
        if (block.hiddenInDesign) {
            return;
        }
        if (block.type === "raw") {
            var raw = parentEl.createDiv("slides-rup-design-maker-raw-block");
            var result_1 = (0, design_block_renderer_1.renderBlockContent)(raw, block.raw, {
                app: app,
                sourcePath: page.filePath
            });
            if (result_1.hidden) {
                raw.remove();
                return;
            }
            if (!result_1.rendered) {
                raw.setText(result_1.textContent);
            }
            return;
        }
        var el = parentEl.createDiv("slides-rup-design-maker-block");
        el.setAttr("data-block-id", block.id);
        if (block.id === selectedBlockId) {
            el.addClass("is-selected");
        }
        var blockRectUnit = block.extraAttributes.rectUnit === "px" ? "px" : rectUnit;
        applyBlockRectStyles(el, block, blockRectUnit);
        if (block.className && block.className.trim()) {
            el.addClass.apply(el, block.className.trim().split(/\s+/));
        }
        if (block.bg && block.bg.trim())
            el.style.backgroundColor = block.bg;
        if (block.border && block.border.trim())
            el.style.border = block.border;
        if (block.opacity && block.opacity.trim())
            el.style.opacity = block.opacity;
        if (block.rotate && block.rotate.trim())
            el.style.transform = "rotate(".concat(block.rotate, "deg)");
        if (block.filter && block.filter.trim())
            el.style.filter = block.filter;
        applyGridFlexStyles(el, block);
        if (block.style && block.style.trim())
            el.style.cssText += ";".concat(block.style);
        var result = (0, design_block_renderer_1.renderBlockContent)(el, block.content || "", {
            app: app,
            sourcePath: page.filePath
        });
        if (result.hidden) {
            el.remove();
            return;
        }
        if (!result.rendered && !((_a = block.content) === null || _a === void 0 ? void 0 : _a.trim())) {
            // Don't override if there's no text but we have children
            if (!block.children || block.children.length === 0) {
                el.setText((0, helpers_1.t)("Empty Block"));
            }
        }
        if (block.children) {
            block.children.forEach(function (child) { return renderBlock(el, child); });
        }
        var resizeHandle = el.createDiv("slides-rup-design-maker-resize");
        el.addEventListener("click", function (event) {
            event.stopPropagation();
            onSelect(block.id);
        });
        el.addEventListener("mousedown", function (event) {
            if (event.target.classList.contains("slides-rup-design-maker-resize")) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            onSelect(block.id);
            var bounds = parentEl.getBoundingClientRect();
            var canvasScale = blockRectUnit === "px" ? getCanvasScale() : 1;
            var parentBaseWidth = blockRectUnit === "px" ? bounds.width / canvasScale : 100;
            var parentBaseHeight = blockRectUnit === "px" ? bounds.height / canvasScale : 100;
            var startX = event.clientX;
            var startY = event.clientY;
            var startRect = __assign({}, block.rect);
            var onMove = function (moveEvent) {
                var deltaX = ((moveEvent.clientX - startX) / bounds.width) *
                    parentBaseWidth;
                var deltaY = ((moveEvent.clientY - startY) / bounds.height) *
                    parentBaseHeight;
                onPatchBlock(block.id, function (nextBlock) {
                    nextBlock.rect.x = toInt(startRect.x + deltaX);
                    nextBlock.rect.y = toInt(startRect.y + deltaY);
                });
            };
            var onUp = function (upEvent) {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
        resizeHandle.addEventListener("mousedown", function (event) {
            event.preventDefault();
            event.stopPropagation();
            onSelect(block.id);
            var bounds = parentEl.getBoundingClientRect();
            var canvasScale = blockRectUnit === "px" ? getCanvasScale() : 1;
            var parentBaseWidth = blockRectUnit === "px" ? bounds.width / canvasScale : 100;
            var parentBaseHeight = blockRectUnit === "px" ? bounds.height / canvasScale : 100;
            var startX = event.clientX;
            var startY = event.clientY;
            var startRect = __assign({}, block.rect);
            var onMove = function (moveEvent) {
                var deltaX = ((moveEvent.clientX - startX) / bounds.width) *
                    parentBaseWidth;
                var deltaY = ((moveEvent.clientY - startY) / bounds.height) *
                    parentBaseHeight;
                onPatchBlock(block.id, function (nextBlock) {
                    var minSize = blockRectUnit === "px" ? 20 : 5;
                    nextBlock.rect.width = toInt(Math.max(minSize, startRect.width + deltaX));
                    nextBlock.rect.height = toInt(Math.max(minSize, startRect.height + deltaY));
                });
            };
            var onUp = function () {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    };
    page.blocks.forEach(function (block) { return renderBlock(canvas, block); });
    applyCanvasTransform();
}
exports.renderDesignCanvas = renderDesignCanvas;
