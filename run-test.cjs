const mod = require("module");
const originalRequire = mod.Module.prototype.require;
mod.Module.prototype.require = function (...args) {
    if (args[0] === "obsidian") return {};
    return originalRequire.apply(this, args);
};
require("./test.cjs");
