export type StringKeys<T extends {}> = Extract<keyof T, string>;

type AnyFunction = (...args: any[]) => any;

export type ReconstructedFn<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>

export type InterfaceOfFns = { readonly [index: string]: AnyFunction };

type StringKeysForAsyncFnsHelper<T extends InterfaceOfFns, FnName = StringKeys<T>> = (
  // This outer `extends` is here to make this a distributed conditional type.
  // i.e. the stuff after the `?` will be applied to each FnName in the FnName union type.
  FnName extends StringKeys<T>
    ? ReturnType<T[FnName]> extends Promise<any> ? FnName : never
    : never
);

export type StringKeysForAsyncFns<T extends InterfaceOfFns> = StringKeysForAsyncFnsHelper<T>;
