import type { Seam } from './seams'
import type { InterfaceOfFns, ReconstructedFn, StringKeys, StringKeysForAsyncFns } from './utilityTypes'

export interface SeamBehavior {
  define<T extends InterfaceOfFns, FnName extends StringKeysForAsyncFns<T>>(
    self: Seam<T, string>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): ReconstructedFn<T[FnName]>

  defineSync<T extends InterfaceOfFns, FnName extends StringKeys<T>>(
    self: Seam<T, string>,
    fnName: FnName,
    realImplementation: T[FnName]
  ): ReconstructedFn<T[FnName]>
}
