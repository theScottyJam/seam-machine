export type StringKeys<T extends {}> = Extract<keyof T, string>;
type AnyFunction = (...args: any[]) => any;
export type ReconstructedFn<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;
export type InterfaceOfFns = {
    readonly [index: string]: AnyFunction;
};
type StringKeysForAsyncFnsHelper<T extends InterfaceOfFns, FnName = StringKeys<T>> = (FnName extends StringKeys<T> ? ReturnType<T[FnName]> extends Promise<any> ? FnName : never : never);
export type StringKeysForAsyncFns<T extends InterfaceOfFns> = StringKeysForAsyncFnsHelper<T>;
export {};
