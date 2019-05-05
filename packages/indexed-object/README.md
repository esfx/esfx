# `@esfx/indexed-object`

The `@esfx/indexed-object` package provides a A base class for custom integer-indexed collections.

The underlying implementation uses a `Proxy` to trap integer indexes in a fashion similar to
the [Integer-Indexed Exotic Object](https://tc39.github.io/ecma262/#integer-indexed-exotic-object) 
in the ECMAScript specification.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/indexed-object
```

# Usage

```ts
import { IntegerIndexedObject } from "indexed-object";

class BooleansCollection extends IntegerIndexedObject {
    getLength() {
        return 2;
    }
    getIndex(index) {
        switch (index) {
            case 0: return false;
            case 1: return true;
            default: return undefined;
        }
    }
    // hasIndex(index): boolean
    // setIndex(index, value): boolean
    // deleteIndex(index): boolean
}

const booleans = new BooleansCollection();
console.log(booleans[0]); // false
console.log(booleans[1]); // true
```

# API

```ts
/**
 * Represents an object that can be indexed by an integer value similar to a native
 * Array or TypedArray.
 */
export declare abstract class IntegerIndexedObject<T> {
    constructor();
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
    protected hasIndex(index: number): boolean;
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
    protected setIndex(index: number, value: T): boolean;
    /**
     * Deletes the value at the specified index/
     * @param index An integer index greater than or equal to zero (`0`).
     * @returns `true` if the value was successfully deleted; otherwise, `false`.
     */
    protected deleteIndex(index: number): boolean;
}
```