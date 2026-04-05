"use strict";
exports.__esModule = true;
exports.ClassMappingTransformer = void 0;
var ClassMappingTransformer = /** @class */ (function () {
    function ClassMappingTransformer(from) {
        this.from = from;
    }
    ClassMappingTransformer.prototype.transform = function (element) {
        var value = element.getAttribute(this.from);
        if (value != undefined) {
            value.split(' ').forEach(function (item) {
                if (item.trim().length > 0) {
                    element.addClass(item.trim());
                }
            });
            element.deleteAttribute(this.from);
        }
    };
    return ClassMappingTransformer;
}());
exports.ClassMappingTransformer = ClassMappingTransformer;
