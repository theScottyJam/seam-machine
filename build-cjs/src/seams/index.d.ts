import type { DependencyBehavior } from '#src/types';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from '#src/utilityTypes';
/** Thrown when you attempt to change the behavior of Dependency after instances of it have already been made. */
export declare class DependencyBehaviorAlreadyInUseError extends Error {
}
/**
 * Changes the behavior of the Dependency class.
 * If instances of Dependency have already been created, DependencyBehaviorAlreadyInUseError will be thrown.
 */
export declare function setDependencyBehavior(behavior: DependencyBehavior): void;
export declare class Dependency<T extends InterfaceOfFns> {
    constructor();
    define<FnName extends StringKeysForAsyncFns<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]>;
    defineSync<FnName extends StringKeys<T>>(fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]>;
}
