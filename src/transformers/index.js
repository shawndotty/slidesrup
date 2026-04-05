"use strict";
exports.__esModule = true;
exports.Properties = void 0;
var backgroundImageTransformer_1 = require("./backgroundImageTransformer");
var backgroundTransformer_1 = require("./backgroundTransformer");
var borderTransformer_1 = require("./borderTransformer");
var classMappingTransformer_1 = require("./classMappingTransformer");
var classTransformer_1 = require("./classTransformer");
var fragmentTransformer_1 = require("./fragmentTransformer");
var gridTransformer_1 = require("./gridTransformer");
var paddingTransformer_1 = require("./paddingTransformer");
var rotateTransformer_1 = require("./rotateTransformer");
var styleMappingTransformer_1 = require("./styleMappingTransformer");
var styleTransformer_1 = require("./styleTransformer");
var Properties = /** @class */ (function () {
    function Properties(attributes) {
        this.style = new Map();
        this["class"] = new Set();
        this.attributes = attributes;
        this.transformer = new AttributeTransformers();
        this.transformer.transform(this);
    }
    Properties.prototype.addClass = function (name) {
        this["class"].add(name);
        return this;
    };
    Properties.prototype.deleteClass = function (name) {
        this["class"]["delete"](name);
        return this;
    };
    Properties.prototype.hasClass = function (name) {
        return this["class"].has(name);
    };
    Properties.prototype.addStyle = function (key, value) {
        this.style.set(key, value);
        return this;
    };
    Properties.prototype.deleteStyle = function (key) {
        this.style["delete"](key);
        return this;
    };
    Properties.prototype.hasStyle = function (name) {
        return this.style.has(name);
    };
    Properties.prototype.addAttribute = function (key, value, update) {
        if (update === void 0) { update = true; }
        this.attributes.set(key, value);
        if (update) {
            this.transformer.transform(this);
        }
        return this;
    };
    Properties.prototype.deleteAttribute = function (key) {
        this.attributes["delete"](key);
        return this;
    };
    Properties.prototype.hasAttribute = function (name) {
        return this.attributes.has(name);
    };
    Properties.prototype.getAttribute = function (name) {
        return this.attributes.get(name) || "";
    };
    Properties.prototype.getClasses = function () {
        return Array.from(this["class"]).join(" ");
    };
    Properties.prototype.getStyles = function () {
        var result = Array();
        for (var _i = 0, _a = this.style; _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            result.push("".concat(key, ": ").concat(value));
        }
        return result.join("; ");
    };
    Properties.prototype.getAttributes = function () {
        var result = Array();
        for (var _i = 0, _a = this.attributes; _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (key == "onTarget") {
                continue;
            }
            result.push("".concat(key, "=\"").concat(value, "\""));
        }
        return result.join(" ");
    };
    return Properties;
}());
exports.Properties = Properties;
var AttributeTransformers = /** @class */ (function () {
    function AttributeTransformers() {
        this.allTransformers = new Array();
        this.allTransformers.push(new classTransformer_1.ClassTransformer());
        this.allTransformers.push(new styleTransformer_1.StyleTransformer());
        this.allTransformers.push(new backgroundTransformer_1.BackgroundTransformer());
        this.allTransformers.push(new paddingTransformer_1.PaddingTransformer());
        this.allTransformers.push(new classMappingTransformer_1.ClassMappingTransformer("animate"));
        this.allTransformers.push(new fragmentTransformer_1.FragmentTransformer());
        this.allTransformers.push(new styleMappingTransformer_1.StyleMappingTransformer("opacity", "opacity"));
        this.allTransformers.push(new borderTransformer_1.BorderTransformer());
        this.allTransformers.push(new styleMappingTransformer_1.StyleMappingTransformer("filter", "filter"));
        this.allTransformers.push(new rotateTransformer_1.RotateTransformer());
        this.allTransformers.push(new gridTransformer_1.GridTransformer());
        this.allTransformers.push(new backgroundImageTransformer_1.BackgroundImageTransformer());
    }
    AttributeTransformers.prototype.transform = function (element) {
        for (var x = 0; x < this.allTransformers.length; x++) {
            var transformer = this.allTransformers[x];
            transformer.transform(element);
        }
    };
    return AttributeTransformers;
}());
