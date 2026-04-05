"use strict";
exports.__esModule = true;
exports.BackgroundImageTransformer = void 0;
var imageCollector_1 = require("src/imageCollector");
var BackgroundImageTransformer = /** @class */ (function () {
    function BackgroundImageTransformer() {
    }
    BackgroundImageTransformer.prototype.transform = function (element) {
        var value = element.getAttribute("data-background-image");
        if (value != undefined) {
            if (imageCollector_1.ImageCollector.getInstance().shouldCollect()) {
                imageCollector_1.ImageCollector.getInstance().addImage(value);
            }
        }
    };
    return BackgroundImageTransformer;
}());
exports.BackgroundImageTransformer = BackgroundImageTransformer;
