/*!
   Copyright 2020 Ron Buckton

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

import * as assert from "@esfx/internal-assert";
import { Equatable, Equaler } from "@esfx/equatable";

/**
 * Represents an ordinal index within an indexed collection.
 */
export class Index implements Equatable {
    private _value: number;
    private _isFromEnd: boolean;

    constructor(value: number, isFromEnd = false) {
        assert.mustBePositiveInteger(value, "value");
        this._value = value;
        this._isFromEnd = !!isFromEnd;
    }

    /**
     * Gets an `Index` representing the first element of an indexed collection.
     */
    static get start() { return new Index(0, /*isFromEnd*/ false); }

    /**
     * Gets an `Index` representing the last element of an indexed collection.
     */
    static get end() { return new Index(0, /*isFromEnd*/ true); }

    /**
     * Gets the value for the index.
     */
    get value() { return this._value; }

    /**
     * Gets a value indicating whether the index value is relative to the end of the collection.
     */
    get isFromEnd() { return this._isFromEnd; }

    /**
     * Creates an index relative to the start of an indexed collection.
     */
    static fromStart(value: number) {
        return new Index(value, /*isFromEnd*/ false);
    }

    /**
     * Creates an index relative to the end of an indexed collection.
     */
    static fromEnd(value: number) {
        return new Index(value, /*isFromEnd*/ true);
    }

    /**
     * Computes the index based on a fixed length.
     * @param length The number of elements in the collection.
     */
    getIndex(length: number) {
        assert.mustBePositiveInteger(length, "length");
        return this._isFromEnd ? length - this._value : this._value;
    }

    toString() {
        return `${this._isFromEnd ? "^" : ""}${this._value}`;
    }

    equals(other: Index) {
        return this._value === other._value
            && this._isFromEnd === other._isFromEnd;
    }

    hash(): number {
        return Equaler.combineHashes(
            Equaler.defaultEqualer.hash(this._value),
            Equaler.defaultEqualer.hash(this._isFromEnd));
    }

    [Equatable.equals](other: unknown) {
        return other instanceof Index && this.equals(other);
    }

    [Equatable.hash]() {
        return this.hash();
    }
}

function isIndex(value: unknown): value is Index {
    return value instanceof Index;
}

/**
 * Represents an interval within an indexed collection.
 */
export class Interval {
    private _start: Index;
    private _end: Index;
    private _step: number;

    /**
     * Creates a new `Interval`.
     * @param start The start of the interval (inclusive).
     * @param end The end of the interval (exclusive).
     * @param step The number of elements to advance when stepping through an indexed collection (default: `1`).
     */
    constructor(start: number | Index, end: number | Index, step = 1) {
        if (typeof start === "number") start = Index.fromStart(start);
        if (typeof end === "number") end = Index.fromStart(end);
        assert.mustBeType(isIndex, start, "start");
        assert.mustBeType(isIndex, end, "end");
        assert.mustBePositiveNonZeroFiniteNumber(step, "step");
        this._start = start;
        this._end = end;
        this._step = step;
    }

    /**
     * Gets an `Interval` that represents every element of a collection.
     */
    static get all() { return new Interval(Index.start, Index.end); }

    /**
     * Gets an `Index` that represents the start of the interval (inclusive).
     */
    get start() { return this._start; }

    /**
     * Gets an `Index` that represents the end of the interval (exclusive).
     */
    get end() { return this._end; }

    /**
     * Gets the number of elements to advance when stepping through an indexed collection.
     */
    get step() { return this._step; }

    /**
     * Creates a new `Interval` between the specified index (inclusive) and the end of the indexed collection.
     */
    static startAt(index: number | Index) {
        return new Interval(index, Index.end);
    }

    /**
     * Creates a new `Interval` between the specified index (exclusive) and the start of the indexed collection.
     */
    static endAt(index: number | Index) {
        return new Interval(Index.start, index);
    }

    /**
     * Calculates the start and end offsets given the length of an indexed collection.
     * @returns A tuple of `[start, end, step]`.
     */
    getIndices(length: number): [number, number, number] {
        assert.mustBePositiveInteger(length, "length");
        const start = this._start.getIndex(length);
        const end = this._end.getIndex(length);
        const step = end < start ? -this._step : this._step;
        return [start, end, step];
    }

    [Symbol.iterator]() {
        return this.values();
    }

    /**
     * Yields each offset within the interval given the length of an indexed collection.
     */
    * values(length: number = 0) {
        const [start, end, step] = this.getIndices(length);
        for (let i = start; step < i ? i > end : i < end; i+= step) {
            yield i;
        }
    }

    toString() {
        return `${this._start}:${this._end}${this._step === 1 ? "" : `:${this._step}`}`;
    }

    equals(other: Interval) {
        return this._start.equals(other._start)
            && this._end.equals(other._end)
            && this._step === other._step;
    }

    hash() {
        let hc = this._start.hash();
        hc = Equaler.combineHashes(hc, this._end.hash());
        hc = Equaler.combineHashes(hc, Equaler.defaultEqualer.hash(this._step));
        return hc;
    }

    [Equatable.equals](other: unknown) {
        return other instanceof Interval && this.equals(other);
    }

    [Equatable.hash]() {
        return this.hash();
    }
}
