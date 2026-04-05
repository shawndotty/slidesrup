"use strict";
exports.__esModule = true;
exports.StyleMappingTransformer = void 0;
var StyleMappingTransformer = /** @class */ (function () {
    function StyleMappingTransformer(from, to) {
        this.from = from;
        this.to = to;
    }
    StyleMappingTransformer.prototype.transform = function (element) {
        var value = element.getAttribute(this.from);
        if (value != undefined) {
            element.addStyle(this.to, value);
            element.deleteAttribute(this.from);
        }
    };
    return StyleMappingTransformer;
}());
exports.StyleMappingTransformer = StyleMappingTransformer;
