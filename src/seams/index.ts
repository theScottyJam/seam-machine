import type { SeamBehavior } from '#src/types';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from '#src/utilityTypes';

let seamBehavior: SeamBehavior = {
  define: (self, fnName, realImplementation) => realImplementation,
  defineSync: (self, fnName, realImplementation) => realImplementation,
};

/** Thrown when you attempt to change the behavior of Seam after instances of it have already been made. */
export class SeamBehaviorAlreadyInUseError extends Error {}

let hasSeamInstancesBeenCreated = false;

/**
 * Changes the behavior of the Seam class.
 * If instances of Seam have already been created, SeamBehaviorAlreadyInUseError will be thrown.
 */
export function setSeamBehavior(behavior: SeamBehavior) {
  if (hasSeamInstancesBeenCreated) {
    throw new SeamBehaviorAlreadyInUseError('Can not change the behavior of the Seam class after it has been used.');
  }
  seamBehavior = behavior;
}

const seamConstructorKey = Symbol('Seam Constructor Key');

export type ListenerEntry = { type: 'sync', fn: () => void } | { type: 'async', fn: () => Promise<void> };

export let getListenersForSeam: (seam: AnySeam) => ListenerEntry[];

export class Seam<T extends InterfaceOfFns, const N extends string> {
  // Using `as any` here, because TypeScript doesn't understand that defineProperty() defines the property.
  readonly name: N = undefined as any;
  #beforeUseInTestListeners: ListenerEntry[] = [];
  constructor(key: typeof seamConstructorKey, name: N) {
    if(key !== seamConstructorKey) {
      throw new Error('The constructor for Seam is private.');
    }

    this.name = name;
    hasSeamInstancesBeenCreated = true;
    Object.defineProperty(this, 'name', { writable: false, value: name });
  }

  define<const FnName extends StringKeysForAsyncFns<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]> {
    return seamBehavior.define(this, fnName, realImplementation);
  }

  defineSync<const FnName extends StringKeys<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]> {
    return seamBehavior.defineSync(this, fnName, realImplementation);
  }

  beforeUseInTest(fn: () => Promise<void>) {
    this.#beforeUseInTestListeners.push({ type: 'async', fn });
  }

  beforeUseInTestSync(fn: () => void) {
    this.#beforeUseInTestListeners.push({ type: 'sync', fn });
  }

  static {
    getListenersForSeam = (seam: AnySeam) => seam.#beforeUseInTestListeners
  }
}

export type AnySeam = Seam<{}, string>

/**
 * Don't use Seam's constructor directly.
 * Instead use this function that returns a function.
 * This is necessary because the first generic parameter should always be explicitly provided
 * while the second one can be inferred just fine, but there's no way to accomplish that without using two separate functions.
 * See https://github.com/microsoft/TypeScript/issues/16597
 */
export function createSeam<T extends InterfaceOfFns>() {
  return {
    named: <N extends string>(name: N) => new Seam<T, N>(seamConstructorKey, name),
  }
}
