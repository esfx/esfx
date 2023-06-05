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

/**
 * Represents an object that can be indexed by an integer value similar to a native
 * Array or TypedArray.
 */
export abstract class IntegerIndexedObject<T> {
    static #handler: ProxyHandler<IntegerIndexedObject<any>>;

    static {
        function toCanonicalNumericIndex(propertyKey: string | symbol) {
            if (typeof propertyKey === "string") {
                if (propertyKey === "-0") return -0;
                const index = Number(propertyKey);
                if (String(index) === propertyKey) return index;
                return undefined;
            }
        }

        function isIntegralNumber(index: number) {
            if (isNaN(index)) return false;
            if (!isFinite(index)) return false;
            if (Math.trunc(index) !== index) return false;
            return true;
        }

        function getLength(target: IntegerIndexedObject<unknown>) {
            return target.#instance.getLength();
        }

        function getIndexDescriptor<T>(target: IntegerIndexedObject<T>, index: number): PropertyDescriptor | undefined {
            if (hasIndex(target, index)) {
                const value = target.#instance.getIndex(index);
                return { enumerable: true, configurable: true, writable: true, value };
            }
            return undefined;
        }

        function defineIndex<T>(target: IntegerIndexedObject<T>, index: number, descriptor: PropertyDescriptor): boolean {
            if (descriptor.configurable === false) return false;
            if (descriptor.enumerable === false) return false;
            if (descriptor.writable === false) return false;
            if (descriptor.get) return false;
            if (descriptor.set) return false;
            if ("value" in descriptor === false) return hasIndex(target, index);
            return setIndex(target, index, descriptor.value);
        }

        function hasIndexUnchecked(target: IntegerIndexedObject<unknown>, index: number) {
            return target.#instance.hasIndex(index);
        }

        function hasIndex(target: IntegerIndexedObject<unknown>, index: number) {
            if (!isIntegralNumber(index)) return false;
            if (Object.is(index, -0)) return false;
            if (index < 0) return false;
            return hasIndexUnchecked(target, index);
        }

        function getIndex<T>(target: IntegerIndexedObject<T>, index: number) {
            return hasIndex(target, index) ? target.#instance.getIndex(index) : undefined;
        }

        function setIndex<T>(target: IntegerIndexedObject<T>, index: number, value: T) {
            return hasIndex(target, index) ? target.#instance.setIndex(index, value) : false;
        }

        function deleteIndex<T>(target: IntegerIndexedObject<T>, index: number) {
            return hasIndex(target, index) ? target.#instance.deleteIndex(index) : false;
        }

        this.#handler = {
            getOwnPropertyDescriptor(target, propertyKey) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? getIndexDescriptor(target, index) : Reflect.getOwnPropertyDescriptor(target, propertyKey);
            },
            defineProperty(target, propertyKey, descriptor) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? defineIndex(target, index, descriptor) : Reflect.defineProperty(target, propertyKey, descriptor);
            },
            has(target, propertyKey) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? hasIndex(target, index) : Reflect.has(target, propertyKey);
            },
            get(target, propertyKey, receiver) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? getIndex(target, index) : Reflect.get(target, propertyKey, receiver);
            },
            set(target, propertyKey, value, receiver) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? setIndex(target, index, value) : Reflect.set(target, propertyKey, value, receiver);
            },
            deleteProperty(target, propertyKey) {
                const index = toCanonicalNumericIndex(propertyKey);
                return index !== undefined ? deleteIndex(target, index) : Reflect.deleteProperty(target, propertyKey);
            },
            ownKeys(target) {
                const keys: (string | symbol)[] = [];
                const length = getLength(target);
                for (let i = 0; i < length; i++) {
                    if (hasIndexUnchecked(target, i)) {
                        keys.push(String(i));
                    }
                }
                for (const key of Reflect.ownKeys(target)) {
                    if (typeof key !== "string" || toCanonicalNumericIndex(key) === undefined) {
                        keys.push(key);
                    }
                }
                return keys;
            },
            preventExtensions(target) {
                const length = target.#instance.getLength();
                if (length > 0) {
                    throw new TypeError("Cannot freeze an IntegerIndexedObject with elements.");
                }
                return Reflect.preventExtensions(target);
            }
        };
    }

    #instance: IntegerIndexedObject<T>;

    constructor() {
        return this.#instance = new Proxy(this, IntegerIndexedObject.#handler);
    }

    /**
     * Gets or sets the value at the specified index.
     */
    [index: number]: T;

    /**
     * Gets the "length" of the indexed object, which should be one more than the
     * largest index stored in the object.
     */
    protected abstract getLength(): number;

    /**
     * Determines whether the object contains a value at the specified index.
     * @param index An integer index greater than or equal to zero (`0`).
     */
    protected hasIndex(index: number): boolean {
        return index < this.getLength();
    }

    /**
     * Gets the value at the specified index.
     * @param index An integer index greater than or equal to zero (`0`).
     */
    protected abstract getIndex(index: number): T;

    /**
     * Sets the value at the specified index.
     * @param index An integer index greater than or equal to zero (`0`).
     * @param value The value to set for the specified index.
     * @returns `true` if the value could be set; otherwise, `false`.
     */
    protected setIndex(index: number, value: T): boolean {
        return false;
    }

    /**
     * Deletes the value at the specified index.
     * @param index An integer index greater than or equal to zero (`0`).
     * @returns `true` if the value was successfully deleted; otherwise, `false`.
     */
    protected deleteIndex(index: number): boolean {
        return false;
    }
}