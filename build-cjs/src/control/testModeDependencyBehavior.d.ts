import { Dependency } from '#src/seams/index.js';
import type { DependencyBehavior, AltImplementationOf } from '#src/types.js';
import type { InterfaceOfFns } from '#src/utilityTypes.js';
type AnyDependency = Dependency<{}>;
export declare function replaceDependencyWith<T extends InterfaceOfFns>(dependency: Dependency<T>, replacement: AltImplementationOf<T>): void;
export declare function validateDependencyReplacement<T extends InterfaceOfFns>(dependency: Dependency<T>, replacement: AltImplementationOf<T>): void;
export declare function permitUseOf(...dependencies: AnyDependency[]): void;
export declare const testModeDependencyBehavior: DependencyBehavior;
/** This function should get called in your global after-each. */
export declare function reset(): void;
export {};
