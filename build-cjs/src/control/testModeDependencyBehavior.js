"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reset = exports.testModeDependencyBehavior = exports.permitUseOf = exports.validateDependencyReplacement = exports.replaceDependencyWith = void 0;
const VerifiableResult_js_1 = require("./VerifiableResult.js");
const util_js_1 = require("./util.js");
const dependencyReplacements = new Map();
function replaceDependencyWith(dependency, replacement) {
    if (dependencyReplacements.has(dependency)) {
        throw new Error('The provided dependency already has behavior assosiated with it for this test. ' +
            '(Maybe you forgot to call reset() in the after-each?)');
    }
    dependencyReplacements.set(dependency, { type: 'replace', with: replacement });
}
exports.replaceDependencyWith = replaceDependencyWith;
function validateDependencyReplacement(dependency, replacement) {
    if (dependencyReplacements.has(dependency)) {
        throw new Error('The provided dependency already has behavior assosiated with it for this test. ' +
            '(Maybe you forgot to call reset() in the after-each?)');
    }
    dependencyReplacements.set(dependency, { type: 'validate', with: replacement });
}
exports.validateDependencyReplacement = validateDependencyReplacement;
function permitUseOf(...dependencies) {
    for (const [i, dependency] of dependencies.entries()) {
        if (dependencyReplacements.has(dependency)) {
            throw new Error(`The provided dependency #${i + 1} already has behavior assosiated with it for this test. ' +
        '(Maybe you forgot to call reset() in the after-each?)`);
        }
        dependencyReplacements.set(dependency, { type: 'no-op' });
    }
}
exports.permitUseOf = permitUseOf;
exports.testModeDependencyBehavior = {
    define(self, fnName, realImplementation) {
        return (async (...args) => {
            const replacement = getDependencyReplacement(self, fnName);
            if (replacement.type === 'replace') {
                const testDoubleResult = await replacement.with[fnName](...args);
                return (testDoubleResult instanceof VerifiableResult_js_1.VerifiableResult ? (0, VerifiableResult_js_1.getValueOfVerifiableResult)(testDoubleResult) : testDoubleResult);
            }
            else if (replacement.type === 'validate') {
                const realResult = await realImplementation(...args);
                const testDoubleResult = await replacement.with[fnName](...args);
                if (testDoubleResult instanceof VerifiableResult_js_1.VerifiableResult) {
                    (0, VerifiableResult_js_1.verifyTheVerifiableResult)(testDoubleResult, realResult, fnName);
                }
                return realResult;
            }
            else if (replacement.type === 'no-op') {
                return realImplementation(...args);
            }
            else {
                throw new util_js_1.UnreachableCaseError(replacement.type);
            }
        });
    },
    defineSync(self, fnName, realImplementation) {
        return ((...args) => {
            const replacement = getDependencyReplacement(self, fnName);
            if (replacement.type === 'replace') {
                const testDoubleResult = replacement.with[fnName](...args);
                return (testDoubleResult instanceof VerifiableResult_js_1.VerifiableResult ? (0, VerifiableResult_js_1.getValueOfVerifiableResult)(testDoubleResult) : testDoubleResult);
            }
            else if (replacement.type === 'validate') {
                const realResult = realImplementation(...args);
                const testDoubleResult = replacement.with[fnName](...args);
                if (testDoubleResult instanceof VerifiableResult_js_1.VerifiableResult) {
                    (0, VerifiableResult_js_1.verifyTheVerifiableResult)(testDoubleResult, realResult, fnName);
                }
                return realResult;
            }
            else if (replacement.type === 'no-op') {
                return realImplementation(...args);
            }
            else {
                throw new util_js_1.UnreachableCaseError(replacement.type);
            }
        });
    },
};
function getDependencyReplacement(dependency, fnName) {
    const replacement = dependencyReplacements.get(dependency);
    if (replacement === undefined) {
        throw new Error(`No behavior was assosiated with the dependency, for function ${fnName}()`);
    }
    return replacement;
}
/** This function should get called in your global after-each. */
function reset() {
    dependencyReplacements.clear();
}
exports.reset = reset;
