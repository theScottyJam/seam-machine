import { Dependency } from '#src/seams/index.js';
import type { DependencyBehavior, AltImplementationOf } from '#src/types.js';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from '#src/utilityTypes.js';
import { VerifiableResult, getValueOfVerifiableResult, verifyTheVerifiableResult } from './VerifiableResult.js';
import { UnreachableCaseError } from './util.js';

type AnyDependency = Dependency<{}>

type ReplacementEntry<T extends InterfaceOfFns = {}> = { type: 'replace' | 'validate', with: AltImplementationOf<T> } | { type: 'no-op' };

const dependencyReplacements = new Map<AnyDependency, ReplacementEntry>();

export function replaceDependencyWith<T extends InterfaceOfFns>(dependency: Dependency<T>, replacement: AltImplementationOf<T>): void {
  if (dependencyReplacements.has(dependency)) {
    throw new Error(
      'The provided dependency already has behavior assosiated with it for this test. ' +
      '(Maybe you forgot to call reset() in the after-each?)'
    );
  }
  dependencyReplacements.set(dependency, { type: 'replace', with: replacement });
}

export function validateDependencyReplacement<T extends InterfaceOfFns>(dependency: Dependency<T>, replacement: AltImplementationOf<T>): void {
  if (dependencyReplacements.has(dependency)) {
    throw new Error(
      'The provided dependency already has behavior assosiated with it for this test. ' +
      '(Maybe you forgot to call reset() in the after-each?)'
    );
  }
  dependencyReplacements.set(dependency, { type: 'validate', with: replacement });
}

export function permitUseOf(...dependencies: AnyDependency[]) {
  for (const [i, dependency] of dependencies.entries()) {
    if (dependencyReplacements.has(dependency)) {
      throw new Error(
        `The provided dependency #${i + 1} already has behavior assosiated with it for this test. ' +
        '(Maybe you forgot to call reset() in the after-each?)`
      );
    }
    dependencyReplacements.set(dependency, { type: 'no-op' });
  }
}

export const testModeDependencyBehavior: DependencyBehavior = {
  define<T extends InterfaceOfFns, FnName extends StringKeysForAsyncFns<T>>(
    self: Dependency<T>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): (...args: Parameters<T[FnName]>) => ReturnType<T[FnName]> {
    return (async (...args: Parameters<T[FnName]>): Promise<Awaited<ReturnType<T[FnName]>>> => {
      const replacement = getDependencyReplacement(self, fnName);

      if (replacement.type === 'replace') {
        const testDoubleResult = await replacement.with[fnName](...args);
        return (testDoubleResult instanceof VerifiableResult ? getValueOfVerifiableResult(testDoubleResult) : testDoubleResult) as any;
      } else if (replacement.type === 'validate') {
        const realResult = await realImplementation(...args) as any;
        const testDoubleResult = await replacement.with[fnName](...args);

        if (testDoubleResult instanceof VerifiableResult) {
          verifyTheVerifiableResult(testDoubleResult, realResult, fnName);
        }

        return realResult;
      } else if (replacement.type === 'no-op') {
        return realImplementation(...args);
      } else {
        throw new UnreachableCaseError(replacement.type);
      }
    }) as any;
  },

  defineSync<T extends InterfaceOfFns, FnName extends StringKeys<T>>(
    self: Dependency<T>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): ReconstructedFn<T[FnName]> {
    return ((...args: Parameters<T[FnName]>): ReturnType<T[FnName]> => {
      const replacement = getDependencyReplacement(self, fnName);

      if (replacement.type === 'replace') {
        const testDoubleResult = replacement.with[fnName](...args);
        return (testDoubleResult instanceof VerifiableResult ? getValueOfVerifiableResult(testDoubleResult) : testDoubleResult) as ReturnType<T[FnName]>;
      } else if (replacement.type === 'validate') {
        const realResult = realImplementation(...args) as ReturnType<T[FnName]>;
        const testDoubleResult = replacement.with[fnName](...args);

        if (testDoubleResult instanceof VerifiableResult) {
          verifyTheVerifiableResult(testDoubleResult, realResult, fnName);
        }

        return realResult;
      } else if (replacement.type === 'no-op') {
        return realImplementation(...args);
      } else {
        throw new UnreachableCaseError(replacement.type);
      }
    });
  },
};

function getDependencyReplacement<T extends InterfaceOfFns>(dependency: Dependency<T>, fnName: string): ReplacementEntry<T> {
  const replacement = dependencyReplacements.get(dependency) as ReplacementEntry<T> | undefined;
  if (replacement === undefined) {
    throw new Error(`No behavior was assosiated with the dependency, for function ${fnName}()`);
  }

  return replacement;
}

/** This function should get called in your global after-each. */
export function reset(): void {
  dependencyReplacements.clear();
}
