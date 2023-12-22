"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreachableCaseError = exports.assert = void 0;
function assert(condition, message = 'Assertion Failed') {
    if (!condition) {
        throw new Error('Internal Error: ' + message);
    }
}
exports.assert = assert;
class UnreachableCaseError extends Error {
    constructor(val) {
        super(`No code branch was prepared to handle the unexpected value: ${String(val)}`);
    }
}
exports.UnreachableCaseError = UnreachableCaseError;
