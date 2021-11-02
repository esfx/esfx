/* @internal */
export const isObject = (value: unknown) => typeof value === "object" && value !== null;

/* @internal */
export const isFunction = (value: unknown) => typeof value === "function";

/* @internal */
export const isOwn = (object: object, key: keyof any) => !!Object.getOwnPropertyDescriptor(object, key);

/* @internal */
export const isInherited = (object: object | undefined, key: keyof any, base?: object): boolean =>
    object === undefined ? false :
    object === base ? isOwn(object, key) :
        isInherited(Object.getPrototypeOf(object), key, base);

/* @internal */
export const isEnumerable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.enumerable === true;

/* @internal */
export const isNonEnumerable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.enumerable === false;

/* @internal */
export const isConfigurable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.configurable === true;

/* @internal */
export const isNonConfigurable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.configurable === false;

/* @internal */
export const isWritable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.writable === true;

/* @internal */
export const isNonWritable = (object: object, key: keyof any) => Object.getOwnPropertyDescriptor(object, key)?.writable === false;

/* @internal */
export const hasOwnMethod = (object: object, key: keyof any) => isFunction(Object.getOwnPropertyDescriptor(object, key)?.value);

/* @internal */
export const hasOwnGetter = (object: object, key: keyof any) => !!Object.getOwnPropertyDescriptor(object, key)?.get;

/* @internal */
export const hasOwnSetter = (object: object, key: keyof any) => !!Object.getOwnPropertyDescriptor(object, key)?.set;
