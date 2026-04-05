"use strict";
exports.__esModule = true;
exports.StyleTransformer = void 0;
var StyleTransformer = /** @class */ (function () {
    function StyleTransformer() {
    }
    StyleTransformer.prototype.transform = function (element) {
        var style = element.getAttribute('style');
        if (style != undefined) {
            style
                .split(';')
                .map(function (value) { return value.trim(); })
                .filter(function (value) { return value.length > 0; })
                .forEach(function (item) {
                if (item && item.includes(':')) {
                    var _a = item.split(':'), key = _a[0], value = _a[1];
                    if (key && key.length > 0 && value) {
                        element.addStyle(key.trim(), value.trim());
                    }
                }
            });
            element.deleteAttribute('style');
        }
    };
    return StyleTransformer;
}());
exports.StyleTransformer = StyleTransformer;
