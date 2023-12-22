"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTestMode = exports.reset = exports.permitUseOf = exports.validateDependencyReplacement = exports.replaceDependencyWith = exports.verifyResult = exports.VerifiableResult = void 0;
const index_js_1 = require("#src/seams/index.js");
const testModeDependencyBehavior_js_1 = require("./testModeDependencyBehavior.js");
var VerifiableResult_js_1 = require("./VerifiableResult.js");
Object.defineProperty(exports, "VerifiableResult", { enumerable: true, get: function () { return VerifiableResult_js_1.VerifiableResult; } });
Object.defineProperty(exports, "verifyResult", { enumerable: true, get: function () { return VerifiableResult_js_1.verifyResult; } });
var testModeDependencyBehavior_js_2 = require("./testModeDependencyBehavior.js");
Object.defineProperty(exports, "replaceDependencyWith", { enumerable: true, get: function () { return testModeDependencyBehavior_js_2.replaceDependencyWith; } });
Object.defineProperty(exports, "validateDependencyReplacement", { enumerable: true, get: function () { return testModeDependencyBehavior_js_2.validateDependencyReplacement; } });
Object.defineProperty(exports, "permitUseOf", { enumerable: true, get: function () { return testModeDependencyBehavior_js_2.permitUseOf; } });
Object.defineProperty(exports, "reset", { enumerable: true, get: function () { return testModeDependencyBehavior_js_2.reset; } });
let inTestMode = false;
function setTestMode() {
    if (inTestMode) {
        throw new Error('You can only call setTestMode() once.');
    }
    inTestMode = true;
    try {
        (0, index_js_1.setDependencyBehavior)(testModeDependencyBehavior_js_1.testModeDependencyBehavior);
    }
    catch (error) {
        if (error instanceof index_js_1.DependencyBehaviorAlreadyInUseError) {
            throw new Error('You must call setTestMode() before you start creating Dependency instances.');
        }
        else {
            throw error;
        }
    }
}
exports.setTestMode = setTestMode;
setTestMode(); // <--
