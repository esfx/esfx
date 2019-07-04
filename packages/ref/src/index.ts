/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { isObject, isFunction, isDefined } from '@esfx/internal-guards';

const refData = Symbol.for("@esfx/ref:refData");


/**
 * A reference to a lexical value.
 */
export interface Reference<T> {
    value: T;
    [Symbol.toStringTag]: string;
}

interface InternalReference<T> extends Reference<T> {
    readonly [refData]: ReferenceData<T>;
}

interface ReferenceData<T> {
    get: () => T;
    set?: (value: T) => void;
}

const refPrototype: Reference<unknown> = {
    get value(this: InternalReference<unknown>) {
        const data = this[refData];
        if (!data) throw new ReferenceError("Object is not a Reference.");

        const { get } = data;
        return get();
    },
    set value(this: InternalReference<unknown>, _: unknown) {
        const data = this[refData];
        if (!data) throw new ReferenceError("Object is not a Reference.");

        const { set } = data;
        if (!set) throw new ReferenceError("ref is readonly.");
        set(_);
    },
    get [Symbol.toStringTag]() {
        return "Reference";
    }
};

Object.freeze(refPrototype);

/**
 * Create a reference to a value in the current lexical scope.
 * @param get Gets the value of the reference.
 * @param set Sets the value of the reference.
 */
export function ref<T>(get: () => T, set?: (value: T) => void): Reference<T> {
    const refObj: Reference<T> = Object.create(refPrototype, {
        [refData]: {
            enumerable: false,
            configurable: false,
            writable: false,
            value: { get, set }
        }
    });
    Object.freeze(refObj);
    return refObj;
}

export namespace ref {
    ref.is = function(value: unknown): value is Reference<unknown> {
        return isObject(value) && refData in value;
    };

    ref.for = function<T>(value: T) {
        return ref<T>(() => value, _ => value = _);
    };

    export function deref<T>(value: T | Reference<T>): T {
        return ref.is(value) ? value.value : value;
    };

    /**
     * Creates a `ref` to a property of an object.
     */
    export function at<T, K extends keyof T>(object: T, key: K, readonly = false) {
        return ref<T[K]>(
            () => object[key],
            readonly ? undefined : _ => object[key] = _);
    }

    function outForGetSet<T>(get: () => T, set: (value: T) => void) {
        let wasSet = false;
        return ref<T>(() => {
            if (!wasSet) throw new TypeError("ref not set.");
            return get();
        }, _ => {
            set(_);
            wasSet = true;
        });
    }

    function outForValue<T>() {
        let value: T, wasSet = false;
        return ref<T>(() => {
            if (!wasSet) throw new TypeError("ref not set.");
            return value;
        }, _ => {
            value = _;
            wasSet = true;
        });
    }

    /**
     * Creates a `ref` that must be set before it can be read.
     */
    export function out<T>(): Reference<T>;
    export function out<T>(get: () => T, set: (value: T) => void): Reference<T>;
    export function out<T>(get?: () => T, set?: (value: T) => void) {
        if (isDefined(get) || isDefined(set)) {
            if (!isFunction(get)) throw new TypeError("Function expected: get");
            if (!isFunction(set)) throw new TypeError("Function expected: set");
            return outForGetSet(get, set);
        }
        return outForValue<T>();
    }

    Object.defineProperty(ref, Symbol.hasInstance, {
        enumerable: false,
        configurable: true,
        writable: false,
        value: ref.is,
    });

    export const prototype = refPrototype;
}

export declare namespace ref {
    /**
     * Determines whether `value` is a [[ref]].
     */
    function _is(value: unknown): value is Reference<any>;
    export { _is as is };

    /**
     * Creates a `ref` for an initial value.
     */
    function _for<T>(value: T): Reference<T>;
    export { _for as for };
}
