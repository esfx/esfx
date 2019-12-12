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

import { ReadonlyCollection, Collection, ReadonlyKeyedCollection, KeyedCollection, ReadonlyIndexedCollection, IndexedCollection, FixedSizeIndexedCollection } from "@esfx/collection-core";

//
// Global augmentations
//

const accessorBase: PropertyDescriptor = { enumerable: false, configurable: true };
const methodBase: PropertyDescriptor = { ...accessorBase, writable: true };

// #region Array augmentations

declare global {
    interface ReadonlyArray<T> extends ReadonlyIndexedCollection<T> {}
    interface Array<T> extends IndexedCollection<T> {}
}

Object.defineProperties(Array.prototype, {
    // ReadonlyCollection<T>
    [Collection.size]: {
        ...accessorBase,
        get(this: any[]) { return this.length; }
    },
    [Collection.has]: {
        ...methodBase,
        value(this: any[], value: any) {
            return this.includes(value);
        }
    },

    // Collection<T>
    [Collection.add]: {
        ...methodBase,
        value(this: any[], value: any) {
            this.push(value);
        }
    },
    [Collection.delete]: {
        ...methodBase,
        value(this: any[], value: any) {
            const index = this.indexOf(value);
            if (index >= 0) {
                this.splice(index, 1);
                return true;
            }
            return false;
        }
    },
    [Collection.clear]: {
        ...methodBase,
        value(this: any[]) {
            this.length = 0;
        }
    },

    // ReadonlyIndexedCollection<T>
    [IndexedCollection.indexOf]: {
        ...methodBase,
        value(this: any[], value: any, fromIndex?: number) {
            return this.indexOf(value, fromIndex);
        }
    },
    [IndexedCollection.getAt]: {
        ...methodBase,
        value(this: any[], index: number) {
            return this[index];
        }
    },

    // FixedSizeIndexedCollection<T>
    [IndexedCollection.setAt]: {
        ...methodBase,
        value(this: any[], index: number, value: any) {
            this[index] = value;
            return true;
        }
    },

    // IndexedCollection<T>
    [IndexedCollection.insertAt]: {
        ...methodBase,
        value(this: any[], index: number, value: any) {
            this.splice(index, 0, value);
        }
    },
    [IndexedCollection.removeAt]: {
        ...methodBase,
        value(this: any[], index: number) {
            this.splice(index, 1);
        }
    },
});

// #endregion Array augmentations

// #region TypedArray augmentations

declare global {
    interface Uint8Array extends FixedSizeIndexedCollection<number> {}
    interface Uint8ClampedArray extends FixedSizeIndexedCollection<number> {}
    interface Uint16Array extends FixedSizeIndexedCollection<number> {}
    interface Uint32Array extends FixedSizeIndexedCollection<number> {}
    interface Int8Array extends FixedSizeIndexedCollection<number> {}
    interface Int16Array extends FixedSizeIndexedCollection<number> {}
    interface Int32Array extends FixedSizeIndexedCollection<number> {}
    interface Float32Array extends FixedSizeIndexedCollection<number> {}
    interface Float64Array extends FixedSizeIndexedCollection<number> {}
    interface BigUint64Array extends FixedSizeIndexedCollection<bigint> {}
    interface BigInt64Array extends FixedSizeIndexedCollection<bigint> {}
}

const typedArrays =
    typeof Uint8Array !== "function" ? [] :
    [Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array];

for (const TypedArray of typedArrays) {
    Object.defineProperties(TypedArray.prototype, {
        // ReadonlyCollection<T>
        [Collection.size]: {
            ...accessorBase,
            get(this: InstanceType<typeof TypedArray>) { return this.length; }
        },
        [Collection.has]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, value: any) {
                return this.includes(value);
            }
        },

        // ReadonlyIndexedCollection<T>
        [IndexedCollection.indexOf]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, value: any, fromIndex?: number) {
                return this.indexOf(value, fromIndex);
            }
        },
        [IndexedCollection.getAt]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, index: number) {
                return this[index];
            }
        },

        // FixedSizeIndexedCollection<T>
        [IndexedCollection.setAt]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, index: number, value: any) {
                if (index >= 0 && index < this.length) {
                    this[index] = value;
                    return true;
                }
                return false;
            }
        },
    });
}

const bigIntTypedArrays =
    typeof BigInt64Array !== "function" ? [] :
    [BigUint64Array, BigInt64Array];

for (const TypedArray of bigIntTypedArrays) {
    Object.defineProperties(TypedArray.prototype, {
        // ReadonlyCollection<T>
        [Collection.size]: {
            ...accessorBase,
            get(this: InstanceType<typeof TypedArray>) { return this.length; }
        },
        [Collection.has]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, value: any) {
                return this.includes(value);
            }
        },

        // ReadonlyIndexedCollection<T>
        [IndexedCollection.indexOf]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, value: any, fromIndex?: number) {
                return this.indexOf(value, fromIndex);
            }
        },
        [IndexedCollection.getAt]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, index: number) {
                return this[index];
            }
        },

        // FixedSizeIndexedCollection<T>
        [IndexedCollection.setAt]: {
            ...methodBase,
            value(this: InstanceType<typeof TypedArray>, index: number, value: any) {
                if (index >= 0 && index < this.length) {
                    this[index] = value;
                    return true;
                }
                return false;
            }
        },
    });
}

// #endregion TypedArray augmentations

// #region Set augmentations

declare global {
    interface ReadonlySet<T> extends ReadonlyCollection<T> {}
    interface Set<T> extends Collection<T> {}
}

if (typeof Set === "function") {
    Object.defineProperties(Set.prototype, {
        // ReadonlyCollection<T>
        [Collection.size]: {
            ...accessorBase,
            get(this: Set<any>) { return this.size; }
        },
        [Collection.has]: {
            ...methodBase,
            value(this: Set<any>, value: any) {
                return this.has(value);
            }
        },

        // Collection<T>
        [Collection.add]: {
            ...methodBase,
            value(this: Set<any>, value: any) {
                this.add(value);
            }
        },
        [Collection.delete]: {
            ...methodBase,
            value(this: Set<any>, value: any) {
                return this.delete(value);
            }
        },
        [Collection.clear]: {
            ...methodBase,
            value(this: Set<any>) {
                this.clear();
            }
        }
    });
}

// #endregion Set augmentations

// #region Map augmentations

declare global {
    interface ReadonlyMap<K, V> extends ReadonlyKeyedCollection<K, V> {}
    interface Map<K, V> extends KeyedCollection<K, V> {}
}

if (typeof Map === "function") {
    Object.defineProperties(Map.prototype, {
        // ReadonlyKeyedCollection<K, V>
        [KeyedCollection.size]: {
            ...accessorBase,
            get(this: Map<any, any>) { return this.size; }
        },
        [KeyedCollection.has]: {
            ...methodBase,
            value(this: Map<any, any>, key: any) {
                return this.has(key);
            }
        },
        [KeyedCollection.get]: {
            ...methodBase,
            value(this: Map<any, any>, key: any) {
                return this.get(key);
            }
        },
        [KeyedCollection.keys]: {
            ...methodBase,
            value(this: Map<any, any>) {
                return this.keys();
            }
        },
        [KeyedCollection.values]: {
            ...methodBase,
            value(this: Map<any, any>) {
                return this.values();
            }
        },

        // KeyedCollection<K, V>
        [KeyedCollection.set]: {
            ...methodBase,
            value(this: Map<any, any>, key: any, value: any) {
                this.set(key, value);
            }
        },
        [KeyedCollection.delete]: {
            ...methodBase,
            value(this: Map<any, any>, key: any) {
                return this.delete(key);
            }
        },
        [KeyedCollection.clear]: {
            ...methodBase,
            value(this: Map<any, any>) {
                this.clear();
            }
        },
    });
}
// #endregion Map augmentations
