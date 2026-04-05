"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.BackgroundTransformer = void 0;
var color_1 = __importDefault(require("color"));
var BackgroundTransformer = /** @class */ (function () {
    function BackgroundTransformer() {
    }
    BackgroundTransformer.prototype.transform = function (element) {
        var bg = element.getAttribute("bg");
        var target = element.getAttribute("onTarget");
        if (bg != undefined) {
            var color = this.readColor(bg);
            if (color) {
                if (color.isLight()) {
                    element.addClass("has-light-background");
                    element.deleteClass("has-dark-background");
                }
                else {
                    element.addClass("has-dark-background");
                    element.deleteClass("has-light-background");
                }
                element.deleteAttribute("bg");
                if (target && target == "slide") {
                    element.deleteAttribute("data-background-image");
                    element.deleteAttribute("data-background-color");
                    element.addAttribute("data-background-color", bg);
                }
                else {
                    element.addStyle("background-color", bg);
                }
            }
            else {
                element.deleteAttribute("bg");
                if (target && target == "slide") {
                    element.deleteAttribute("data-background-color");
                    element.deleteAttribute("data-background-image");
                    element.addAttribute("data-background-image", bg);
                }
            }
        }
    };
    BackgroundTransformer.prototype.readColor = function (bg) {
        try {
            return (0, color_1["default"])(bg);
        }
        catch (_) {
            return null;
        }
    };
    return BackgroundTransformer;
}());
exports.BackgroundTransformer = BackgroundTransformer;
