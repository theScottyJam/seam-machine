"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResult = exports.VerifiableResult = exports.verifyTheVerifiableResult = exports.getValueOfVerifiableResult = void 0;
const util_js_1 = require("./util.js");
const constructorSentinel = Symbol('constructor sentinal');
class VerifiableResult {
    #result;
    verifier;
    constructor(key, result, verifier) {
        (0, util_js_1.assert)(key === constructorSentinel, `This FakeResult constructor is private`);
        this.#result = result;
        this.verifier = verifier;
    }
    static {
        exports.getValueOfVerifiableResult = (self) => {
            return self.#result;
        };
        exports.verifyTheVerifiableResult = (self, realResult, fnName) => {
            try {
                self.verifier(self.#result, realResult);
            }
            catch (error) {
                throw new Error(`Invalid fake implementation for ${fnName}() - ` +
                    `it did not line up with the real implementation's result: ${error.message}`);
            }
        };
    }
}
exports.VerifiableResult = VerifiableResult;
function verifyResult(value) {
    return {
        with(resultVerifier) {
            return new VerifiableResult(constructorSentinel, value, resultVerifier);
        }
    };
}
exports.verifyResult = verifyResult;
