import { matcherHint, printReceived, printExpected } from "jest-matcher-utils";

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

function makePropertyExpectationWithBase(test: (object: object, key: keyof any, base?: object) => boolean, name: string, expectedMessage: string, isNegation: boolean) {
    const formatKey = (key: keyof any) => typeof key === "symbol" ? key.toString() : JSON.stringify(key);
    const passMessage = (key: keyof any) => () => `${matcherHint(`.not.${name}`)}\n\nExpected property ${formatKey(key)} to ${isNegation ? "" : "not "}be ${expectedMessage}.`;
    const failMessage = (key: keyof any) => () => `${matcherHint(`.${name}`)}\n\nExpected property ${formatKey(key)} to ${isNegation ? "not " : ""}be ${expectedMessage}`;
    return (received: object, key: keyof any, base?: object) => {
        const pass = test(received, key, base);
        const message = (pass ? passMessage : failMessage)(key);
        return { pass, message };
    };
}

function makePropertyExpectation(test: (object: object, key: keyof any) => boolean, name: string, expectedMessage: string, isNegation: boolean) {
    const expectation = makePropertyExpectationWithBase(test, name, expectedMessage, isNegation);
    return (received: object, key: keyof any) => expectation(received, key);
}

expect.extend({
    toHaveInheritedProperty: makePropertyExpectationWithBase(isInherited, "toHaveInheritedProperty", "an inherited property", /*isNegation*/ false),
    toHaveOwnProperty: makePropertyExpectation(isOwn, "toHaveOwnProperty", "an own property", /*isNegation*/ false),
    toHaveOwnMethod: makePropertyExpectation(hasOwnMethod, "toHaveOwnMethod", "an own method", /*isNegation*/ false),
    toHaveOwnGetter: makePropertyExpectation(hasOwnGetter, "toHaveOwnGetter", "an own getter", /*isNegation*/ false),
    toHaveOwnSetter: makePropertyExpectation(hasOwnSetter, "toHaveOwnSetter", "an own setter", /*isNegation*/ false),
    toHaveWritableProperty: makePropertyExpectation(isWritable, "toHaveWritableProperty", "writable", /*isNegation*/ false),
    toHaveNonWritableProperty: makePropertyExpectation(isNonWritable, "toHaveNonWritableProperty", "writable", /*isNegation*/ true),
    toHaveEnumerableProperty: makePropertyExpectation(isEnumerable, "toHaveEnumerableProperty", "enumerable", /*isNegation*/ false),
    toHaveNonEnumerableProperty: makePropertyExpectation(isNonEnumerable, "toHaveNonEnumerableProperty", "enumerable", /*isNegation*/ true),
    toHaveConfigurableProperty: makePropertyExpectation(isConfigurable, "toHaveConfigurableProperty", "configurable", /*isNegation*/ false),
    toHaveNonConfigurableProperty: makePropertyExpectation(isNonConfigurable, "toHaveNonConfigurableProperty", "configurable", /*isNegation*/ true),
    toBeTypeof(received: unknown, typeTag: "string" | "number" | "boolean" | "object" | "function" | "undefined" | "symbol" | "bigint" | string & Record<never, never>) {
        const receivedTypeTag = typeof received;
        const pass = receivedTypeTag === typeTag;
        const message = pass ?
            () => `${matcherHint(".not.toBeTypeof")}\n\nExpected typeof value to not be ${printExpected(typeTag)}.` :
            () => `${matcherHint(".toBeTypeof")}\n\nExpected typeof value to be ${printExpected(typeTag)}, but it was ${printReceived(typeTag)} instead.`
        return { pass, message };
    }
});

type WeakAnyKeyOf<T> =
    | (T extends unknown ? keyof T : never)
    | (keyof any) & Record<never, never>;

declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toBeTypeof(typeTag: "string" | "number" | "boolean" | "object" | "function" | "undefined" | "symbol" | "bigint" | string & Record<never, never>): R;
            toHaveInheritedProperty(key: WeakAnyKeyOf<T>): R;
            toHaveOwnProperty(key: WeakAnyKeyOf<T>): R;
            toHaveOwnMethod(key: WeakAnyKeyOf<T>): R;
            toHaveOwnGetter(key: WeakAnyKeyOf<T>): R;
            toHaveOwnSetter(key: WeakAnyKeyOf<T>): R;
            toHaveWritableProperty(key: WeakAnyKeyOf<T>): R;
            toHaveNonWritableProperty(key: WeakAnyKeyOf<T>): R;
            toHaveEnumerableProperty(key: WeakAnyKeyOf<T>): R;
            toHaveNonEnumerableProperty(key: WeakAnyKeyOf<T>): R;
            toHaveConfigurableProperty(key: WeakAnyKeyOf<T>): R;
            toHaveNonConfigurableProperty(key: WeakAnyKeyOf<T>): R;
        }
    }
}