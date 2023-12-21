import type { DependencyBehavior } from '#src/types';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from '#src/utilityTypes';

let dependencyBehavior: DependencyBehavior = {
  define: (self, fnName, realImplementation) => {
    return realImplementation
  },
  defineSync: (self, fnName, realImplementation) => realImplementation,
};

/** Thrown when you attempt to change the behavior of Dependency after instances of it have already been made. */
export class DependencyBehaviorAlreadyInUseError extends Error {}

let hasDependencyInstancesBeenCreated = false;

/**
 * Changes the behavior of the Dependency class.
 * If instances of Dependency have already been created, DependencyBehaviorAlreadyInUseError will be thrown.
 */
export function setDependencyBehavior(behavior: DependencyBehavior) {
  if (hasDependencyInstancesBeenCreated) {
    throw new DependencyBehaviorAlreadyInUseError('Can not change the behavior of the Dependency class after it has been used.');
  }
  dependencyBehavior = behavior;
}

export class Dependency<T extends InterfaceOfFns> {
  constructor() {
    hasDependencyInstancesBeenCreated = true;
  }

  define<FnName extends StringKeysForAsyncFns<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]> {
    return dependencyBehavior.define(this, fnName, realImplementation);
  }

  defineSync<FnName extends StringKeys<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]> {
    return dependencyBehavior.defineSync(this, fnName, realImplementation);
  }
}
