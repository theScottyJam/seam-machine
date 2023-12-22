import type { VerifiableResult } from './control/VerifiableResult';
import type { Dependency } from './seams';
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from './utilityTypes';
export interface DependencyBehavior {
    define<T extends InterfaceOfFns, FnName extends StringKeysForAsyncFns<T>>(self: Dependency<T>, fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]>;
    defineSync<T extends InterfaceOfFns, FnName extends StringKeys<T>>(self: Dependency<T>, fnName: FnName, realImplementation: T[FnName]): ReconstructedFn<T[FnName]>;
}
export type AltImplementationReturnTypeOf<T> = T | (T extends Promise<any> ? Promise<VerifiableResult<Awaited<T>>> : VerifiableResult<T>);
export type AltImplementationOf<T extends InterfaceOfFns> = {
    [Key in StringKeys<T>]: (...args: Parameters<T[Key]>) => AltImplementationReturnTypeOf<ReturnType<T[Key]>>;
};
