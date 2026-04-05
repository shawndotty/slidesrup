"use strict";
exports.__esModule = true;
exports.ClassTransformer = void 0;
var ClassTransformer = /** @class */ (function () {
    function ClassTransformer() {
    }
    ClassTransformer.prototype.transform = function (element) {
        var clazz = element.getAttribute('class');
        if (clazz != undefined) {
            clazz
                .split(' ')
                .map(function (value) { return value.trim(); })
                .forEach(function (value) {
                element.addClass(value);
            });
            element.deleteAttribute('class');
        }
    };
    return ClassTransformer;
}());
exports.ClassTransformer = ClassTransformer;
