export declare function assert(condition: boolean, message?: string): asserts condition;
export declare class UnreachableCaseError extends Error {
    constructor(val: never);
}
