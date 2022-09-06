/// <reference types="../../../../internal/jest-sequence" />

import { Lookup } from "@esfx/iter-lookup";
import * as fn from "../";
import * as users from "./data/users";
import * as nodes from "./data/nodes";
import * as books from "./data/books";
import { Comparable } from '@esfx/equatable';
import { HashSet } from '@esfx/collections-hashset';
import { HashMap } from '@esfx/collections-hashmap';
import { Index } from '@esfx/interval';

describe("empty()", () => {
    it("is empty", () => expect(fn.empty()).toEqualSequence([]));
});
describe("once()", () => {
    it("is once", () => expect(fn.once(1)).toEqualSequence([1]));
});
describe("repeat()", () => {
    it("0 times", () => expect(fn.repeat("a", 0)).toEqualSequence([]));
    it("5 times", () => expect(fn.repeat("a", 5)).toEqualSequence(["a", "a", "a", "a", "a"]));
    it.each`
        type            | count         | error
        ${"undefined"}  | ${undefined}  | ${TypeError}
        ${"null"}       | ${null}       | ${TypeError}
        ${"non-number"} | ${""}         | ${TypeError}
        ${"negative"}   | ${-1}         | ${RangeError}
        ${"NaN"}        | ${NaN}        | ${RangeError}
        ${"Infinity"}   | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ count, error }) => expect(() => fn.repeat("a", count)).toThrow(error));
});
describe("range()", () => {
    it("same", () => expect(fn.range(1, 1)).toEqualSequence([1]));
    it("low to high", () => expect(fn.range(1, 3)).toEqualSequence([1, 2, 3]));
    it("low to high by 2", () => expect(fn.range(1, 3, 2)).toEqualSequence([1, 3]));
    it("high to low", () => expect(fn.range(3, 1)).toEqualSequence([3, 2, 1]));
    it("high to low by 2", () => expect(fn.range(3, 1, 2)).toEqualSequence([3, 1]));
    it.each`
        type            | value         | error
        ${"undefined"}  | ${undefined}  | ${TypeError}
        ${"null"}       | ${null}       | ${TypeError}
        ${"non-number"} | ${""}         | ${TypeError}
        ${"NaN"}        | ${NaN}        | ${RangeError}
        ${"Infinity"}   | ${Infinity}   | ${RangeError}
    `("throws if 'start' is $type", ({ value, error }) => expect(() => fn.range(value, 3)).toThrow(error));
    it.each`
        type            | value         | error
        ${"undefined"}  | ${undefined}  | ${TypeError}
        ${"null"}       | ${null}       | ${TypeError}
        ${"non-number"} | ${""}         | ${TypeError}
        ${"NaN"}        | ${NaN}        | ${RangeError}
        ${"Infinity"}   | ${Infinity}   | ${RangeError}
    `("throws if 'end' is $type", ({ value, error }) => expect(() => fn.range(1, value)).toThrow(error));
    it.each`
        type            | value         | error
        ${"null"}       | ${null}       | ${TypeError}
        ${"non-number"} | ${""}         | ${TypeError}
        ${"negative"}   | ${-1}         | ${RangeError}
        ${"0"}          | ${0}          | ${RangeError}
        ${"NaN"}        | ${NaN}        | ${RangeError}
        ${"Infinity"}   | ${Infinity}   | ${RangeError}
    `("throws if 'increment' is $type", ({ value, error }) => expect(() => fn.range(1, 3, value)).toThrow(error));
});
describe("continuous()", () => {
    it("after 5 elements", () => expect(fn.continuous(1)).toStartWithSequence([1, 1, 1, 1, 1]));
    it("after 10 elements", () => expect(fn.continuous(1)).toStartWithSequence([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
});
describe("generate()", () => {
    it("even numbers", () => expect(fn.generate(3, i => i * 2)).toEqualSequence([0, 2, 4]));
    it.each`
        type            | value         | error
        ${"undefined"}  | ${undefined}  | ${TypeError}
        ${"null"}       | ${null}       | ${TypeError}
        ${"non-number"} | ${""}         | ${TypeError}
        ${"negative"}   | ${-1}         | ${RangeError}
        ${"NaN"}        | ${NaN}        | ${RangeError}
        ${"Infinity"}   | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.generate(value, () => {})).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'generator' is $type", ({ value, error }) => expect(() => fn.generate(1, value)).toThrow(error));
});
describe("consume()", () => {
    it("consumes", () => {
        const q = fn.consume(function* () { yield 1; } ());
        expect(q).toEqualSequence([1]);
        expect(q).toEqualSequence([]);
    });
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterator"} | ${{}}         | ${TypeError}
    `("throws if 'iterator' is $type", ({ value, error }) => expect(() => fn.consume(value)).toThrow(error));
});
// describe("objectKeys()", () => {
//     it("gets keys", () => expect(fn.objectKeys({ a: 1, b: 2 })).toEqualSequence(["a", "b"]));
//     theory.throws("throws if 'source' is", (source: any) => fn.objectKeys(source), {
//         "undefined": [TypeError, undefined],
//         "null": [TypeError, null],
//         "non-object": [TypeError, ""]
//     });
// });
// describe("objectValues()", () => {
//     it("gets values", () => expect(fn.objectValues({ a: 1, b: 2 })).toEqualSequence([1, 2]));
//     theory.throws("throws if 'source' is", (source: any) => fn.objectValues(source), {
//         "undefined": [TypeError, undefined],
//         "null": [TypeError, null],
//         "non-object": [TypeError, ""]
//     });
// });
// describe("objectEntries()", () => {
//     it("gets keys", () => expect(fn.objectEntries({ a: 1, b: 2 }).toArray()).toEqual([["a", 1], ["b", 2]]));
//     theory.throws("throws if 'source' is", (source: any) => fn.objectEntries(source), {
//         "undefined": [TypeError, undefined],
//         "null": [TypeError, null],
//         "non-object": [TypeError, ""]
//     });
// });
// Subquery
describe("filter()", () => {
    it("filters", () => expect(fn.filter([1, 2, 3], x => x >= 2)).toEqualSequence([2, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.filter([], value)).toThrow(error));
});
describe("filterDefined()", () => {
    it("filterDefined()", () => expect(fn.filterDefined([1, undefined, 2])).toEqualSequence([1, 2]));
});
describe("map()", () => {
    it("maps", () => expect(fn.map([1, 2, 3], x => x * 2)).toEqualSequence([2, 4, 6]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'selector' is $type", ({ value, error }) => expect(() => fn.map([], value)).toThrow(error));
});
describe("flatMap()", () => {
    it("flatMaps", () => expect(fn.flatMap([1, 2, 3], x => [x, 0])).toEqualSequence([1, 0, 2, 0, 3, 0]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'projection' is $type", ({ value, error }) => expect(() => fn.flatMap([], value)).toThrow(error));
});
describe("tap()", () => {
    it("taps", () => {
        const received: number[] = [];
        const result = fn.tap([1, 2, 3, 4], v => received.push(v));
        expect(result).toEqualSequence([1, 2, 3, 4]);
        expect(received).toEqual([1, 2, 3, 4]);
    });
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.tap([], value)).toThrow(error));
});
describe("reverse()", () => {
    it("reverses", () => expect(fn.reverse([1, 2, 3], )).toEqualSequence([3, 2, 1]));
});
describe("skip()", () => {
    it("skips", () => expect(fn.skip([1, 2, 3], 1)).toEqualSequence([2, 3]));
    it("skip none", () => expect(fn.skip([1, 2, 3], 0)).toEqualSequence([1, 2, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.skip([], value)).toThrow(error));
});
describe("skipRight()", () => {
    it("skips right", () => expect(fn.skipRight([1, 2, 3], 1)).toEqualSequence([1, 2]));
    it("skips right none", () => expect(fn.skipRight([1, 2, 3], 0)).toEqualSequence([1, 2, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.skip([], value)).toThrow(error));
});
describe("skipWhile()", () => {
    it("skips while", () => expect(fn.skipWhile([1, 2, 1, 3], x => x < 2)).toEqualSequence([2, 1, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.skipWhile([], value)).toThrow(error));
});
describe("skipUntil()", () => {
    it("skips until", () => expect(fn.skipUntil([1, 2, 1, 3], x => x >= 2)).toEqualSequence([2, 1, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.skipUntil([], value)).toThrow(error));
});
describe("take()", () => {
    it("takes", () => expect(fn.take([1, 2, 3], 2)).toEqualSequence([1, 2]));
    it("takes none", () => expect(fn.take([1, 2, 3], 0)).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.take([], value)).toThrow(error));
});
describe("takeRight()", () => {
    it("takes right", () => expect(fn.takeRight([1, 2, 3], 2)).toEqualSequence([2, 3]));
    it("takes right none", () => expect(fn.takeRight([1, 2, 3], 0)).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.takeRight([], value)).toThrow(error));
});
describe("takeWhile()", () => {
    it("takes while", () => expect(fn.takeWhile([1, 2, 3, 1], x => x < 3)).toEqualSequence([1, 2]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.takeWhile([], value)).toThrow(error));
});
describe("takeUntil()", () => {
    it("takes until", () => expect(fn.takeUntil([1, 2, 3, 1], x => x >= 3)).toEqualSequence([1, 2]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.takeUntil([], value)).toThrow(error));
});
describe("intersect()", () => {
    it("intersects", () => expect(fn.intersect([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequence([1, 3]));
    it("intersects none", () => expect(fn.intersect([1, 1, 2, 3, 4], [])).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.intersect([], value)).toThrow(error));
});
describe("union()", () => {
    it("unions", () => expect(fn.union([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequence([1, 2, 3, 4, 5, 7]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.union([], value)).toThrow(error));
});
describe("except()", () => {
    it.only("excepts", () => expect(fn.except([1, 1, 2, 3, 4], [2, 4, 5])).toEqualSequence([1, 3]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.except([], value)).toThrow(error));
});
describe("symmetricDifference()", () => {
    it("symmetricDifference", () => expect(fn.symmetricDifference([1, 1, 2, 3, 4], [2, 4, 5])).toEqualSequence([1, 3, 5]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.symmetricDifference([], value)).toThrow(error));
});
describe("concat()", () => {
    it("concats", () => expect(fn.concat([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequence([1, 1, 2, 3, 4, 1, 3, 3, 5, 7]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.concat([], value)).toThrow(error));
});
describe("distinct()", () => {
    it("is distinct", () => expect(fn.distinct([1, 1, 2, 3, 4], )).toEqualSequence([1, 2, 3, 4]));
});
describe("append()", () => {
    it("appends", () => expect(fn.append([1, 2, 3], 5)).toEqualSequence([1, 2, 3, 5]));
});
describe("prepend()", () => {
    it("prepends", () => expect(fn.prepend([1, 2, 3], 5)).toEqualSequence([5, 1, 2, 3]));
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
    `("patches with ($start, $skip, $range)", ({ start, skip, range, expected }) => expect(fn.patch([1, 2, 3], start, skip, range)).toEqualSequence(expected));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'start' is $type", ({ value, error }) => expect(() => fn.patch([], value, 0, [])).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'skipCount' is $type", ({ value, error }) => expect(() => fn.patch([], 0, value, [])).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'range' is $type", ({ value, error }) => expect(() => fn.patch([], 0, 0, value)).toThrow(error));
});
describe("defaultIfEmpty()", () => {
    it("not empty", () => expect(fn.defaultIfEmpty([1, 2, 3], 9)).toEqualSequence([1, 2, 3]));
    it("empty", () => expect(fn.defaultIfEmpty([], 9)).toEqualSequence([9]));
});
describe("pageBy()", () => {
    it("pages with partial last page", () => expect(fn.toArray(fn.map(fn.pageBy([1, 2, 3], 2), x => Array.from(x)))).toEqual([[1, 2], [3]]));
    it("pages exact", () => expect(fn.toArray(fn.map(fn.pageBy([1, 2, 3, 4], 2), x => Array.from(x)))).toEqual([[1, 2], [3, 4]]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"0"}            | ${0}          | ${RangeError}
        ${"negative"}     | ${-1}         | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'pageSize' is $type", ({ value, error }) => expect(() => fn.pageBy([], value)).toThrow(error));
});
describe("spanMap()", () => {
    it("odd/even spans", () => expect(fn.toArray(fn.map(fn.spanMap([1, 3, 2, 4, 5, 7], k => k % 2 === 1), g => Array.from(g)))).toEqual([[1, 3], [2, 4], [5, 7]]));
    it("empty", () => expect(fn.spanMap([], k => k % 2 === 1)).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.spanMap([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.spanMap([], x => x, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'spanSelector' is $type", ({ value, error }) => expect(() => fn.spanMap([], x => x, x => x, value)).toThrow(error));
});
describe("groupBy()", () => {
    it("group by role", () => expect(fn.toArray(fn.groupBy(users.users, u => u.role, u => u.name, (role, names) => ({ role: role, names: fn.toArray(names) }))))
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
        expect(fn.toArray(fn.groupBy(data, row => row.category, row => row.value, (category, values) => ({ category, values: fn.toArray(values) }))))
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
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.groupBy([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.groupBy([], x => x, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.groupBy([], x => x, x => x, value)).toThrow(error));
});
describe("scan()", () => {
    it("scans sums", () => expect(fn.scan([1, 2, 3], (c, e) => c + e, 0)).toEqualSequence([1, 3, 6]));
    it("scans sums no seed", () => expect(fn.scan([1, 2, 3], (c, e) => c + e)).toEqualSequence([3, 6]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.scan([], value)).toThrow(error));
});
describe("scanRight()", () => {
    it("scans sums from right", () => expect(fn.scanRight([1, 2, 3], (c, e) => c + e, 0)).toEqualSequence([3, 5, 6]));
    it("scans sums from right no seed", () => expect(fn.scanRight([1, 2, 3], (c, e) => c + e)).toEqualSequence([5, 6]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.scanRight([], value)).toThrow(error));
});
// describe("through()", () => {
//     it("pipes through", () => expect(fn.through([1, 2], q => {
//         expect(q).toEqualSequence([1, 2]);
//         return fn.from([3, 4]);
//     })).toEqualSequence([3, 4]));
//     it.each`
//         type              | value         | error
//         ${"undefined"}    | ${undefined}  | ${TypeError}
//         ${"null"}         | ${null}       | ${TypeError}
//         ${"non-function"} | ${""}         | ${TypeError}
//     `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.through([], value)).toThrow(error));
// });
describe("materialize()", () => {
    it("materializes", () => {
        const received: number[] = [];
        const q = fn.materialize(fn.tap([1, 2, 3, 4], x => received.push(x)));
        expect(q).toEqualSequence([1, 2, 3, 4]);
        expect(received).toEqual([1, 2, 3, 4]);
    });
});
// Joins
describe("groupJoin()", () => {
    it("joins groups", () => expect(fn.toArray(fn.groupJoin(users.roles, users.users, g => g.name, u => u.role, (role, users) => ({ role: role, users: fn.toArray(users) }))))
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
    `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.groupJoin([], value, x => x, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.groupJoin([], [], value, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.groupJoin([], [], x => x, value, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.groupJoin([], [], x => x, x => x, value)).toThrow(error));
});
describe("join()", () => {
    it("joins", () => expect(fn.toArray(fn.join(users.roles, users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))))
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
    `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.join([], value, x => x, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.join([], [], value, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.join([], [], x => x, value, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.join([], [], x => x, x => x, value)).toThrow(error));
});
describe("fullJoin()", () => {
    it("joins", () => expect(fn.toArray(fn.fullJoin(users.roles, users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))))
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
    `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.fullJoin([], value, x => x, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.fullJoin([], [], value, x => x, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.fullJoin([], [], x => x, value, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.fullJoin([], [], x => x, x => x, value)).toThrow(error));
});
describe("zip()", () => {
    it.each`
        left            | right                 | expected
        ${[1, 2, 3]}    | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"], [3, "c"]]}
        ${[1, 2]}       | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"]]}
        ${[1, 2, 3]}    | ${["a", "b"]}         | ${[[1, "a"], [2, "b"]]}
    `("zips with $left, $right", ({ left, right, expected }) => expect(fn.toArray(fn.zip(left, right))).toEqual(expected));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'right' is $type", ({ value, error }) => expect(() => fn.zip([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'selector' is $type", ({ value, error }) => expect(() => fn.zip([], [], value)).toThrow(error));
});
// Ordering
describe("orderBy()", () => {
    it("orders", () => expect(fn.orderBy([3, 1, 2], x => x)).toEqualSequence([1, 2, 3]));
    it("orders same", () => {
        const q = fn.toArray(fn.orderBy(books.books_same, x => x.title));
        expect(q[0]).toBe(books.bookB2);
        expect(q[1]).toBe(books.bookB2_same);
    });
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.orderBy([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-comparer"} | ${{}}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.orderBy([], x => x, value)).toThrow(error));
});
describe("orderByDescending()", () => {
    it("orders", () => expect(fn.orderByDescending([3, 1, 2], x => x)).toEqualSequence([3, 2, 1]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.orderByDescending([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-comparer"} | ${{}}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.orderByDescending([], x => x, value)).toThrow(error));
});
// Scalars
describe("reduce()", () => {
    it("reduces sum", () => expect(fn.reduce([1, 2, 3], (c, e) => c + e)).toBe(6));
    it("reduces average", () => expect(fn.reduce([1, 2, 3], (c, e) => c + e, 0, (r, c) => r / c)).toBe(2));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.reduce([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.reduce([], x => x, undefined, value)).toThrow(error));
});
describe("reduceRight()", () => {
    it("reduces sum", () => expect(fn.reduceRight([1, 2, 3], (c, e) => c + e)).toBe(6));
    it("reduces average", () => expect(fn.reduceRight([1, 2, 3], (c, e) => c + e, 0, (r, c) => r / c)).toBe(2));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.reduceRight([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.reduceRight([], x => x, undefined, value)).toThrow(error));
});
describe("count()", () => {
    it("counts array", () => expect(fn.count([1, 2, 3], )).toBe(3));
    it("counts set", () => expect(fn.count(new Set([1, 2, 3]))).toBe(3));
    it("counts map", () => expect(fn.count(new Map([[1, 1], [2, 2], [3, 3]]))).toBe(3));
    it("counts range", () => expect(fn.count(fn.range(1, 3))).toBe(3));
    it("counts odds", () => expect(fn.count([1, 2, 3], x => x % 2 === 1)).toBe(2));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.count([], value)).toThrow(error));
});
describe("first()", () => {
    it("finds first", () => expect(fn.first([1, 2, 3], )).toBe(1));
    it("finds first even", () => expect(fn.first([1, 2, 3, 4], x => x % 2 === 0)).toBe(2));
    it("finds undefined when empty", () => expect(fn.first([], )).toBeUndefined());
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.first([], value)).toThrow(error));
});
describe("last()", () => {
    it("finds last", () => expect(fn.last([1, 2, 3], )).toBe(3));
    it("finds last odd", () => expect(fn.last([1, 2, 3, 4], x => x % 2 === 1)).toBe(3));
    it("finds undefined when empty", () => expect(fn.last([], )).toBeUndefined());
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.last([], value)).toThrow(error));
});
describe("single()", () => {
    it("finds single", () => expect(fn.single([1], )).toBe(1));
    it("finds undefined when many", () => expect(fn.single([1, 2, 3], )).toBeUndefined());
    it("finds undefined when empty", () => expect(fn.single([], )).toBeUndefined());
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.single([], value)).toThrow(error));
});
describe("min()", () => {
    it("finds minimum", () => expect(fn.min([5, 6, 3, 9, 4], )).toBe(3));
    it("finds undefined when empty", () => expect(fn.min([], )).toBeUndefined());
    it("uses comparable", () => {
        const a = { [Comparable.compareTo](x: any) { return -1; } };
        const b = { [Comparable.compareTo](x: any) { return +1; } };
        expect(fn.min([a, b], )).toBe(a);
    });
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.min([], value)).toThrow(error));
});
describe("max()", () => {
    it("finds maximum", () => expect(fn.max([5, 6, 3, 9, 4], )).toBe(9));
    it("finds undefined when empty", () => expect(fn.max([], )).toBeUndefined());
    it("uses comparable", () => {
        const a = { [Comparable.compareTo](x: any) { return -1; } };
        const b = { [Comparable.compareTo](x: any) { return +1; } };
        expect(fn.max([a, b], )).toBe(b);
    });
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.max([], value)).toThrow(error));
});
describe("sum()", () => {
    it("calculates sum", () => expect(fn.sum([1, 2, 3], )).toBe(6));
    it("calculates sum using projection", () => expect(fn.sum(["1", "2", "3"], x => +x)).toBe(6));
    it("calculates zero sum when empty", () => expect(fn.sum([], )).toBe(0));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.sum([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${{}}         | ${TypeError}
    `("throws if sequence contains $type", ({ value, error }) => expect(() => fn.sum([value], )).toThrow(error));
});
describe("average()", () => {
    it("calculates average", () => expect(fn.average([1, 2, 3], )).toBe(2));
    it("calculates average using projection", () => expect(fn.average(["1", "2", "3"], x => +x)).toBe(2));
    it("calculates zero average when empty", () => expect(fn.average([], )).toBe(0));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.average([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${{}}         | ${TypeError}
    `("throws if sequence contains $type", ({ value, error }) => expect(() => fn.average([value], )).toThrow(error));
});
describe("some()", () => {
    it("false when empty", () => expect(fn.some([], )).toBe(false));
    it("true when one or more", () => expect(fn.some([1], )).toBe(true));
    it("false when no match", () => expect(fn.some([1, 3], x => x === 2)).toBe(false));
    it("true when matched", () => expect(fn.some([1, 3], x => x === 3)).toBe(true));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.some([], value)).toThrow(error));
});
describe("every()", () => {
    it("false when empty", () => expect(fn.every([], x => x % 2 === 1)).toBe(false));
    it("false when no match", () => expect(fn.every([2, 4], x => x % 2 === 1)).toBe(false));
    it("false when partial match", () => expect(fn.every([1, 2], x => x % 2 === 1)).toBe(false));
    it("true when fully matched", () => expect(fn.every([1, 3], x => x % 2 === 1)).toBe(true));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.every([], value)).toThrow(error));
});
describe("corresponds()", () => {
    it("true when both match", () => expect(fn.corresponds([1, 2, 3], [1, 2, 3])).toBe(true));
    it("false when source has fewer elements", () => expect(fn.corresponds([1, 2], [1, 2, 3])).toBe(false));
    it("false when other has fewer elements", () => expect(fn.corresponds([1, 2, 3], [1, 2])).toBe(false));
    it("false when other has elements in different order", () => expect(fn.corresponds([1, 2, 3], [1, 3, 2])).toBe(false));
    it("false when other has different elements", () => expect(fn.corresponds([1, 2, 3], [1, 2, 4])).toBe(false));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.corresponds([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.corresponds([], [], value)).toThrow(error));
});
describe("includes()", () => {
    it("true when present", () => expect(fn.includes([1, 2, 3], 2)).toBe(true));
    it("false when missing", () => expect(fn.includes([1, 2, 3], 4)).toBe(false));
    it("false when empty", () => expect(fn.includes([], 4)).toBe(false));
});
describe("includesSequence()", () => {
    it("true when included", () => expect(fn.includesSequence([1, 2, 3, 4], [2, 3])).toBe(true));
    it("false when wrong order", () => expect(fn.includesSequence([1, 2, 3, 4], [3, 2])).toBe(false));
    it("false when not present", () => expect(fn.includesSequence([1, 2, 3, 4], [5, 6])).toBe(false));
    it("false when source empty", () => expect(fn.includesSequence([], [1, 2])).toBe(false));
    it("true when other empty", () => expect(fn.includesSequence([1, 2, 3, 4], [])).toBe(true));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.includesSequence([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.includesSequence([], [], value)).toThrow(error));
});
describe("startsWith()", () => {
    it("true when starts with other", () => expect(fn.startsWith([1, 2, 3, 4], [1, 2])).toBe(true));
    it("false when not at start", () => expect(fn.startsWith([1, 2, 3, 4], [2, 3])).toBe(false));
    it("false when wrong order", () => expect(fn.startsWith([1, 2, 3, 4], [2, 1])).toBe(false));
    it("false when not present", () => expect(fn.startsWith([1, 2, 3, 4], [5, 6])).toBe(false));
    it("false when source empty", () => expect(fn.startsWith([], [1, 2])).toBe(false));
    it("true when other empty", () => expect(fn.startsWith([1, 2, 3, 4], [])).toBe(true));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.startsWith([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.startsWith([], [], value)).toThrow(error));
});
describe("endsWith()", () => {
    it("true when ends with other", () => expect(fn.endsWith([1, 2, 3, 4], [3, 4])).toBe(true));
    it("false when not at end", () => expect(fn.endsWith([1, 2, 3, 4], [2, 3])).toBe(false));
    it("false when wrong order", () => expect(fn.endsWith([1, 2, 3, 4], [4, 3])).toBe(false));
    it("false when not present", () => expect(fn.endsWith([1, 2, 3, 4], [5, 6])).toBe(false));
    it("false when source empty", () => expect(fn.endsWith([], [1, 2])).toBe(false));
    it("true when other empty", () => expect(fn.endsWith([1, 2, 3, 4], [])).toBe(true));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-iterable"} | ${{}}         | ${TypeError}
    `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.endsWith([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.endsWith([], [], value)).toThrow(error));
});
describe("elementAt()", () => {
    it("at offset 0", () => expect(fn.elementAt([1, 2, 3], 0)).toBe(1));
    it("at offset 1", () => expect(fn.elementAt([1, 2, 3], 1)).toBe(2));
    it("at offset -1", () => expect(fn.elementAt([1, 2, 3], -1)).toBe(3));
    it("at offset -2", () => expect(fn.elementAt([1, 2, 3], -2)).toBe(2));
    it("at offset ^0", () => expect(fn.elementAt([1, 2, 3], Index.fromEnd(0))).toBe(undefined));
    it("at offset ^1", () => expect(fn.elementAt([1, 2, 3], Index.fromEnd(1))).toBe(3));
    it("at offset ^2", () => expect(fn.elementAt([1, 2, 3], Index.fromEnd(2))).toBe(2));
    it("at offset greater than size", () => expect(fn.elementAt([1, 2, 3], 3)).toBeUndefined());
    it("at negative offset greater than size", () => expect(fn.elementAt([1, 2, 3], -4)).toBeUndefined());
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"float"}        | ${1.5}        | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'offset' is $type", ({ value, error }) => expect(() => fn.elementAt([], value)).toThrow(error));
});
describe("span()", () => {
    it("gets initial span", () => expect(fn.span([1, 2, 3, 4], x => x < 3).map(x => fn.toArray(x))).toEqual([[1, 2], [3, 4]]));
    it("gets whole source", () => expect(fn.span([1, 2, 3, 4], x => x < 5).map(x => fn.toArray(x))).toEqual([[1, 2, 3, 4], []]));
    it("gets no initial span", () => expect(fn.span([1, 2, 3, 4], x => x < 1).map(x => fn.toArray(x))).toEqual([[], [1, 2, 3, 4]]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.span([], value)).toThrow(error));
});
describe("spanUntil()", () => {
    it("gets initial span", () => expect(fn.spanUntil([1, 2, 3, 4], x => x > 2).map(x => fn.toArray(x))).toEqual([[1, 2], [3, 4]]));
    it("gets whole source", () => expect(fn.spanUntil([1, 2, 3, 4], x => x > 4).map(x => fn.toArray(x))).toEqual([[1, 2, 3, 4], []]));
    it("gets no initial span", () => expect(fn.spanUntil([1, 2, 3, 4], x => x > 0).map(x => fn.toArray(x))).toEqual([[], [1, 2, 3, 4]]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.spanUntil([], value)).toThrow(error));
});
describe("forEach()", () => {
    it("called for each item", () => {
        const received: number[] = [];
        fn.forEach([1, 2, 3, 4], v => received.push(v));
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
        expect(() => fn.forEach(iterator, () => { throw error; })).toThrow(error);
        expect(returnWasCalled).toBe(true);
    });
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.forEach([], value)).toThrow(error));
});
describe("unzip()", () => {
    it("unzips", () => expect(fn.unzip([[1, "a"], [2, "b"]] as [number, string][], )).toEqual([[1, 2], ["a", "b"]]));
});
describe("toArray()", () => {
    it("creates array", () => expect(fn.toArray([1, 2, 3, 4], )).toEqual([1, 2, 3, 4]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toArray([], value)).toThrow(error));
});
describe("toSet()", () => {
    it("result is a Set", () => expect(fn.toSet([1, 2, 3, 4], )).toBeInstanceOf(Set));
    it("creates with right size", () => expect(fn.toSet([1, 2, 3, 4], ).size).toBe(4));
    it("creates set in order", () => expect(fn.toSet([1, 2, 3, 4], )).toEqualSequence([1, 2, 3, 4]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toSet([], value)).toThrow(error));
});
describe("toHashSet()", () => {
    it("result is a HashSet", () => expect(fn.toHashSet([1, 2, 3, 4], )).toBeInstanceOf(HashSet));
    it("creates with right size", () => expect(fn.toHashSet([1, 2, 3, 4], ).size).toBe(4));
    it("creates set in order", () => expect(fn.toHashSet([1, 2, 3, 4], )).toEqualSequence([1, 2, 3, 4]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'elementSelector'/'equaler' is $type", ({ value, error }) => expect(() => fn.toHashSet([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'equaler' is $type", ({ value, error }) => expect(() => fn.toHashSet([], x => x, value)).toThrow(error));
});
describe("toMap()", () => {
    it("result is a Map", () => expect(fn.toMap([1, 2, 3, 4], x => x)).toBeInstanceOf(Map));
    it("creates with right size", () => expect(fn.toMap([1, 2, 3, 4], x => x).size).toBe(4));
    it("creates with correct keys", () => expect(fn.toMap([1, 2, 3, 4], x => x * 2).get(2)).toBe(1));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toMap([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toMap([], x => x, value)).toThrow(error));
});
describe("toHashMap()", () => {
    it("result is a HashMap", () => expect(fn.toHashMap([1, 2, 3, 4], x => x)).toBeInstanceOf(HashMap));
    it("creates with right size", () => expect(fn.toHashMap([1, 2, 3, 4], x => x).size).toBe(4));
    it("creates with correct keys", () => expect(fn.toHashMap([1, 2, 3, 4], x => x * 2).get(2)).toBe(1));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toHashMap([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toHashMap([], x => x, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toHashMap([], x => x, x => x, value)).toThrow(error));
});
describe("toLookup()", () => {
    it("result is a Lookup", () => expect(fn.toLookup([1, 2, 3, 4], x => x)).toBeInstanceOf(Lookup));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toLookup([], value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toLookup([], x => x, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-object"}   | ${""}         | ${TypeError}
        ${"non-equaler"}  | ${{}}         | ${TypeError}
    `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toLookup([], x => x, x => x, value)).toThrow(error));
});
describe("toObject()", () => {
    it("creates object with prototype", () => {
        const proto = {};
        const obj: any = fn.toObject(["a", "b"], proto, x => x);
        expect(obj).toHaveProperty("a", "a");
        expect(obj).toHaveProperty("b", "b");
        expect(Object.getPrototypeOf(obj)).toBe(proto);
    });
    it("creates object with null prototype", () => {
        const obj: any = fn.toObject(["a", "b"], null, x => x);
        expect(obj.a).toBe("a");
        expect(Object.getPrototypeOf(obj)).toBe(null);
    });
    it.each`
        type              | value         | error
        ${"non-object"}   | ${""}         | ${TypeError}
    `("throws if 'prototype' is $type", ({ value, error }) => expect(() => fn.toObject([], value, x => x)).toThrow(error));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toObject([], null, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toObject([], null, x => x, value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'descriptorSelector' is $type", ({ value, error }) => expect(() => fn.toObject([], null, x => x, x => x, value)).toThrow(error));
});
describe("copyTo", () => {
    it("copies to array", () => {
        expect(fn.copyTo([1, 2, 3, 4], Array(4))).toEqualSequence([1, 2, 3, 4]);
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
    `("throws if 'provider' is $type", ({ value, error }) => expect(() => fn.toHierarchy([], value)).toThrow(error));
});

describe("thenBy()", () => {
    it("preserves preceding order", () => expect(fn.thenBy(fn.orderBy(books.books, x => x.title), x => x.id)).toEqualSequence([books.bookA3, books.bookA4, books.bookB1, books.bookB2]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.thenBy(fn.orderBy([], x => x), value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-comparer"} | ${{}}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.thenBy(fn.orderBy([], x => x), x => x, value)).toThrow(error));
});
describe("thenByDescending()", () => {
    it("preserves preceding order", () => expect(fn.thenByDescending(fn.orderBy(books.books, x => x.title), x => x.id)).toEqualSequence([books.bookA4, books.bookA3, books.bookB2, books.bookB1]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.thenByDescending(fn.orderBy([], x => x), value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
        ${"non-comparer"} | ${{}}         | ${TypeError}
    `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.thenByDescending(fn.orderBy([], x => x), x => x, value)).toThrow(error));
});
describe("root()", () => {
    it("gets root", () => expect(fn.root(fn.toHierarchy([nodes.nodeAAAA], nodes.nodeHierarchy))).toEqualSequence([nodes.nodeA]));
    it("of undefined", () => expect(fn.root(fn.toHierarchy([undefined!], nodes.nodeHierarchy))).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.root(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("ancestors()", () => {
    it("gets ancestors", () => expect(fn.ancestors(fn.toHierarchy([nodes.nodeAAAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
    it("of undefined", () => expect(fn.ancestors(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.ancestors(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("ancestorsAndSelf()", () => {
    it("gets ancestors and self", () => expect(fn.ancestorsAndSelf(fn.toHierarchy([nodes.nodeAAAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
    it("of undefined", () => expect(fn.ancestorsAndSelf(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.ancestorsAndSelf(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("parents()", () => {
    it("gets parents", () => expect(fn.parents(fn.toHierarchy([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAA, nodes.nodeAA, nodes.nodeAA]));
    it("of undefined", () => expect(fn.parents(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.parents(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("self()", () => {
    it("gets self", () => expect(fn.self(fn.toHierarchy([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
    it("of undefined", () => expect(fn.self(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.self(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("siblings()", () => {
    it("gets siblings", () => expect(fn.siblings(fn.toHierarchy([nodes.nodeAAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAB, nodes.nodeAAC]));
    it("of undefined", () => expect(fn.siblings(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.siblings(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("siblingsAndSelf()", () => {
    it("gets siblings and self", () => expect(fn.siblingsAndSelf(fn.toHierarchy([nodes.nodeAAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
    it("of undefined", () => expect(fn.siblingsAndSelf(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.siblingsAndSelf(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("precedingSiblings()", () => {
    it("gets siblings before self", () => expect(fn.precedingSiblings(fn.toHierarchy([nodes.nodeAAB], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA]));
    it("of undefined", () => expect(fn.precedingSiblings(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.precedingSiblings(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("preceding()", () => {
    it("gets nodes before self", () => expect(fn.preceding(fn.toHierarchy([nodes.nodeAB], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAC, nodes.nodeAAB, nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.preceding(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("followingSiblings()", () => {
    it("gets siblings after self", () => expect(fn.followingSiblings(fn.toHierarchy([nodes.nodeAAB], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAC]));
    it("of undefined", () => expect(fn.followingSiblings(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.followingSiblings(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("following()", () => {
    it("gets nodes after self", () => expect(fn.following(fn.toHierarchy([nodes.nodeAB], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeACA, nodes.nodeAC]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.following(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("children()", () => {
    it("gets children", () => expect(fn.children(fn.toHierarchy([nodes.nodeAA, nodes.nodeAB, nodes.nodeAC], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC, nodes.nodeACA]));
    it("of undefined", () => expect(fn.children(fn.toHierarchy([undefined!], nodes.nodeHierarchy))).toEqualSequence([]));
    it("of undefined children", () => expect(fn.children(fn.toHierarchy(books.books, books.bookHierarchy))).toEqualSequence([]));
    it("of undefined child", () => expect(fn.children(fn.toHierarchy([nodes.badNode], nodes.nodeHierarchy))).toEqualSequence([]));
    it("with predicate", () => expect(fn.children(fn.toHierarchy<nodes.Node>([nodes.nodeAA], nodes.nodeHierarchy), x => !!x.marker)).toEqualSequence([nodes.nodeAAB]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.children(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("nthChild()", () => {
    it("gets nthChild(0)", () => expect(fn.nthChild(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), 0)).toEqualSequence([nodes.nodeAAA]));
    it("gets nthChild(2)", () => expect(fn.nthChild(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), 2)).toEqualSequence([nodes.nodeAAC]));
    it("gets nthChild(-1)", () => expect(fn.nthChild(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), -1)).toEqualSequence([nodes.nodeAAC]));
    it("of undefined", () => expect(fn.nthChild(fn.toHierarchy([undefined!], nodes.nodeHierarchy), 0)).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"undefined"}    | ${undefined}  | ${TypeError}
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-number"}   | ${""}         | ${TypeError}
        ${"float"}        | ${1.5}        | ${RangeError}
        ${"NaN"}          | ${NaN}        | ${RangeError}
        ${"Infinity"}     | ${Infinity}   | ${RangeError}
    `("throws if 'offset' is $type", ({ value, error }) => expect(() => fn.nthChild(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.nthChild(fn.toHierarchy([], nodes.nodeHierarchy), 0, value)).toThrow(error));
});
describe("firstChild(", () => {
    it("gets firstChild()", () => expect(fn.firstChild(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA]));
    it("of undefined", () => expect(fn.firstChild(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.firstChild(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("lastChild(", () => {
    it("gets lastChild()", () => expect(fn.lastChild(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAC]));
    it("of undefined", () => expect(fn.lastChild(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.lastChild(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("descendants()", () => {
    it("gets descendants", () => expect(fn.descendants(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
    it("of undefined", () => expect(fn.descendants(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.descendants(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
describe("descendantsAndSelf()", () => {
    it("gets descendants and self", () => expect(fn.descendantsAndSelf(fn.toHierarchy([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequence([nodes.nodeAA, nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
    it("of undefined", () => expect(fn.descendantsAndSelf(fn.toHierarchy([undefined!], nodes.nodeHierarchy), )).toEqualSequence([]));
    it.each`
        type              | value         | error
        ${"null"}         | ${null}       | ${TypeError}
        ${"non-function"} | ${""}         | ${TypeError}
    `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.descendantsAndSelf(fn.toHierarchy([], nodes.nodeHierarchy), value)).toThrow(error));
});
