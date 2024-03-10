import { Seam, getListenersForSeam, type AnySeam, type ListenerEntry } from '#src/seams/index.js';
import type { SeamBehavior } from '#src/types.js';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from '#src/utilityTypes.js';
import { getTestModeType } from './index.js';
import { UnreachableCaseError, assert } from './util.js';

type SeamInstruction<T extends InterfaceOfFns> = { type: 'unitTestSwap' | 'alwaysSwap', with: T } | { type: 'permit' };

type AnySeamInstruction = SeamInstruction<{}>;

type SeamInstructions = Map<AnySeam, AnySeamInstruction>;

let appliedSeamInstructions: { readonly mapping: SeamInstructions, readonly shouldSelfCleanup: boolean } | null = null;

const constructKey = Symbol();

// A linked-list-like type. No real values exist that conform to this, instead,
// this is purely informational to help SeamControl know what the types
// of its swappable pieces are.
type TestSwapsInfo = { name: string, swap: InterfaceOfFns, next: TestSwapsInfo } | null;

type AlwaysSwappedValueOf<N extends string, AlwaysSwapped /* extends TestSwapsInfo */> = (
  AlwaysSwapped extends { name: infer N2, swap: infer Swap, next: infer Next }
    ? (
        N extends N2
          ? Swap
          : AlwaysSwappedValueOf<N, Next>
      )
    : never
);

export class SeamControl<AlwaysSwapped extends TestSwapsInfo = null> {
  #seamInstructions: SeamInstructions;
  // Publicly the parameter's type is `[]`, but the implementation also supports
  // receiving a special object as a parameter to initialize the object's state.
  // This behavior isn't included in the type signature since it's not intended for public use.
  constructor(...args_: []) {
    const args = args_ as any;
    if (args_.length === 0) {
      this.#seamInstructions = new Map();
    } else {
      // The constructor does technically accept arguments despite what this error message says -
      // it's just that those are internal-use-only arguments.
      assert(args[0]?.key === constructKey, 'The constructor for SeamControl accepts no arguments.');
      this.#seamInstructions = args[0].state;
    }
  }

  static #withState(instructions: SeamInstructions) {
    return new SeamControl(...[{ key: constructKey, state: instructions }] as unknown as []);
  }

  unitTestSwap<T extends InterfaceOfFns, N extends string>(seam: Seam<T, N>, swappedBehavior: Partial<T>): SeamControl<TestSwapsInfo> {
    if (this.#seamInstructions.has(seam)) {
      throw new Error(`The seam ${JSON.stringify(seam.name)} already has behavior associated with it.`);
    }
    const instructions = new Map(this.#seamInstructions);
    instructions.set(seam, { type: 'unitTestSwap', with: swappedBehavior });
    return SeamControl.#withState(instructions);
  }

  alwaysSwap<Swapped extends InterfaceOfFns, T extends Swapped, N extends string>(
    seam: Seam<T, N>,
    swappedBehavior: Swapped
  ): SeamControl<{ name: N, swap: Swapped, next: TestSwapsInfo }> {
    if (this.#seamInstructions.has(seam)) {
      throw new Error(`The seam ${JSON.stringify(seam.name)} already has behavior associated with it.`);
    }
    const instructions = new Map(this.#seamInstructions);
    instructions.set(seam, { type: 'alwaysSwap', with: swappedBehavior });
    return SeamControl.#withState(instructions) satisfies SeamControl as any;
  }

  permit(seam: AnySeam): SeamControl<TestSwapsInfo> {
    if (this.#seamInstructions.has(seam)) {
      throw new Error(`The seam ${JSON.stringify(seam.name)} already has behavior associated with it.`);
    }
    const instructions = new Map(this.#seamInstructions);
    instructions.set(seam, { type: 'permit' });
    return SeamControl.#withState(instructions);
  }

  async go(callback: () => Promise<void>) {
    if (appliedSeamInstructions !== null) {
      throw new Error('Can not call go() inside of another call to a go function. Only one SeamControl instance can be active at a time.')
    }

    for (const fn of this.#getSeamInstructionsTestListeners({ permitAsync: true })) {
      await fn();
    }

    appliedSeamInstructions = { mapping: this.#seamInstructions, shouldSelfCleanup: true };
    try {
      await callback();
    } finally {
      appliedSeamInstructions = null;
    }
  }

  goSync(callback: () => void) {
    if (appliedSeamInstructions !== null) {
      throw new Error('Can not call goSync() inside of another call to a go function. Only one SeamControl instance can be active at a time.')
    }

    for (const fn of this.#getSeamInstructionsTestListeners({ permitAsync: false })) {
      fn();
    }

    appliedSeamInstructions = { mapping: this.#seamInstructions, shouldSelfCleanup: true };
    try {
      callback();
    } finally {
      appliedSeamInstructions = null;
    }
  }

  /**
   * Avoid calling this in the beforeEach() or any test initialization functions.
   * Doing so can prevent you from calling other setup functions that require a different set of seam replacements,
   * since only one go-related function can be active at a time.
   */
  async goUntilEnd(): Promise<SeamControl<AlwaysSwapped>> {
    if (appliedSeamInstructions !== null) {
      throw new Error('Can not call goUntilEnd() inside of another call to a go function. Only one SeamControl instance can be active at a time.')
    }

    for (const fn of this.#getSeamInstructionsTestListeners({ permitAsync: true })) {
      await fn();
    }

    appliedSeamInstructions = { mapping: this.#seamInstructions, shouldSelfCleanup: false };

    return this;
  }

  /**
   * Avoid calling this in the beforeEach() or any test initialization functions.
   * Doing so can prevent you from calling other setup functions that require a different set of seam replacements,
   * since only one go-related function can be active at a time.
   */
  goUntilEndSync(): SeamControl<AlwaysSwapped> {
    if (appliedSeamInstructions !== null) {
      throw new Error('Can not call goUntilEnd() inside of another call to a go function. Only one SeamControl instance can be active at a time.')
    }

    for (const fn of this.#getSeamInstructionsTestListeners({ permitAsync: false })) {
      fn();
    }

    appliedSeamInstructions = { mapping: this.#seamInstructions, shouldSelfCleanup: false };

    return this;
  }

  getSwapped<N extends string>(seam: Seam<AlwaysSwappedValueOf<N, AlwaysSwapped>, N>): AlwaysSwappedValueOf<N, AlwaysSwapped> {
    const instructions = this.#seamInstructions.get(seam);
    if (instructions === undefined) {
      throw new Error(`Attempted to get the swapped value for the seam ${JSON.stringify(seam.name)}, but there was no swap registered for it.`);
    }
    if (instructions === undefined || instructions.type !== 'alwaysSwap') {
      throw new Error(`Attempted to get the swapped value for the seam ${JSON.stringify(seam.name)}, but the swap that was registered for it was not an "always swap", so we can not guarantee that this will always return a value.`);
    }

    return instructions.with as any;
  }

  #getSeamInstructionsTestListeners (opts: { permitAsync: false }): (() => void)[]
  #getSeamInstructionsTestListeners (opts: { permitAsync: true }): ((() => void) | (() => Promise<void>))[]
  #getSeamInstructionsTestListeners (opts: { permitAsync: boolean }): ((() => void) | (() => Promise<void>))[] {
    const allListeners: ((() => void) | (() => Promise<void>))[] = [];
    for (const [seam, seamInstruction] of this.#seamInstructions.entries()) {
      if (seamInstruction.type === 'permit' || seamInstruction.type === 'unitTestSwap') {
        const listeners = getListenersForSeam(seam);
        for (const { fn, type } of listeners) {
          // assert callback's aren't async if we're in a non-async "go" function.
          if (type === 'async' && !opts.permitAsync) {
            throw new Error(
              `The seam ${seam.name} has an async before-use-in-test listener. ` +
              'As such, you can not use the real implementation of this seam in your tests unless you use an async version of a "go" function.'
            );
          }

          if (seamInstruction.type === 'unitTestSwap' && getTestModeType() === 'unit') {
            // Because we're in unit test mode, some of these listeners don't actually need to execute.
            // It was still important that we ran these listeners through the above "assert callback's aren't async" check,
            // so we can inform the end-user of this sort of issue during a unit test, instead of the slower-running integration tests.
            continue;
          }

          allListeners.push(fn);
        }
      }
    }

    return allListeners;
  }
}

export const testModeSeamBehavior: SeamBehavior = {
  define<T extends InterfaceOfFns, FnName extends StringKeysForAsyncFns<T>>(
    self: Seam<T, string>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): (...args: Parameters<T[FnName]>) => ReturnType<T[FnName]> {
    return (async (...args: Parameters<T[FnName]>): Promise<Awaited<ReturnType<T[FnName]>>> => {
      return definedFnBehavior(self, fnName, realImplementation, args) as any;
    }) as any;
  },

  defineSync<T extends InterfaceOfFns, FnName extends StringKeys<T>>(
    self: Seam<T, string>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): ReconstructedFn<T[FnName]> {
    return ((...args: Parameters<T[FnName]>): ReturnType<T[FnName]> => {
      return definedFnBehavior(self, fnName, realImplementation, args);
    });
  },
};

function definedFnBehavior<T extends InterfaceOfFns, FnName extends StringKeys<T>>(
  self: Seam<T, string>,
  fnName: FnName,
  realImplementation: T[FnName],
  args: Parameters<T[FnName]>
): ReturnType<T[FnName]> {
  const testModeType = getTestModeType();
  // This should not happen - these behaviors only get used if you've already decided on a test mode.
  assert(testModeType !== null);

  if (appliedSeamInstructions === null) {
    throw new Error(
      `Attempted to call the function ${JSON.stringify(fnName)} from the seam ${JSON.stringify(self.name)} ` +
      'before a SeamInstructions instance was used to describe how seams should behave during the test.'
    );
  }

  const instruction = appliedSeamInstructions.mapping.get(self) as SeamInstruction<T> | undefined;
  if (instruction === undefined) {
    throw new Error(`No behavior was associated with the test seam ${JSON.stringify(self.name)}`);
  }

  const swappedFnNotProvidedErrorMsg = () => (
    `Attempted to call ${JSON.stringify(fnName)} on ${JSON.stringify(self.name)}, but a swapped definition for this specific function was not provided.`
  );

  if (instruction.type === 'unitTestSwap') {
    if (testModeType === 'unit') {
      const swappedFn = instruction.with[fnName];
      assert(swappedFn !== undefined, swappedFnNotProvidedErrorMsg());
      return swappedFn.call(instruction.with, ...args)
    } else {
      assert(testModeType === 'integration');
      return realImplementation(...args);
    }
  } else if (instruction.type === 'alwaysSwap') {
    const swappedFn = instruction.with[fnName];
    assert(swappedFn !== undefined, swappedFnNotProvidedErrorMsg());
    return swappedFn(...args);
  } else if (instruction.type === 'permit') {
    return realImplementation(...args);
  } else {
    throw new UnreachableCaseError(instruction.type);
  }
}

/** Should be called in the afterEach(). */
export function onAfterEach() {
  if (appliedSeamInstructions && appliedSeamInstructions.shouldSelfCleanup) {
    throw new Error(
      'reset() was called before all go()/goSync() functions finished executing. ' +
      'This usually means the test finished running before the callback passed into go() finished executing. ' +
      'Make sure go() is properly awaited, as well as any other functions that need to be.'
    );
  }

  appliedSeamInstructions = null;
}
