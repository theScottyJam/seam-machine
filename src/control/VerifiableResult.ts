import { assert } from './util.js';

export type ResultVerifier = (fake: unknown, real: unknown) => void;

const constructorSentinel = Symbol('constructor sentinal');

export let getValueOfVerifiableResult: <T>(self: VerifiableResult<T>) => T;

export let verifyTheVerifiableResult: <T>(self: VerifiableResult<T>, realResult: T, fnName: string) => void;

export class VerifiableResult<T> {
  #result;
  #verifier: ResultVerifier;
  constructor(key: typeof constructorSentinel, result: T, verifier: ResultVerifier) {
    assert(key === constructorSentinel, `This FakeResult constructor is private`);
    this.#result = result;
    this.#verifier = verifier;
  }

  static {
    getValueOfVerifiableResult = <T>(self: VerifiableResult<T>): T => {
      return self.#result;
    }

    verifyTheVerifiableResult = <T>(self: VerifiableResult<T>, realResult: T, fnName: string): void => {
      try {
        self.#verifier(self.#result, realResult);
      } catch (error: any) {
        throw new Error(
          `Invalid fake implementation for ${fnName}() - ` +
          `it did not line up with the real implementation's result: ${error.message}`
        );
      }
    }
  }
}

export function verifyResult<T>(value: T): { readonly with: (fn: ResultVerifier) => VerifiableResult<T> } {
  return {
    with(resultVerifier: ResultVerifier) {
      return new VerifiableResult(constructorSentinel, value, resultVerifier);
    }
  };
}