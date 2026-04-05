"use strict";
exports.__esModule = true;
exports.RotateTransformer = void 0;
var RotateTransformer = /** @class */ (function () {
    function RotateTransformer() {
    }
    RotateTransformer.prototype.transform = function (element) {
        var value = element.getAttribute('rotate');
        if (value != undefined) {
            var rotate = value.endsWith('deg') ? value : value + 'deg';
            element.addStyle('transform', "rotate(".concat(rotate, ")"));
            element.deleteAttribute('rotate');
        }
    };
    return RotateTransformer;
}());
exports.RotateTransformer = RotateTransformer;
