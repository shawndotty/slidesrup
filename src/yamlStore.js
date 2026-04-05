"use strict";
exports.__esModule = true;
exports.YamlStore = void 0;
var YamlStore = /** @class */ (function () {
    function YamlStore() {
    }
    YamlStore.getInstance = function () {
        if (!YamlStore.instance) {
            YamlStore.instance = new YamlStore();
        }
        return YamlStore.instance;
    };
    return YamlStore;
}());
exports.YamlStore = YamlStore;
