export type ResultVerifier = (fake: unknown, real: unknown) => void;
declare const constructorSentinel: unique symbol;
export declare let getValueOfVerifiableResult: <T>(self: VerifiableResult<T>) => T;
export declare let verifyTheVerifiableResult: <T>(self: VerifiableResult<T>, realResult: T, fnName: string) => void;
export declare class VerifiableResult<T> {
    #private;
    verifier: ResultVerifier;
    constructor(key: typeof constructorSentinel, result: T, verifier: ResultVerifier);
}
export declare function verifyResult<T>(value: T): {
    readonly with: (fn: ResultVerifier) => VerifiableResult<T>;
};
export {};
