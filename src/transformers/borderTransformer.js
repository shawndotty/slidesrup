"use strict";
exports.__esModule = true;
exports.BorderTransformer = void 0;
var BorderTransformer = /** @class */ (function () {
    function BorderTransformer() {
    }
    BorderTransformer.prototype.transform = function (element) {
        var value = element.getAttribute('border');
        if (value != undefined) {
            element.addStyle('border', value);
            element.addStyle('box-sizing', 'border-box');
            element.deleteAttribute('border');
        }
    };
    return BorderTransformer;
}());
exports.BorderTransformer = BorderTransformer;
