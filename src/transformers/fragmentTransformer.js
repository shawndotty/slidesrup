"use strict";
exports.__esModule = true;
exports.FragmentTransformer = void 0;
var FragmentTransformer = /** @class */ (function () {
    function FragmentTransformer() {
    }
    FragmentTransformer.prototype.transform = function (element) {
        var value = element.getAttribute('frag');
        if (value != undefined) {
            element.addClass('fragment');
            element.deleteAttribute('frag');
            element.addAttribute('data-fragment-index', value);
        }
    };
    return FragmentTransformer;
}());
exports.FragmentTransformer = FragmentTransformer;
