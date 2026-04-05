const module = require("module");
const originalRequire = module.Module.prototype.require;
module.Module.prototype.require = function (...args) {
    if (args[0] === "obsidian") return {};
    return originalRequire.apply(this, args);
};
require("./test.js");
