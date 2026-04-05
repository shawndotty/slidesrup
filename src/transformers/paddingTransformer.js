"use strict";
exports.__esModule = true;
exports.PaddingTransformer = void 0;
var PaddingTransformer = /** @class */ (function () {
    function PaddingTransformer() {
    }
    PaddingTransformer.prototype.transform = function (element) {
        var value = element.getAttribute('pad');
        if (value != undefined) {
            element.addStyle('padding', value);
            element.addStyle('box-sizing', 'border-box');
            element.deleteAttribute('pad');
        }
    };
    return PaddingTransformer;
}());
exports.PaddingTransformer = PaddingTransformer;
