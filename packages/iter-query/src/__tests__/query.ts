/// <reference types="../../../../internal/jest-sequence" />

import { Lookup } from "@esfx/iter-lookup";
import { Query } from "../";
import * as users from "./data/users";
import * as nodes from "./data/nodes";
import * as books from "./data/books";
import { Comparable } from '@esfx/equatable';
import { HashSet } from '@esfx/collections-hashset';
import { HashMap } from '@esfx/collections-hashmap';

describe("Query", () => {
    // Query
    describe("constructor()", () => {
        it("Iterable", () => expect(new Query([1, 2, 3])).toEqualSequence([1, 2, 3]));
        it.each`
            type           | source       | error
            ${"undefined"} | ${undefined} | ${TypeError}
            ${"null"}      | ${null}      | ${TypeError}
            ${"function"}  | ${() => {}}  | ${TypeError}
        `("throws if 'source' is $type", ({ source, error }) => expect(() => new Query(source)).toThrow(error));
    });
    describe("from()", () => {
        it("Iterable", () => expect(Query.from([1, 2, 3])).toEqualSequence([1, 2, 3]));
        it.each`
            type           | source       | error
            ${"undefined"} | ${undefined} | ${TypeError}
            ${"null"}      | ${null}      | ${TypeError}
            ${"function"}  | ${() => {}}  | ${TypeError}
        `("throws if 'source' is $type", ({ source, error }) => expect(() => Query.from(source)).toThrow(error));
    });
    describe("of()", () => {
        it("no arguments", () => expect(Query.of()).toEqualSequence([]));
        it("multiple arguments", () => expect(Query.of(1, 2, 3)).toEqualSequence([1, 2, 3]));
    });
    describe("empty()", () => {
        it("is empty", () => expect(Query.empty()).toEqualSequence([]));
    });
    describe("once()", () => {
        it("is once", () => expect(Query.once(1)).toEqualSequence([1]));
    });
    describe("repeat()", () => {
        it("0 times", () => expect(Query.repeat("a", 0)).toEqualSequence([]));
        it("5 times", () => expect(Query.repeat("a", 5)).toEqualSequence(["a", "a", "a", "a", "a"]));
        it.each`
            type            | count         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ count, error }) => expect(() => Query.repeat("a", count)).toThrow(error));
    });
    describe("range()", () => {
        it("same", () => expect(Query.range(1, 1)).toEqualSequence([1]));
        it("low to high", () => expect(Query.range(1, 3)).toEqualSequence([1, 2, 3]));
        it("low to high by 2", () => expect(Query.range(1, 3, 2)).toEqualSequence([1, 3]));
        it("high to low", () => expect(Query.range(3, 1)).toEqualSequence([3, 2, 1]));
        it("high to low by 2", () => expect(Query.range(3, 1, 2)).toEqualSequence([3, 1]));
        it.each`
            type            | value         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'start' is $type", ({ value, error }) => expect(() => Query.range(value, 3)).toThrow(error));
        it.each`
            type            | value         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'end' is $type", ({ value, error }) => expect(() => Query.range(1, value)).toThrow(error));
        it.each`
            type            | value         | error
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"0"}          | ${0}          | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'increment' is $type", ({ value, error }) => expect(() => Query.range(1, 3, value)).toThrow(error));
    });
    describe("continuous()", () => {
        it("after 5 elements", () => expect(Query.continuous(1)).toStartWithSequence([1, 1, 1, 1, 1]));
        it("after 10 elements", () => expect(Query.continuous(1)).toStartWithSequence([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
    });
    describe("generate()", () => {
        it("even numbers", () => expect(Query.generate(3, i => i * 2)).toEqualSequence([0, 2, 4]));
        it.each`
            type            | value         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => Query.generate(value, () => {})).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'generator' is $type", ({ value, error }) => expect(() => Query.generate(1, value)).toThrow(error));
    });
    describe("consume()", () => {
        it("consumes", () => {
            const q = Query.consume(function* () { yield 1; } ());
            expect(q).toEqualSequence([1]);
            expect(q).toEqualSequence([]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterator"} | ${{}}         | ${TypeError}
        `("throws if 'iterator' is $type", ({ value, error }) => expect(() => Query.consume(value)).toThrow(error));
    });
    // describe("objectKeys()", () => {
    //     it("gets keys", () => expect(Query.objectKeys({ a: 1, b: 2 })).toEqualSequence(["a", "b"]));
    //     theory.throws("throws if 'source' is", (source: any) => Query.objectKeys(source), {
    //         "undefined": [TypeError, undefined],
    //         "null": [TypeError, null],
    //         "non-object": [TypeError, ""]
    //     });
    // });
    // describe("objectValues()", () => {
    //     it("gets values", () => expect(Query.objectValues({ a: 1, b: 2 })).toEqualSequence([1, 2]));
    //     theory.throws("throws if 'source' is", (source: any) => Query.objectValues(source), {
    //         "undefined": [TypeError, undefined],
    //         "null": [TypeError, null],
    //         "non-object": [TypeError, ""]
    //     });
    // });
    // describe("objectEntries()", () => {
    //     it("gets keys", () => expect(Query.objectEntries({ a: 1, b: 2 }).toArray()).toEqual([["a", 1], ["b", 2]]));
    //     theory.throws("throws if 'source' is", (source: any) => Query.objectEntries(source), {
    //         "undefined": [TypeError, undefined],
    //         "null": [TypeError, null],
    //         "non-object": [TypeError, ""]
    //     });
    // });
    // Subquery
    describe("filter()", () => {
        it("filters", () => expect(Query.from([1, 2, 3]).filter(x => x >= 2)).toEqualSequence([2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).filter(value)).toThrow(error));
    });
    describe("filterDefined()", () => {
        it("filterDefined()", () => expect(Query.from([1, undefined, 2]).filterDefined()).toEqualSequence([1, 2]));
    });
    describe("map()", () => {
        it("maps", () => expect(Query.from([1, 2, 3]).map(x => x * 2)).toEqualSequence([2, 4, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => Query.from([]).map(value)).toThrow(error));
    });
    describe("flatMap()", () => {
        it("flatMaps", () => expect(Query.from([1, 2, 3]).flatMap(x => [x, 0])).toEqualSequence([1, 0, 2, 0, 3, 0]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'projection' is $type", ({ value, error }) => expect(() => Query.from([]).flatMap(value)).toThrow(error));
    });
    describe("tap()", () => {
        it("taps", () => {
            const received: number[] = [];
            const result = Query.from([1, 2, 3, 4]).tap(v => received.push(v));
            expect(result).toEqualSequence([1, 2, 3, 4]);
            expect(received).toEqual([1, 2, 3, 4]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).tap(value)).toThrow(error));
    });
    describe("reverse()", () => {
        it("reverses", () => expect(Query.from([1, 2, 3]).reverse()).toEqualSequence([3, 2, 1]));
    });
    describe("skip()", () => {
        it("skips", () => expect(Query.from([1, 2, 3]).skip(1)).toEqualSequence([2, 3]));
        it("skip none", () => expect(Query.from([1, 2, 3]).skip(0)).toEqualSequence([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => Query.from([]).skip(value)).toThrow(error));
    });
    describe("skipRight()", () => {
        it("skips right", () => expect(Query.from([1, 2, 3]).skipRight(1)).toEqualSequence([1, 2]));
        it("skips right none", () => expect(Query.from([1, 2, 3]).skipRight(0)).toEqualSequence([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => Query.from([]).skip(value)).toThrow(error));
    });
    describe("skipWhile()", () => {
        it("skips while", () => expect(Query.from([1, 2, 1, 3]).skipWhile(x => x < 2)).toEqualSequence([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).skipWhile(value)).toThrow(error));
    });
    describe("skipUntil()", () => {
        it("skips until", () => expect(Query.from([1, 2, 1, 3]).skipUntil(x => x >= 2)).toEqualSequence([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).skipUntil(value)).toThrow(error));
    });
    describe("take()", () => {
        it("takes", () => expect(Query.from([1, 2, 3]).take(2)).toEqualSequence([1, 2]));
        it("takes none", () => expect(Query.from([1, 2, 3]).take(0)).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => Query.from([]).take(value)).toThrow(error));
    });
    describe("takeRight()", () => {
        it("takes right", () => expect(Query.from([1, 2, 3]).takeRight(2)).toEqualSequence([2, 3]));
        it("takes right none", () => expect(Query.from([1, 2, 3]).takeRight(0)).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => Query.from([]).takeRight(value)).toThrow(error));
    });
    describe("takeWhile()", () => {
        it("takes while", () => expect(Query.from([1, 2, 3, 1]).takeWhile(x => x < 3)).toEqualSequence([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).takeWhile(value)).toThrow(error));
    });
    describe("takeUntil()", () => {
        it("takes until", () => expect(Query.from([1, 2, 3, 1]).takeUntil(x => x >= 3)).toEqualSequence([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).takeUntil(value)).toThrow(error));
    });
    describe("intersect()", () => {
        it("intersects", () => expect(Query.from([1, 1, 2, 3, 4]).intersect([1, 3, 3, 5, 7])).toEqualSequence([1, 3]));
        it("intersects none", () => expect(Query.from([1, 1, 2, 3, 4]).intersect([])).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).intersect(value)).toThrow(error));
    });
    describe("union()", () => {
        it("unions", () => expect(Query.from([1, 1, 2, 3, 4]).union([1, 3, 3, 5, 7])).toEqualSequence([1, 2, 3, 4, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).union(value)).toThrow(error));
    });
    describe("except()", () => {
        it("excepts", () => expect(Query.from([1, 1, 2, 3, 4]).except([2, 4, 5])).toEqualSequence([1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).except(value)).toThrow(error));
    });
    describe("symmetricDifference()", () => {
        it("symmetricDifference", () => expect(Query.from([1, 1, 2, 3, 4]).symmetricDifference([2, 4, 5])).toEqualSequence([1, 3, 5]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).symmetricDifference(value)).toThrow(error));
    });
    describe("concat()", () => {
        it("concats", () => expect(Query.from([1, 1, 2, 3, 4]).concat([1, 3, 3, 5, 7])).toEqualSequence([1, 1, 2, 3, 4, 1, 3, 3, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).concat(value)).toThrow(error));
    });
    describe("distinct()", () => {
        it("is distinct", () => expect(Query.from([1, 1, 2, 3, 4]).distinct()).toEqualSequence([1, 2, 3, 4]));
    });
    describe("append()", () => {
        it("appends", () => expect(Query.from([1, 2, 3]).append(5)).toEqualSequence([1, 2, 3, 5]));
    });
    describe("prepend()", () => {
        it("prepends", () => expect(Query.from([1, 2, 3]).prepend(5)).toEqualSequence([5, 1, 2, 3]));
    });
    describe("patch()", () => {
        it.each`
            start   | skip  | range         | expected
            ${0}    | ${0}  | ${[9, 8, 7]}  | ${[9, 8, 7, 1, 2, 3]}
            ${0}    | ${2}  | ${[9, 8, 7]}  | ${[9, 8, 7, 3]}
            ${2}    | ${0}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7, 3]}
            ${5}    | ${0}  | ${[9, 8, 7]}  | ${[1, 2, 3, 9, 8, 7]}
            ${2}    | ${1}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7]}
            ${2}    | ${3}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7]}
        `("patches with ($start, $skip, $range)", ({ start, skip, range, expected }) => expect(Query.from([1, 2, 3]).patch(start, skip, range)).toEqualSequence(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'start' is $type", ({ value, error }) => expect(() => Query.from([]).patch(value, 0, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'skipCount' is $type", ({ value, error }) => expect(() => Query.from([]).patch(0, value, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'range' is $type", ({ value, error }) => expect(() => Query.from([]).patch(0, 0, value)).toThrow(error));
    });
    describe("defaultIfEmpty()", () => {
        it("not empty", () => expect(Query.from([1, 2, 3]).defaultIfEmpty(9)).toEqualSequence([1, 2, 3]));
        it("empty", () => expect(Query.from<number>([]).defaultIfEmpty(9)).toEqualSequence([9]));
    });
    describe("pageBy()", () => {
        it("pages with partial last page", () => expect(Query.from([1, 2, 3]).pageBy(2).map(x => Array.from(x)).toArray()).toEqual([[1, 2], [3]]));
        it("pages exact", () => expect(Query.from([1, 2, 3, 4]).pageBy(2).map(x => Array.from(x)).toArray()).toEqual([[1, 2], [3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"0"}            | ${0}          | ${RangeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'pageSize' is $type", ({ value, error }) => expect(() => Query.from([]).pageBy(value)).toThrow(error));
    });
    describe("spanMap()", () => {
        it("odd/even spans", () => expect(Query.from([1, 3, 2, 4, 5, 7]).spanMap(k => k % 2 === 1).map(g => Array.from(g)).toArray()).toEqual([[1, 3], [2, 4], [5, 7]]));
        it("empty", () => expect(Query.from([]).spanMap(k => k % 2 === 1)).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).spanMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).spanMap(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'spanSelector' is $type", ({ value, error }) => expect(() => Query.from([]).spanMap(x => x, x => x, value)).toThrow(error));
    });
    describe("groupBy()", () => {
        it("group by role", () => expect(Query.from(users.users).groupBy(u => u.role, u => u.name, (role, names) => ({ role: role, names: names.toArray() })).toArray())
            .toEqual([
                { role: "admin", names: ["alice"] },
                { role: "user", names: ["bob", "dave"] }
            ]));
        it("group by symbol", () => {
            const sym = Symbol();
            const data = [
                { category: "a", value: 1 },
                { category: "a", value: 2 },
                { category: "a", value: 3 },
                { category: sym, value: 4 }
            ];
            expect(Query.from(data).groupBy(row => row.category, row => row.value, (category, values) => ({ category, values: values.toArray() })).toArray())
                .toEqual([
                    { category: "a", values: [1, 2, 3] },
                    { category: sym, values: [4] }
                ]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupBy(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupBy(x => x, x => x, value)).toThrow(error));
    });
    describe("scan()", () => {
        it("scans sums", () => expect(Query.from([1, 2, 3]).scan((c, e) => c + e, 0)).toEqualSequence([1, 3, 6]));
        it("scans sums no seed", () => expect(Query.from([1, 2, 3]).scan((c, e) => c + e)).toEqualSequence([3, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => Query.from([]).scan(value)).toThrow(error));
    });
    describe("scanRight()", () => {
        it("scans sums from right", () => expect(Query.from([1, 2, 3]).scanRight((c, e) => c + e, 0)).toEqualSequence([3, 5, 6]));
        it("scans sums from right no seed", () => expect(Query.from([1, 2, 3]).scanRight((c, e) => c + e)).toEqualSequence([5, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => Query.from([]).scanRight(value)).toThrow(error));
    });
    describe("through()", () => {
        it("pipes through", () => expect(Query.from([1, 2]).through(q => {
            expect(q).toEqualSequence([1, 2]);
            return Query.from([3, 4]);
        })).toEqualSequence([3, 4]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).through(value)).toThrow(error));
    });
    describe("materialize()", () => {
        it("materializes", () => {
            const received: number[] = [];
            const q = Query.from([1, 2, 3, 4]).tap(x => received.push(x)).materialize();
            expect(q).toEqualSequence([1, 2, 3, 4]);
            expect(received).toEqual([1, 2, 3, 4]);
        });
    });
    // Joins
    describe("groupJoin()", () => {
        it("joins groups", () => expect(Query.from(users.roles).groupJoin(users.users, g => g.name, u => u.role, (role, users) => ({ role: role, users: users.toArray() })).toArray())
            .toEqual([
                { role: users.adminRole, users: [users.aliceUser] },
                { role: users.userRole, users: [users.bobUser, users.daveUser] },
                { role: users.guestRole, users: [] }
            ]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => Query.from([]).groupJoin(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupJoin([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupJoin([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).groupJoin([], x => x, x => x, value)).toThrow(error));
    });
    describe("join()", () => {
        it("joins", () => expect(Query.from(users.roles).join(users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user })).toArray())
            .toEqual([
                { role: users.adminRole, user: users.aliceUser },
                { role: users.userRole, user: users.bobUser },
                { role: users.userRole, user: users.daveUser }
            ]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => Query.from([]).join(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).join([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).join([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).join([], x => x, x => x, value)).toThrow(error));
    });
    describe("fullJoin()", () => {
        it("joins", () => expect(Query.from(users.roles).fullJoin(users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user })).toArray())
            .toEqual([
                { role: users.adminRole, user: users.aliceUser },
                { role: users.userRole, user: users.bobUser },
                { role: users.userRole, user: users.daveUser },
                { role: users.guestRole, user: undefined }
            ]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => Query.from([]).fullJoin(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).fullJoin([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => Query.from([]).fullJoin([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).fullJoin([], x => x, x => x, value)).toThrow(error));
    });
    describe("zip()", () => {
        it.each`
            left            | right                 | expected
            ${[1, 2, 3]}    | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"], [3, "c"]]}
            ${[1, 2]}       | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"]]}
            ${[1, 2, 3]}    | ${["a", "b"]}         | ${[[1, "a"], [2, "b"]]}
        `("zips with $left, $right", ({ left, right, expected }) => expect(Query.from(left).zip(right).toArray()).toEqual(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'right' is $type", ({ value, error }) => expect(() => Query.from([]).zip(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => Query.from([]).zip([], value)).toThrow(error));
    });
    // Ordering
    describe("orderBy()", () => {
        it("orders", () => expect(Query.from([3, 1, 2]).orderBy(x => x)).toEqualSequence([1, 2, 3]));
        it("orders same", () => {
            const q = Query.from(books.books_same).orderBy(x => x.title).toArray();
            expect(q[0]).toBe(books.bookB2);
            expect(q[1]).toBe(books.bookB2_same);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(x => x, value)).toThrow(error));
    });
    describe("orderByDescending()", () => {
        it("orders", () => expect(Query.from([3, 1, 2]).orderByDescending(x => x)).toEqualSequence([3, 2, 1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).orderByDescending(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).orderByDescending(x => x, value)).toThrow(error));
    });
    // Scalars
    describe("reduce()", () => {
        it("reduces sum", () => expect(Query.from([1, 2, 3]).reduce((c, e) => c + e)).toBe(6));
        it("reduces average", () => expect(Query.from([1, 2, 3]).reduce((c, e) => c + e, 0, (r, c) => r / c)).toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => Query.from([]).reduce(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).reduce(x => x, undefined, value)).toThrow(error));
    });
    describe("reduceRight()", () => {
        it("reduces sum", () => expect(Query.from([1, 2, 3]).reduceRight((c, e) => c + e)).toBe(6));
        it("reduces average", () => expect(Query.from([1, 2, 3]).reduceRight((c, e) => c + e, 0, (r, c) => r / c)).toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => Query.from([]).reduceRight(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => Query.from([]).reduceRight(x => x, undefined, value)).toThrow(error));
    });
    describe("count()", () => {
        it("counts array", () => expect(Query.from([1, 2, 3]).count()).toBe(3));
        it("counts set", () => expect(Query.from(new Set([1, 2, 3])).count()).toBe(3));
        it("counts map", () => expect(Query.from(new Set([1, 2, 3])).count()).toBe(3));
        it("counts range", () => expect(Query.range(1, 3).count()).toBe(3));
        it("counts odds", () => expect(Query.from([1, 2, 3]).count(x => x % 2 === 1)).toBe(2));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).count(value)).toThrow(error));
    });
    describe("first()", () => {
        it("finds first", () => expect(Query.from([1, 2, 3]).first()).toBe(1));
        it("finds first even", () => expect(Query.from([1, 2, 3, 4]).first(x => x % 2 === 0)).toBe(2));
        it("finds undefined when empty", () => expect(Query.from([]).first()).toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).first(value)).toThrow(error));
    });
    describe("last()", () => {
        it("finds last", () => expect(Query.from([1, 2, 3]).last()).toBe(3));
        it("finds last odd", () => expect(Query.from([1, 2, 3, 4]).last(x => x % 2 === 1)).toBe(3));
        it("finds undefined when empty", () => expect(Query.from([]).last()).toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).last(value)).toThrow(error));
    });
    describe("single()", () => {
        it("finds single", () => expect(Query.from([1]).single()).toBe(1));
        it("finds undefined when many", () => expect(Query.from([1, 2, 3]).single()).toBeUndefined());
        it("finds undefined when empty", () => expect(Query.from([]).single()).toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).single(value)).toThrow(error));
    });
    describe("min()", () => {
        it("finds minimum", () => expect(Query.from([5, 6, 3, 9, 4]).min()).toBe(3));
        it("finds undefined when empty", () => expect(Query.from([]).min()).toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            expect(Query.from([a, b]).min()).toBe(a);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).min(value)).toThrow(error));
    });
    describe("max()", () => {
        it("finds maximum", () => expect(Query.from([5, 6, 3, 9, 4]).max()).toBe(9));
        it("finds undefined when empty", () => expect(Query.from([]).max()).toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            expect(Query.from([a, b]).max()).toBe(b);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).max(value)).toThrow(error));
    });
    describe("sum()", () => {
        it("calculates sum", () => expect(Query.from([1, 2, 3]).sum()).toBe(6));
        it("calculates sum using projection", () => expect(Query.from(["1", "2", "3"]).sum(x => +x)).toBe(6));
        it("calculates zero sum when empty", () => expect(Query.from([]).sum()).toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).sum(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(() => Query.from([value]).sum()).toThrow(error));
    });
    describe("average()", () => {
        it("calculates average", () => expect(Query.from([1, 2, 3]).average()).toBe(2));
        it("calculates average using projection", () => expect(Query.from(["1", "2", "3"]).average(x => +x)).toBe(2));
        it("calculates zero average when empty", () => expect(Query.from([]).average()).toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).average(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(() => Query.from([value]).average()).toThrow(error));
    });
    describe("some()", () => {
        it("false when empty", () => expect(Query.from([]).some()).toBe(false));
        it("true when one or more", () => expect(Query.from([1]).some()).toBe(true));
        it("false when no match", () => expect(Query.from([1, 3]).some(x => x === 2)).toBe(false));
        it("true when matched", () => expect(Query.from([1, 3]).some(x => x === 3)).toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).some(value)).toThrow(error));
    });
    describe("every()", () => {
        it("false when empty", () => expect(Query.from([]).every(x => x % 2 === 1)).toBe(false));
        it("false when no match", () => expect(Query.from([2, 4]).every(x => x % 2 === 1)).toBe(false));
        it("false when partial match", () => expect(Query.from([1, 2]).every(x => x % 2 === 1)).toBe(false));
        it("true when fully matched", () => expect(Query.from([1, 3]).every(x => x % 2 === 1)).toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).every(value)).toThrow(error));
    });
    describe("corresponds()", () => {
        it("true when both match", () => expect(Query.from([1, 2, 3]).corresponds([1, 2, 3])).toBe(true));
        it("false when source has fewer elements", () => expect(Query.from([1, 2]).corresponds([1, 2, 3])).toBe(false));
        it("false when other has fewer elements", () => expect(Query.from([1, 2, 3]).corresponds([1, 2])).toBe(false));
        it("false when other has elements in different order", () => expect(Query.from([1, 2, 3]).corresponds([1, 3, 2])).toBe(false));
        it("false when other has different elements", () => expect(Query.from([1, 2, 3]).corresponds([1, 2, 4])).toBe(false));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).corresponds(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => Query.from([]).corresponds([], value)).toThrow(error));
    });
    describe("includes()", () => {
        it("true when present", () => expect(Query.from([1, 2, 3]).includes(2)).toBe(true));
        it("false when missing", () => expect(Query.from([1, 2, 3]).includes(4)).toBe(false));
        it("false when empty", () => expect(Query.from<number>([]).includes(4)).toBe(false));
    });
    describe("includesSequence()", () => {
        it("true when included", () => expect(Query.from([1, 2, 3, 4]).includesSequence([2, 3])).toBe(true));
        it("false when wrong order", () => expect(Query.from([1, 2, 3, 4]).includesSequence([3, 2])).toBe(false));
        it("false when not present", () => expect(Query.from([1, 2, 3, 4]).includesSequence([5, 6])).toBe(false));
        it("false when source empty", () => expect(Query.from<number>([]).includesSequence([1, 2])).toBe(false));
        it("true when other empty", () => expect(Query.from([1, 2, 3, 4]).includesSequence([])).toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).includesSequence(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => Query.from([]).includesSequence([], value)).toThrow(error));
    });
    describe("startsWith()", () => {
        it("true when starts with other", () => expect(Query.from([1, 2, 3, 4]).startsWith([1, 2])).toBe(true));
        it("false when not at start", () => expect(Query.from([1, 2, 3, 4]).startsWith([2, 3])).toBe(false));
        it("false when wrong order", () => expect(Query.from([1, 2, 3, 4]).startsWith([2, 1])).toBe(false));
        it("false when not present", () => expect(Query.from([1, 2, 3, 4]).startsWith([5, 6])).toBe(false));
        it("false when source empty", () => expect(Query.from<number>([]).startsWith([1, 2])).toBe(false));
        it("true when other empty", () => expect(Query.from([1, 2, 3, 4]).startsWith([])).toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).startsWith(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => Query.from([]).startsWith([], value)).toThrow(error));
    });
    describe("endsWith()", () => {
        it("true when ends with other", () => expect(Query.from([1, 2, 3, 4]).endsWith([3, 4])).toBe(true));
        it("false when not at end", () => expect(Query.from([1, 2, 3, 4]).endsWith([2, 3])).toBe(false));
        it("false when wrong order", () => expect(Query.from([1, 2, 3, 4]).endsWith([4, 3])).toBe(false));
        it("false when not present", () => expect(Query.from([1, 2, 3, 4]).endsWith([5, 6])).toBe(false));
        it("false when source empty", () => expect(Query.from<number>([]).endsWith([1, 2])).toBe(false));
        it("true when other empty", () => expect(Query.from([1, 2, 3, 4]).endsWith([])).toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => Query.from([]).endsWith(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => Query.from([]).endsWith([], value)).toThrow(error));
    });
    describe("elementAt()", () => {
        it("at offset 0", () => expect(Query.from([1, 2, 3]).elementAt(0)).toBe(1));
        it("at offset 1", () => expect(Query.from([1, 2, 3]).elementAt(1)).toBe(2));
        it("at offset -1", () => expect(Query.from([1, 2, 3]).elementAt(-1)).toBe(3));
        it("at offset -2", () => expect(Query.from([1, 2, 3]).elementAt(-2)).toBe(2));
        it("at offset greater than size", () => expect(Query.from([1, 2, 3]).elementAt(3)).toBeUndefined());
        it("at negative offset greater than size", () => expect(Query.from([1, 2, 3]).elementAt(-4)).toBeUndefined());
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => Query.from([]).elementAt(value)).toThrow(error));
    });
    describe("span()", () => {
        it("gets initial span", () => expect(Query.from([1, 2, 3, 4]).span(x => x < 3).map(x => x.toArray())).toEqual([[1, 2], [3, 4]]));
        it("gets whole source", () => expect(Query.from([1, 2, 3, 4]).span(x => x < 5).map(x => x.toArray())).toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", () => expect(Query.from([1, 2, 3, 4]).span(x => x < 1).map(x => x.toArray())).toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).span(value)).toThrow(error));
    });
    describe("spanUntil()", () => {
        it("gets initial span", () => expect(Query.from([1, 2, 3, 4]).spanUntil(x => x > 2).map(x => x.toArray())).toEqual([[1, 2], [3, 4]]));
        it("gets whole source", () => expect(Query.from([1, 2, 3, 4]).spanUntil(x => x > 4).map(x => x.toArray())).toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", () => expect(Query.from([1, 2, 3, 4]).spanUntil(x => x > 0).map(x => x.toArray())).toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([]).spanUntil(value)).toThrow(error));
    });
    describe("forEach()", () => {
        it("called for each item", () => {
            const received: number[] = [];
            Query.from([1, 2, 3, 4]).forEach(v => received.push(v));
            expect(received).toEqual([1, 2, 3, 4]);
        });
        // node's for..of does not call return :/
        it("close iterator on error", () => {
            let returnWasCalled = false;
            const iterator: IterableIterator<number> = {
                [Symbol.iterator]() { return this; },
                next() { return { value: 1, done: false } },
                return() { returnWasCalled = true; return { value: undefined, done: true } }
            };
            const error = new Error();
            expect(() => Query.from(iterator).forEach(() => { throw error; })).toThrow(error);
            expect(returnWasCalled).toBe(true);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => Query.from([]).forEach(value)).toThrow(error));
    });
    describe("unzip()", () => {
        it("unzips", () => expect(Query.from([[1, "a"], [2, "b"]] as [number, string][]).unzip()).toEqual([[1, 2], ["a", "b"]]));
    });
    describe("toArray()", () => {
        it("creates array", () => expect(Query.from([1, 2, 3, 4]).toArray()).toEqual([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).toArray(value)).toThrow(error));
    });
    describe("toSet()", () => {
        it("result is a Set", () => expect(Query.from([1, 2, 3, 4]).toSet()).toBeInstanceOf(Set));
        it("creates with right size", () => expect(Query.from([1, 2, 3, 4]).toSet().size).toBe(4));
        it("creates set in order", () => expect(Query.from([1, 2, 3, 4]).toSet()).toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).toSet(value)).toThrow(error));
    });
    describe("toHashSet()", () => {
        it("result is a HashSet", () => expect(Query.from([1, 2, 3, 4]).toHashSet()).toBeInstanceOf(HashSet));
        it("creates with right size", () => expect(Query.from([1, 2, 3, 4]).toHashSet().size).toBe(4));
        it("creates set in order", () => expect(Query.from([1, 2, 3, 4]).toHashSet()).toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'equaler' is $type", ({ value, error }) => expect(() => Query.from([]).toHashSet(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equaler' is $type", ({ value, error }) => expect(() => Query.from([]).toHashSet(x => x, value)).toThrow(error));
    });
    describe("toMap()", () => {
        it("result is a Map", () => expect(Query.from([1, 2, 3, 4]).toMap(x => x)).toBeInstanceOf(Map));
        it("creates with right size", () => expect(Query.from([1, 2, 3, 4]).toMap(x => x).size).toBe(4));
        it("creates with correct keys", () => expect(Query.from([1, 2, 3, 4]).toMap(x => x * 2).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).toMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).toMap(x => x, value)).toThrow(error));
    });
    describe("toHashMap()", () => {
        it("result is a HashMap", () => expect(Query.from([1, 2, 3, 4]).toHashMap(x => x)).toBeInstanceOf(HashMap));
        it("creates with right size", () => expect(Query.from([1, 2, 3, 4]).toHashMap(x => x).size).toBe(4));
        it("creates with correct keys", () => expect(Query.from([1, 2, 3, 4]).toHashMap(x => x * 2).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).toHashMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => Query.from([]).toHashMap(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => Query.from([]).toHashMap(x => x, x => x, value)).toThrow(error));
    });
    describe("toLookup()", () => {
        it("result is a Lookup", () => expect(Query.from([1, 2, 3, 4]).toLookup(x => x)).toBeInstanceOf(Lookup));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).toLookup(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => Query.from([]).toLookup(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => Query.from([]).toLookup(x => x, x => x, value)).toThrow(error));
    });
    describe("toObject()", () => {
        it("creates object with prototype", () => {
            const proto = {};
            const obj: any = Query.from(["a", "b"]).toObject(proto, x => x);
            expect(obj).toHaveProperty("a", "a");
            expect(obj).toHaveProperty("b", "b");
            expect(Object.getPrototypeOf(obj)).toBe(proto);
        });
        it("creates object with null prototype", () => {
            const obj: any = Query.from(["a", "b"]).toObject(null, x => x);
            expect(obj.a).toBe("a");
            expect(Object.getPrototypeOf(obj)).toBe(null);
        });
        it.each`
            type              | value         | error
            ${"non-object"}   | ${""}         | ${TypeError}
        `("throws if 'prototype' is $type", ({ value, error }) => expect(() => Query.from([]).toObject(value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).toObject(null, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => Query.from([]).toObject(null, x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'descriptorSelector' is $type", ({ value, error }) => expect(() => Query.from([]).toObject(null, x => x, x => x, value)).toThrow(error));
    });
    describe("toJSON()", () => {
        it("is array", () => expect(Query.from([1, 2, 3, 4]).toJSON()).toEqual([1, 2, 3, 4]));
    });
    describe("copyTo", () => {
        it("copies to array", () => {
            expect(Query.from([1, 2, 3, 4]).copyTo(Array(4))).toEqualSequence([1, 2, 3, 4]);
        });
    });
    // Hierarchy
    describe("toHierarchy()", () => {
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-provider"} | ${{}}         | ${TypeError}
        `("throws if 'provider' is $type", ({ value, error }) => expect(() => Query.from([]).toHierarchy(value)).toThrow(error));
    });
});
describe("OrderedQuery", () => {
    describe("thenBy()", () => {
        it("preserves preceding order", () => expect(Query.from(books.books).orderBy(x => x.title).thenBy(x => x.id)).toEqualSequence([books.bookA3, books.bookA4, books.bookB1, books.bookB2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(x => x).thenBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(x => x).thenBy(x => x, value)).toThrow(error));
    });
    describe("thenByDescending()", () => {
        it("preserves preceding order", () => expect(Query.from(books.books).orderBy(x => x.title).thenByDescending(x => x.id)).toEqualSequence([books.bookA4, books.bookA3, books.bookB2, books.bookB1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(x => x).thenByDescending(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => Query.from([]).orderBy(x => x).thenByDescending(x => x, value)).toThrow(error));
    });
});
describe("HierarchyQuery", () => {
    describe("root()", () => {
        it("gets root", () => expect(Query.from([nodes.nodeAAAA], nodes.nodeHierarchy).root()).toEqualSequence([nodes.nodeA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).root()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).root(value)).toThrow(error));
    });
    describe("ancestors()", () => {
        it("gets ancestors", () => expect(Query.from([nodes.nodeAAAA], nodes.nodeHierarchy).ancestors()).toEqualSequence([nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).ancestors()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).ancestors(value)).toThrow(error));
    });
    describe("ancestorsAndSelf()", () => {
        it("gets ancestors and self", () => expect(Query.from([nodes.nodeAAAA], nodes.nodeHierarchy).ancestorsAndSelf()).toEqualSequence([nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).ancestorsAndSelf()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).ancestorsAndSelf(value)).toThrow(error));
    });
    describe("parents()", () => {
        it("gets parents", () => expect(Query.from([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy).parents()).toEqualSequence([nodes.nodeAA, nodes.nodeAA, nodes.nodeAA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).parents()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).parents(value)).toThrow(error));
    });
    describe("self()", () => {
        it("gets self", () => expect(Query.from([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy).self()).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).self()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).self(value)).toThrow(error));
    });
    describe("siblings()", () => {
        it("gets siblings", () => expect(Query.from([nodes.nodeAAA], nodes.nodeHierarchy).siblings()).toEqualSequence([nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).siblings()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).siblings(value)).toThrow(error));
    });
    describe("siblingsAndSelf()", () => {
        it("gets siblings and self", () => expect(Query.from([nodes.nodeAAA], nodes.nodeHierarchy).siblingsAndSelf()).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).siblingsAndSelf()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).siblingsAndSelf(value)).toThrow(error));
    });
    describe("precedingSiblings()", () => {
        it("gets siblings before self", () => expect(Query.from([nodes.nodeAAB], nodes.nodeHierarchy).precedingSiblings()).toEqualSequence([nodes.nodeAAA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).precedingSiblings()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).precedingSiblings(value)).toThrow(error));
    });
    describe("preceding()", () => {
        it("gets nodes before self", () => expect(Query.from([nodes.nodeAB], nodes.nodeHierarchy).preceding()).toEqualSequence([nodes.nodeAAC, nodes.nodeAAB, nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).preceding(value)).toThrow(error));
    });
    describe("followingSiblings()", () => {
        it("gets siblings after self", () => expect(Query.from([nodes.nodeAAB], nodes.nodeHierarchy).followingSiblings()).toEqualSequence([nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).followingSiblings()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).followingSiblings(value)).toThrow(error));
    });
    describe("following()", () => {
        it("gets nodes after self", () => expect(Query.from([nodes.nodeAB], nodes.nodeHierarchy).following()).toEqualSequence([nodes.nodeACA, nodes.nodeAC]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).following(value)).toThrow(error));
    });
    describe("children()", () => {
        it("gets children", () => expect(Query.from([nodes.nodeAA, nodes.nodeAB, nodes.nodeAC], nodes.nodeHierarchy).children()).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC, nodes.nodeACA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).children()).toEqualSequence([]));
        it("of undefined children", () => expect(Query.from(books.books, books.bookHierarchy).children()).toEqualSequence([]));
        it("of undefined child", () => expect(Query.from([nodes.badNode], nodes.nodeHierarchy).children()).toEqualSequence([]));
        it("with predicate", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).children(x => !!x.marker)).toEqualSequence([nodes.nodeAAB]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).children(value)).toThrow(error));
    });
    describe("nthChild()", () => {
        it("gets nthChild(0)", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).nthChild(0)).toEqualSequence([nodes.nodeAAA]));
        it("gets nthChild(2)", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).nthChild(2)).toEqualSequence([nodes.nodeAAC]));
        it("gets nthChild(-1)", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).nthChild(-1)).toEqualSequence([nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).nthChild(0)).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).nthChild(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).nthChild(0, value)).toThrow(error));
    });
    describe("firstChild(", () => {
        it("gets firstChild()", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).firstChild()).toEqualSequence([nodes.nodeAAA]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).firstChild()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).firstChild(value)).toThrow(error));
    });
    describe("lastChild(", () => {
        it("gets lastChild()", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).lastChild()).toEqualSequence([nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).lastChild()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).lastChild(value)).toThrow(error));
    });
    describe("descendants()", () => {
        it("gets descendants", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).descendants()).toEqualSequence([nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).descendants()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).descendants(value)).toThrow(error));
    });
    describe("descendantsAndSelf()", () => {
        it("gets descendants and self", () => expect(Query.from([nodes.nodeAA], nodes.nodeHierarchy).descendantsAndSelf()).toEqualSequence([nodes.nodeAA, nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(Query.from([undefined!], nodes.nodeHierarchy).descendantsAndSelf()).toEqualSequence([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => Query.from([], nodes.nodeHierarchy).descendantsAndSelf(value)).toThrow(error));
    });
});
