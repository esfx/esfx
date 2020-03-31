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

describe("Queries", () => {
    describe("empty()", () => {
        it("is empty", () => expect(fn.emptyAsync()).toEqualSequenceAsync([]));
    });
    describe("once()", () => {
        it("is once", () => expect(fn.onceAsync(1)).toEqualSequenceAsync([1]));
    });
    describe("repeat()", () => {
        it("0 times", () => expect(fn.repeatAsync("a", 0)).toEqualSequenceAsync([]));
        it("5 times", () => expect(fn.repeatAsync("a", 5)).toEqualSequenceAsync(["a", "a", "a", "a", "a"]));
        it.each`
            type            | count         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ count, error }) => expect(() => fn.repeatAsync("a", count)).toThrow(error));
    });
    describe("continuous()", () => {
        it("after 5 elements", () => expect(fn.continuousAsync(1)).toStartWithSequenceAsync([1, 1, 1, 1, 1]));
        it("after 10 elements", () => expect(fn.continuousAsync(1)).toStartWithSequenceAsync([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
    });
    describe("generate()", () => {
        it("even numbers", () => expect(fn.generateAsync(3, i => i * 2)).toEqualSequenceAsync([0, 2, 4]));
        it.each`
            type            | value         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.generateAsync(value, () => {})).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'generator' is $type", ({ value, error }) => expect(() => fn.generateAsync(1, value)).toThrow(error));
    });
    describe("consume()", () => {
        it("consumes", async () => {
            const q = fn.consumeAsync(async function* () { yield 1; } ());
            await expect(q).toEqualSequenceAsync([1]);
            await expect(q).toEqualSequenceAsync([]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterator"} | ${{}}         | ${TypeError}
        `("throws if 'iterator' is $type", ({ value, error }) => expect(() => fn.consumeAsync(value)).toThrow(error));
    });
});
describe("Subqueries", () => {
    describe("filter()", () => {
        it("filters", () => expect(fn.filterAsync([1, 2, 3], x => x >= 2)).toEqualSequenceAsync([2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.filterAsync([], value)).toThrow(error));
    });
    describe("filterDefined()", () => {
        it("filterDefined()", () => expect(fn.filterDefinedAsync([1, undefined, 2])).toEqualSequenceAsync([1, 2]));
    });
    describe("map()", () => {
        it("maps", () => expect(fn.mapAsync([1, 2, 3], x => x * 2)).toEqualSequenceAsync([2, 4, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => fn.mapAsync([], value)).toThrow(error));
    });
    describe("flatMap()", () => {
        it("flatMaps", () => expect(fn.flatMapAsync([1, 2, 3], x => [x, 0])).toEqualSequenceAsync([1, 0, 2, 0, 3, 0]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'projection' is $type", ({ value, error }) => expect(() => fn.flatMapAsync([], value)).toThrow(error));
    });
    describe("tap()", () => {
        it("taps", async () => {
            const received: number[] = [];
            const result = fn.tapAsync([1, 2, 3, 4], v => { received.push(v); });
            await expect(result).toEqualSequenceAsync([1, 2, 3, 4]);
            await expect(received).toEqual([1, 2, 3, 4]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.tapAsync([], value)).toThrow(error));
    });
    describe("reverse()", () => {
        it("reverses", () => expect(fn.reverseAsync([1, 2, 3])).toEqualSequenceAsync([3, 2, 1]));
    });
    describe("drop()", () => {
        it("drops", () => expect(fn.dropAsync([1, 2, 3], 1)).toEqualSequenceAsync([2, 3]));
        it("drop none", () => expect(fn.dropAsync([1, 2, 3], 0)).toEqualSequenceAsync([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.dropAsync([], value)).toThrow(error));
    });
    describe("dropRight()", () => {
        it("drops right", () => expect(fn.dropRightAsync([1, 2, 3], 1)).toEqualSequenceAsync([1, 2]));
        it("drops right none", () => expect(fn.dropRightAsync([1, 2, 3], 0)).toEqualSequenceAsync([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.dropAsync([], value)).toThrow(error));
    });
    describe("dropWhile()", () => {
        it("drops while", () => expect(fn.dropWhileAsync([1, 2, 1, 3], x => x < 2)).toEqualSequenceAsync([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.dropWhileAsync([], value)).toThrow(error));
    });
    describe("dropUntil()", () => {
        it("drops until", () => expect(fn.dropUntilAsync([1, 2, 1, 3], x => x >= 2)).toEqualSequenceAsync([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.dropUntilAsync([], value)).toThrow(error));
    });
    describe("take()", () => {
        it("takes", () => expect(fn.takeAsync([1, 2, 3], 2)).toEqualSequenceAsync([1, 2]));
        it("takes none", () => expect(fn.takeAsync([1, 2, 3], 0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.takeAsync([], value)).toThrow(error));
    });
    describe("takeRight()", () => {
        it("takes right", () => expect(fn.takeRightAsync([1, 2, 3], 2)).toEqualSequenceAsync([2, 3]));
        it("takes right none", () => expect(fn.takeRightAsync([1, 2, 3], 0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => fn.takeRightAsync([], value)).toThrow(error));
    });
    describe("takeWhile()", () => {
        it("takes while", () => expect(fn.takeWhileAsync([1, 2, 3, 1], x => x < 3)).toEqualSequenceAsync([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.takeWhileAsync([], value)).toThrow(error));
    });
    describe("takeUntil()", () => {
        it("takes until", () => expect(fn.takeUntilAsync([1, 2, 3, 1], x => x >= 3)).toEqualSequenceAsync([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.takeUntilAsync([], value)).toThrow(error));
    });
    describe("intersect()", () => {
        it("intersects", () => expect(fn.intersectAsync([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 3]));
        it("intersects none", () => expect(fn.intersectAsync([1, 1, 2, 3, 4], [])).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.intersectAsync([], value)).toThrow(error));
    });
    describe("union()", () => {
        it("unions", () => expect(fn.unionAsync([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 2, 3, 4, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.unionAsync([], value)).toThrow(error));
    });
    describe("except()", () => {
        it("excepts", () => expect(fn.exceptAsync([1, 1, 2, 3, 4], [2, 4, 5])).toEqualSequenceAsync([1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.exceptAsync([], value)).toThrow(error));
    });
    describe("symmetricDifference()", () => {
        it("symmetricDifference", () => expect(fn.symmetricDifferenceAsync([1, 1, 2, 3, 4], [2, 4, 5])).toEqualSequenceAsync([1, 3, 5]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.symmetricDifferenceAsync([], value)).toThrow(error));
    });
    describe("concat()", () => {
        it("concats", () => expect(fn.concatAsync([1, 1, 2, 3, 4], [1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 1, 2, 3, 4, 1, 3, 3, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.concatAsync([], value)).toThrow(error));
    });
    describe("distinct()", () => {
        it("is distinct", () => expect(fn.distinctAsync([1, 1, 2, 3, 4])).toEqualSequenceAsync([1, 2, 3, 4]));
    });
    describe("append()", () => {
        it("appends", () => expect(fn.appendAsync([1, 2, 3], 5)).toEqualSequenceAsync([1, 2, 3, 5]));
    });
    describe("prepend()", () => {
        it("prepends", () => expect(fn.prependAsync([1, 2, 3], 5)).toEqualSequenceAsync([5, 1, 2, 3]));
    });
    describe("patch()", () => {
        it.each`
            start   | drop  | range         | expected
            ${0}    | ${0}  | ${[9, 8, 7]}  | ${[9, 8, 7, 1, 2, 3]}
            ${0}    | ${2}  | ${[9, 8, 7]}  | ${[9, 8, 7, 3]}
            ${2}    | ${0}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7, 3]}
            ${5}    | ${0}  | ${[9, 8, 7]}  | ${[1, 2, 3, 9, 8, 7]}
            ${2}    | ${1}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7]}
            ${2}    | ${3}  | ${[9, 8, 7]}  | ${[1, 2, 9, 8, 7]}
        `("patches with ($start, $drop, $range)", ({ start, drop, range, expected }) => expect(fn.patchAsync([1, 2, 3], start, drop, range)).toEqualSequenceAsync(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'start' is $type", ({ value, error }) => expect(() => fn.patchAsync([], value, 0, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'dropCount' is $type", ({ value, error }) => expect(() => fn.patchAsync([], 0, value, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'range' is $type", ({ value, error }) => expect(() => fn.patchAsync([], 0, 0, value)).toThrow(error));
    });
    describe("defaultIfEmpty()", () => {
        it("not empty", () => expect(fn.defaultIfEmptyAsync([1, 2, 3], 9)).toEqualSequenceAsync([1, 2, 3]));
        it("empty", () => expect(fn.defaultIfEmptyAsync([], 9)).toEqualSequenceAsync([9]));
    });
    describe("scan()", () => {
        it("scans sums", () => expect(fn.scanAsync([1, 2, 3], (c, e) => c + e, 0)).toEqualSequenceAsync([1, 3, 6]));
        it("scans sums no seed", () => expect(fn.scanAsync([1, 2, 3], (c, e) => c + e)).toEqualSequenceAsync([3, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.scanAsync([], value)).toThrow(error));
    });
    describe("scanRight()", () => {
        it("scans sums from right", () => expect(fn.scanRightAsync([1, 2, 3], (c, e) => c + e, 0)).toEqualSequenceAsync([3, 5, 6]));
        it("scans sums from right no seed", () => expect(fn.scanRightAsync([1, 2, 3], (c, e) => c + e)).toEqualSequenceAsync([5, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.scanRightAsync([], value)).toThrow(error));
    });
    // describe("through()", () => {
    //     it("pipes through", () => expect(fn.throughAsync([1, 2], q => {
    //         expect(q).toEqualSequenceAsync([1, 2]);
    //         return fn.fromAsync([3, 4]);
    //     })).toEqualSequenceAsync([3, 4]));
    //     it.each`
    //         type              | value         | error
    //         ${"undefined"}    | ${undefined}  | ${TypeError}
    //         ${"null"}         | ${null}       | ${TypeError}
    //         ${"non-function"} | ${""}         | ${TypeError}
    //     `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.throughAsync([], value)).toThrow(error));
    // });
    describe("materialize()", () => {
        it("materializes", async () => {
            const received: number[] = [];
            const q = await fn.materializeAsync(fn.tapAsync([1, 2, 3, 4], x => { received.push(x); }));
            expect(q).toEqualSequence([1, 2, 3, 4]);
            expect(received).toEqual([1, 2, 3, 4]);
        });
    });
});
describe("Grouping", () => {
    describe("pageBy()", () => {
        it("pages with partial last page", () => expect(fn.toArrayAsync(fn.mapAsync(fn.pageByAsync([1, 2, 3], 2), x => Array.from(x)))).resolves.toEqual([[1, 2], [3]]));
        it("pages exact", () => expect(fn.toArrayAsync(fn.mapAsync(fn.pageByAsync([1, 2, 3, 4], 2), x => Array.from(x)))).resolves.toEqual([[1, 2], [3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"0"}            | ${0}          | ${RangeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'pageSize' is $type", ({ value, error }) => expect(() => fn.pageByAsync([], value)).toThrow(error));
    });
    describe("spanMap()", () => {
        it("odd/even spans", () => expect(fn.toArrayAsync(fn.mapAsync(fn.spanMapAsync([1, 3, 2, 4, 5, 7], k => k % 2 === 1), g => Array.from(g)))).resolves.toEqual([[1, 3], [2, 4], [5, 7]]));
        it("empty", () => expect(fn.spanMapAsync([], k => k % 2 === 1)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.spanMapAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.spanMapAsync([], x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'spanSelector' is $type", ({ value, error }) => expect(() => fn.spanMapAsync([], x => x, x => x, value)).toThrow(error));
    });
    describe("groupBy()", () => {
        it("group by role", () => expect(fn.toArrayAsync(fn.groupByAsync(users.users, u => u.role, u => u.name, (role, names) => ({ role: role, names: [...names] }))))
            .resolves.toEqual([
                { role: "admin", names: ["alice"] },
                { role: "user", names: ["bob", "dave"] }
            ]));
        it("group by symbol", async () => {
            const sym = Symbol();
            const data = [
                { category: "a", value: 1 },
                { category: "a", value: 2 },
                { category: "a", value: 3 },
                { category: sym, value: 4 }
            ];
            await expect(fn.toArrayAsync(fn.groupByAsync(data, row => row.category, row => row.value, (category, values) => ({ category, values: [...values] }))))
                .resolves
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
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.groupByAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.groupByAsync([], x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.groupByAsync([], x => x, x => x, value)).toThrow(error));
    });
});
describe("Joins", () => {
    describe("groupJoin()", () => {
        it("joins groups", () => expect(fn.toArrayAsync(fn.groupJoinAsync(users.roles, users.users, g => g.name, u => u.role, (role, users) => ({ role: role, users: [...users] }))))
            .resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.groupJoinAsync([], value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.groupJoinAsync([], [], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.groupJoinAsync([], [], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.groupJoinAsync([], [], x => x, x => x, value)).toThrow(error));
    });
    describe("join()", () => {
        it("joins", () => expect(fn.toArrayAsync(fn.joinAsync(users.roles, users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))))
            .resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.joinAsync([], value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.joinAsync([], [], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.joinAsync([], [], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.joinAsync([], [], x => x, x => x, value)).toThrow(error));
    });
    describe("fullJoin()", () => {
        it("joins", () => expect(fn.toArrayAsync(fn.fullJoinAsync(users.roles, users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))))
            .resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => fn.fullJoinAsync([], value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => fn.fullJoinAsync([], [], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => fn.fullJoinAsync([], [], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.fullJoinAsync([], [], x => x, x => x, value)).toThrow(error));
    });
    describe("zip()", () => {
        it.each`
            left            | right                 | expected
            ${[1, 2, 3]}    | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"], [3, "c"]]}
            ${[1, 2]}       | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"]]}
            ${[1, 2, 3]}    | ${["a", "b"]}         | ${[[1, "a"], [2, "b"]]}
        `("zips with $left, $right", ({ left, right, expected }) => expect(fn.toArrayAsync(fn.zipAsync(left, right))).resolves.toEqual(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'right' is $type", ({ value, error }) => expect(() => fn.zipAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => fn.zipAsync([], [], value)).toThrow(error));
    });
});
describe("Ordering", () => {
    describe("orderBy()", () => {
        it("orders", () => expect(fn.orderByAsync([3, 1, 2], x => x)).toEqualSequenceAsync([1, 2, 3]));
        it("orders same", async () => {
            const q = await fn.toArrayAsync(fn.orderByAsync(books.books_same, x => x.title));
            expect(q[0]).toBe(books.bookB2);
            expect(q[1]).toBe(books.bookB2_same);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.orderByAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.orderByAsync([], x => x, value)).toThrow(error));
    });
    describe("orderByDescending()", () => {
        it("orders", () => expect(fn.orderByDescendingAsync([3, 1, 2], x => x)).toEqualSequenceAsync([3, 2, 1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.orderByDescendingAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.orderByDescendingAsync([], x => x, value)).toThrow(error));
    });
    describe("thenBy()", () => {
        it("preserves preceding order", () => expect(fn.thenByAsync(fn.orderByAsync(books.books, x => x.title), x => x.id)).toEqualSequenceAsync([books.bookA3, books.bookA4, books.bookB1, books.bookB2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.thenByAsync(fn.orderByAsync([], x => x), value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.thenByAsync(fn.orderByAsync([], x => x), x => x, value)).toThrow(error));
    });
    describe("thenByDescending()", () => {
        it("preserves preceding order", () => expect(fn.thenByDescendingAsync(fn.orderByAsync(books.books, x => x.title), x => x.id)).toEqualSequenceAsync([books.bookA4, books.bookA3, books.bookB2, books.bookB1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.thenByDescendingAsync(fn.orderByAsync([], x => x), value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.thenByDescendingAsync(fn.orderByAsync([], x => x), x => x, value)).toThrow(error));
    });
});
describe("Scalars", () => {
    describe("reduce()", () => {
        it("reduces sum", () => expect(fn.reduceAsync([1, 2, 3], (c, e) => c + e)).resolves.toBe(6));
        it("reduces average", () => expect(fn.reduceAsync([1, 2, 3], (c, e) => c + e, 0, (r, c) => r / c)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.reduceAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.reduceAsync([], x => x, undefined, value)).toThrow(error));
    });
    describe("reduceRight()", () => {
        it("reduces sum", () => expect(fn.reduceRightAsync([1, 2, 3], (c, e) => c + e)).resolves.toBe(6));
        it("reduces average", () => expect(fn.reduceRightAsync([1, 2, 3], (c, e) => c + e, 0, (r, c) => r / c)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => fn.reduceRightAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => fn.reduceRightAsync([], x => x, undefined, value)).toThrow(error));
    });
    describe("count()", () => {
        it("counts array", () => expect(fn.countAsync([1, 2, 3])).resolves.toBe(3));
        it("counts set", () => expect(fn.countAsync(new Set([1, 2, 3]))).resolves.toBe(3));
        it("counts map", () => expect(fn.countAsync(new Map([[1, 1], [2, 2], [3, 3]]))).resolves.toBe(3));
        it("counts odds", () => expect(fn.countAsync([1, 2, 3], x => x % 2 === 1)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.countAsync([], value)).toThrow(error));
    });
    describe("first()", () => {
        it("finds first", () => expect(fn.firstAsync([1, 2, 3])).resolves.toBe(1));
        it("finds first even", () => expect(fn.firstAsync([1, 2, 3, 4], x => x % 2 === 0)).resolves.toBe(2));
        it("finds undefined when empty", () => expect(fn.firstAsync([])).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.firstAsync([], value)).toThrow(error));
    });
    describe("last()", () => {
        it("finds last", () => expect(fn.lastAsync([1, 2, 3])).resolves.toBe(3));
        it("finds last odd", () => expect(fn.lastAsync([1, 2, 3, 4], x => x % 2 === 1)).resolves.toBe(3));
        it("finds undefined when empty", () => expect(fn.lastAsync([])).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.lastAsync([], value)).toThrow(error));
    });
    describe("single()", () => {
        it("finds single", () => expect(fn.singleAsync([1])).resolves.toBe(1));
        it("finds undefined when many", () => expect(fn.singleAsync([1, 2, 3])).resolves.toBeUndefined());
        it("finds undefined when empty", () => expect(fn.singleAsync([])).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.singleAsync([], value)).toThrow(error));
    });
    describe("min()", () => {
        it("finds minimum", () => expect(fn.minAsync([5, 6, 3, 9, 4])).resolves.toBe(3));
        it("finds undefined when empty", () => expect(fn.minAsync([])).resolves.toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            return expect(fn.minAsync([a, b])).resolves.toBe(a);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.minAsync([], value)).toThrow(error));
    });
    describe("max()", () => {
        it("finds maximum", () => expect(fn.maxAsync([5, 6, 3, 9, 4])).resolves.toBe(9));
        it("finds undefined when empty", () => expect(fn.maxAsync([])).resolves.toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            expect(fn.maxAsync([a, b])).resolves.toBe(b);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => fn.maxAsync([], value)).toThrow(error));
    });
    describe("sum()", () => {
        it("calculates sum", () => expect(fn.sumAsync([1, 2, 3])).resolves.toBe(6));
        it("calculates sum using projection", () => expect(fn.sumAsync(["1", "2", "3"], x => +x)).resolves.toBe(6));
        it("calculates zero sum when empty", () => expect(fn.sumAsync([])).resolves.toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.sumAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(fn.sumAsync([value])).rejects.toThrow(error));
    });
    describe("average()", () => {
        it("calculates average", () => expect(fn.averageAsync([1, 2, 3])).resolves.toBe(2));
        it("calculates average using projection", () => expect(fn.averageAsync(["1", "2", "3"], x => +x)).resolves.toBe(2));
        it("calculates zero average when empty", () => expect(fn.averageAsync([])).resolves.toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.averageAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(fn.averageAsync([value])).rejects.toThrow(error));
    });
    describe("some()", () => {
        it("false when empty", () => expect(fn.someAsync([])).resolves.toBe(false));
        it("true when one or more", () => expect(fn.someAsync([1])).resolves.toBe(true));
        it("false when no match", () => expect(fn.someAsync([1, 3], x => x === 2)).resolves.toBe(false));
        it("true when matched", () => expect(fn.someAsync([1, 3], x => x === 3)).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.someAsync([], value)).toThrow(error));
    });
    describe("every()", () => {
        it("false when empty", () => expect(fn.everyAsync([], x => x % 2 === 1)).resolves.toBe(false));
        it("false when no match", () => expect(fn.everyAsync([2, 4], x => x % 2 === 1)).resolves.toBe(false));
        it("false when partial match", () => expect(fn.everyAsync([1, 2], x => x % 2 === 1)).resolves.toBe(false));
        it("true when fully matched", () => expect(fn.everyAsync([1, 3], x => x % 2 === 1)).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.everyAsync([], value)).toThrow(error));
    });
    describe("corresponds()", () => {
        it("true when both match", () => expect(fn.correspondsAsync([1, 2, 3], [1, 2, 3])).resolves.toBe(true));
        it("false when source has fewer elements", () => expect(fn.correspondsAsync([1, 2], [1, 2, 3])).resolves.toBe(false));
        it("false when other has fewer elements", () => expect(fn.correspondsAsync([1, 2, 3], [1, 2])).resolves.toBe(false));
        it("false when other has elements in different order", () => expect(fn.correspondsAsync([1, 2, 3], [1, 3, 2])).resolves.toBe(false));
        it("false when other has different elements", () => expect(fn.correspondsAsync([1, 2, 3], [1, 2, 4])).resolves.toBe(false));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.correspondsAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.correspondsAsync([], [], value)).toThrow(error));
    });
    describe("includes()", () => {
        it("true when present", () => expect(fn.includesAsync([1, 2, 3], 2)).resolves.toBe(true));
        it("false when missing", () => expect(fn.includesAsync([1, 2, 3], 4)).resolves.toBe(false));
        it("false when empty", () => expect(fn.includesAsync([], 4)).resolves.toBe(false));
    });
    describe("includesSequence()", () => {
        it("true when included", () => expect(fn.includesSequenceAsync([1, 2, 3, 4], [2, 3])).resolves.toBe(true));
        it("false when wrong order", () => expect(fn.includesSequenceAsync([1, 2, 3, 4], [3, 2])).resolves.toBe(false));
        it("false when not present", () => expect(fn.includesSequenceAsync([1, 2, 3, 4], [5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(fn.includesSequenceAsync([], [1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(fn.includesSequenceAsync([1, 2, 3, 4], [])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.includesSequenceAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.includesSequenceAsync([], [], value)).toThrow(error));
    });
    describe("startsWith()", () => {
        it("true when starts with other", () => expect(fn.startsWithAsync([1, 2, 3, 4], [1, 2])).resolves.toBe(true));
        it("false when not at start", () => expect(fn.startsWithAsync([1, 2, 3, 4], [2, 3])).resolves.toBe(false));
        it("false when wrong order", () => expect(fn.startsWithAsync([1, 2, 3, 4], [2, 1])).resolves.toBe(false));
        it("false when not present", () => expect(fn.startsWithAsync([1, 2, 3, 4], [5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(fn.startsWithAsync([], [1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(fn.startsWithAsync([1, 2, 3, 4], [])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.startsWithAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.startsWithAsync([], [], value)).toThrow(error));
    });
    describe("endsWith()", () => {
        it("true when ends with other", () => expect(fn.endsWithAsync([1, 2, 3, 4], [3, 4])).resolves.toBe(true));
        it("false when not at end", () => expect(fn.endsWithAsync([1, 2, 3, 4], [2, 3])).resolves.toBe(false));
        it("false when wrong order", () => expect(fn.endsWithAsync([1, 2, 3, 4], [4, 3])).resolves.toBe(false));
        it("false when not present", () => expect(fn.endsWithAsync([1, 2, 3, 4], [5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(fn.endsWithAsync([], [1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(fn.endsWithAsync([1, 2, 3, 4], [])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => fn.endsWithAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => fn.endsWithAsync([], [], value)).toThrow(error));
    });
    describe("elementAt()", () => {
        it("at offset 0", () => expect(fn.elementAtAsync([1, 2, 3], 0)).resolves.toBe(1));
        it("at offset 1", () => expect(fn.elementAtAsync([1, 2, 3], 1)).resolves.toBe(2));
        it("at offset -1", () => expect(fn.elementAtAsync([1, 2, 3], -1)).resolves.toBe(3));
        it("at offset -2", () => expect(fn.elementAtAsync([1, 2, 3], -2)).resolves.toBe(2));
        it("at offset ^0", () => expect(fn.elementAtAsync([1, 2, 3], Index.fromEnd(0))).resolves.toBe(undefined));
        it("at offset ^1", () => expect(fn.elementAtAsync([1, 2, 3], Index.fromEnd(1))).resolves.toBe(3));
        it("at offset ^2", () => expect(fn.elementAtAsync([1, 2, 3], Index.fromEnd(2))).resolves.toBe(2));
        it("at offset greater than size", () => expect(fn.elementAtAsync([1, 2, 3], 3)).resolves.toBeUndefined());
        it("at negative offset greater than size", () => expect(fn.elementAtAsync([1, 2, 3], -4)).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => fn.elementAtAsync([], value)).toThrow(error));
    });
    describe("span()", () => {
        it("gets initial span", async () => expect(Promise.all((await fn.spanAsync([1, 2, 3, 4], x => x < 3)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[1, 2], [3, 4]]));
        it("gets whole source", async () => expect(Promise.all((await fn.spanAsync([1, 2, 3, 4], x => x < 5)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", async () => expect(Promise.all((await fn.spanAsync([1, 2, 3, 4], x => x < 1)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.spanAsync([], value)).toThrow(error));
    });
    describe("spanUntil()", () => {
        it("gets initial span", async () => expect(Promise.all((await fn.spanUntilAsync([1, 2, 3, 4], x => x > 2)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[1, 2], [3, 4]]));
        it("gets whole source", async () => expect(Promise.all((await fn.spanUntilAsync([1, 2, 3, 4], x => x > 4)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", async () => expect(Promise.all((await fn.spanUntilAsync([1, 2, 3, 4], x => x > 0)).map(x => fn.toArrayAsync(x)))).resolves.toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.spanUntilAsync([], value)).toThrow(error));
    });
    describe("forEach()", () => {
        it("called for each item", async () => {
            const received: number[] = [];
            await fn.forEachAsync([1, 2, 3, 4], v => { received.push(v); });
            expect(received).toEqual([1, 2, 3, 4]);
        });
        // node's for..of does not call return :/
        it("close iterator on error", async () => {
            let returnWasCalled = false;
            const iterator: IterableIterator<number> = {
                [Symbol.iterator]() { return this; },
                next() { return { value: 1, done: false } },
                return() { returnWasCalled = true; return { value: undefined, done: true } }
            };
            const error = new Error();
            await expect(fn.forEachAsync(iterator, () => { throw error; })).rejects.toThrow(error);
            expect(returnWasCalled).toBe(true);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => fn.forEachAsync([], value)).toThrow(error));
    });
    describe("unzip()", () => {
        it("unzips", () => expect(fn.unzipAsync([[1, "a"], [2, "b"]] as [number, string][])).resolves.toEqual([[1, 2], ["a", "b"]]));
    });
    describe("toArray()", () => {
        it("creates array", () => expect(fn.toArrayAsync([1, 2, 3, 4])).resolves.toEqual([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toArrayAsync([], value)).toThrow(error));
    });
    describe("toSet()", () => {
        it("result is a Set", () => expect(fn.toSetAsync([1, 2, 3, 4])).resolves.toBeInstanceOf(Set));
        it("creates with right size", () => expect(fn.toSetAsync([1, 2, 3, 4])).resolves.toHaveProperty("size", 4));
        it("creates set in order", () => expect(fn.toSetAsync([1, 2, 3, 4])).resolves.toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toSetAsync([], value)).toThrow(error));
    });
    describe("toHashSet()", () => {
        it("result is a HashSet", () => expect(fn.toHashSetAsync([1, 2, 3, 4])).resolves.toBeInstanceOf(HashSet));
        it("creates with right size", () => expect(fn.toHashSetAsync([1, 2, 3, 4])).resolves.toHaveProperty("size", 4));
        it("creates set in order", () => expect(fn.toHashSetAsync([1, 2, 3, 4])).resolves.toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'equaler' is $type", ({ value, error }) => expect(() => fn.toHashSetAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equaler' is $type", ({ value, error }) => expect(() => fn.toHashSetAsync([], x => x, value)).toThrow(error));
    });
    describe("toMap()", () => {
        it("result is a Map", () => expect(fn.toMapAsync([1, 2, 3, 4], x => x)).resolves.toBeInstanceOf(Map));
        it("creates with right size", () => expect(fn.toMapAsync([1, 2, 3, 4], x => x)).resolves.toHaveProperty("size", 4));
        it("creates with correct keys", async () => expect((await fn.toMapAsync([1, 2, 3, 4], x => x * 2)).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toMapAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toMapAsync([], x => x, value)).toThrow(error));
    });
    describe("toHashMap()", () => {
        it("result is a HashMap", () => expect(fn.toHashMapAsync([1, 2, 3, 4], x => x)).resolves.toBeInstanceOf(HashMap));
        it("creates with right size", () => expect(fn.toHashMapAsync([1, 2, 3, 4], x => x)).resolves.toHaveProperty("size", 4));
        it("creates with correct keys", async () => expect((await fn.toHashMapAsync([1, 2, 3, 4], x => x * 2)).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toHashMapAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toHashMapAsync([], x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toHashMapAsync([], x => x, x => x, value)).toThrow(error));
    });
    describe("toLookup()", () => {
        it("result is a Lookup", () => expect(fn.toLookupAsync([1, 2, 3, 4], x => x)).resolves.toBeInstanceOf(Lookup));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toLookupAsync([], value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toLookupAsync([], x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => fn.toLookupAsync([], x => x, x => x, value)).toThrow(error));
    });
    describe("toObject()", () => {
        it("creates object with prototype", async () => {
            const proto = {};
            const obj: any = await fn.toObjectAsync(["a", "b"], proto, x => x);
            expect(obj).toHaveProperty("a", "a");
            expect(obj).toHaveProperty("b", "b");
            expect(Object.getPrototypeOf(obj)).toBe(proto);
        });
        it("creates object with null prototype", async () => {
            const obj: any = await fn.toObjectAsync(["a", "b"], null, x => x);
            expect(obj.a).toBe("a");
            expect(Object.getPrototypeOf(obj)).toBe(null);
        });
        it.each`
            type              | value         | error
            ${"non-object"}   | ${""}         | ${TypeError}
        `("throws if 'prototype' is $type", ({ value, error }) => expect(() => fn.toObjectAsync([], value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => fn.toObjectAsync([], null, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => fn.toObjectAsync([], null, x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'descriptorSelector' is $type", ({ value, error }) => expect(() => fn.toObjectAsync([], null, x => x, x => x, value)).toThrow(error));
    });
    describe("copyTo", () => {
        it("copies to array", () => {
            expect(fn.copyToAsync([1, 2, 3, 4], Array(4))).resolves.toEqualSequence([1, 2, 3, 4]);
        });
    });
});
describe("Hierarchy", () => {
    describe("toHierarchy()", () => {
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-provider"} | ${{}}         | ${TypeError}
        `("throws if 'provider' is $type", ({ value, error }) => expect(() => fn.toHierarchyAsync([], value)).toThrow(error));
    });
    describe("root()", () => {
        it("gets root", () => expect(fn.rootAsync(fn.toHierarchyAsync([nodes.nodeAAAA], nodes.nodeHierarchy))).toEqualSequenceAsync([nodes.nodeA]));
        it("of undefined", () => expect(fn.rootAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy))).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.rootAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("ancestors()", () => {
        it("gets ancestors", () => expect(fn.ancestorsAsync(fn.toHierarchyAsync([nodes.nodeAAAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(fn.ancestorsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.ancestorsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("ancestorsAndSelf()", () => {
        it("gets ancestors and self", () => expect(fn.ancestorsAndSelfAsync(fn.toHierarchyAsync([nodes.nodeAAAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(fn.ancestorsAndSelfAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.ancestorsAndSelfAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("parents()", () => {
        it("gets parents", () => expect(fn.parentsAsync(fn.toHierarchyAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAA, nodes.nodeAA, nodes.nodeAA]));
        it("of undefined", () => expect(fn.parentsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.parentsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("self()", () => {
        it("gets self", () => expect(fn.selfAsync(fn.toHierarchyAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(fn.selfAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.selfAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("siblings()", () => {
        it("gets siblings", () => expect(fn.siblingsAsync(fn.toHierarchyAsync([nodes.nodeAAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(fn.siblingsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.siblingsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("siblingsAndSelf()", () => {
        it("gets siblings and self", () => expect(fn.siblingsAndSelfAsync(fn.toHierarchyAsync([nodes.nodeAAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(fn.siblingsAndSelfAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.siblingsAndSelfAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("precedingSiblings()", () => {
        it("gets siblings before self", () => expect(fn.precedingSiblingsAsync(fn.toHierarchyAsync([nodes.nodeAAB], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA]));
        it("of undefined", () => expect(fn.precedingSiblingsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.precedingSiblingsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("preceding()", () => {
        it("gets nodes before self", () => expect(fn.precedingAsync(fn.toHierarchyAsync([nodes.nodeAB], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAC, nodes.nodeAAB, nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.precedingAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("followingSiblings()", () => {
        it("gets siblings after self", () => expect(fn.followingSiblingsAsync(fn.toHierarchyAsync([nodes.nodeAAB], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(fn.followingSiblingsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.followingSiblingsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("following()", () => {
        it("gets nodes after self", () => expect(fn.followingAsync(fn.toHierarchyAsync([nodes.nodeAB], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeACA, nodes.nodeAC]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.followingAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("children()", () => {
        it("gets children", () => expect(fn.childrenAsync(fn.toHierarchyAsync([nodes.nodeAA, nodes.nodeAB, nodes.nodeAC], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC, nodes.nodeACA]));
        it("of undefined", () => expect(fn.childrenAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy))).toEqualSequenceAsync([]));
        it("of undefined children", () => expect(fn.childrenAsync(fn.toHierarchyAsync(books.books, books.bookHierarchy))).toEqualSequenceAsync([]));
        it("of undefined child", () => expect(fn.childrenAsync(fn.toHierarchyAsync([nodes.badNode], nodes.nodeHierarchy))).toEqualSequenceAsync([]));
        it("with predicate", () => expect(fn.childrenAsync(fn.toHierarchyAsync<nodes.Node>([nodes.nodeAA], nodes.nodeHierarchy), x => !!x.marker)).toEqualSequenceAsync([nodes.nodeAAB]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.childrenAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("nthChild()", () => {
        it("gets nthChild(0)", () => expect(fn.nthChildAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), 0)).toEqualSequenceAsync([nodes.nodeAAA]));
        it("gets nthChild(2)", () => expect(fn.nthChildAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), 2)).toEqualSequenceAsync([nodes.nodeAAC]));
        it("gets nthChild(-1)", () => expect(fn.nthChildAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), -1)).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(fn.nthChildAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), 0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => fn.nthChildAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.nthChildAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), 0, value)).toThrow(error));
    });
    describe("firstChild(", () => {
        it("gets firstChild()", () => expect(fn.firstChildAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA]));
        it("of undefined", () => expect(fn.firstChildAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.firstChildAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("lastChild(", () => {
        it("gets lastChild()", () => expect(fn.lastChildAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(fn.lastChildAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.lastChildAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("descendants()", () => {
        it("gets descendants", () => expect(fn.descendantsAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(fn.descendantsAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.descendantsAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
    describe("descendantsAndSelf()", () => {
        it("gets descendants and self", () => expect(fn.descendantsAndSelfAsync(fn.toHierarchyAsync([nodes.nodeAA], nodes.nodeHierarchy), )).toEqualSequenceAsync([nodes.nodeAA, nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(fn.descendantsAndSelfAsync(fn.toHierarchyAsync([undefined!], nodes.nodeHierarchy), )).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => fn.descendantsAndSelfAsync(fn.toHierarchyAsync([], nodes.nodeHierarchy), value)).toThrow(error));
    });
});
