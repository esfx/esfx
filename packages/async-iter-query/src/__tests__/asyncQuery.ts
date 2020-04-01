/// <reference types="../../../../internal/jest-sequence" />

import { Lookup } from "@esfx/iter-lookup";
import { AsyncQuery } from "../";
import * as users from "./data/users";
import * as nodes from "./data/nodes";
import * as books from "./data/books";
import { Comparable } from '@esfx/equatable';
import { HashSet } from '@esfx/collections-hashset';
import { HashMap } from '@esfx/collections-hashmap';
import { Index } from '@esfx/interval';

describe("Queries", () => {
    describe("empty()", () => {
        it("is empty", () => expect(AsyncQuery.empty()).toEqualSequenceAsync([]));
    });
    describe("once()", () => {
        it("is once", () => expect(AsyncQuery.once(1)).toEqualSequenceAsync([1]));
    });
    describe("repeat()", () => {
        it("0 times", () => expect(AsyncQuery.repeat("a", 0)).toEqualSequenceAsync([]));
        it("5 times", () => expect(AsyncQuery.repeat("a", 5)).toEqualSequenceAsync(["a", "a", "a", "a", "a"]));
        it.each`
            type            | count         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ count, error }) => expect(() => AsyncQuery.repeat("a", count)).toThrow(error));
    });
    describe("continuous()", () => {
        it("after 5 elements", () => expect(AsyncQuery.continuous(1)).toStartWithSequenceAsync([1, 1, 1, 1, 1]));
        it("after 10 elements", () => expect(AsyncQuery.continuous(1)).toStartWithSequenceAsync([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
    });
    describe("generate()", () => {
        it("even numbers", () => expect(AsyncQuery.generate(3, i => i * 2)).toEqualSequenceAsync([0, 2, 4]));
        it.each`
            type            | value         | error
            ${"undefined"}  | ${undefined}  | ${TypeError}
            ${"null"}       | ${null}       | ${TypeError}
            ${"non-number"} | ${""}         | ${TypeError}
            ${"negative"}   | ${-1}         | ${RangeError}
            ${"NaN"}        | ${NaN}        | ${RangeError}
            ${"Infinity"}   | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => AsyncQuery.generate(value, () => {})).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'generator' is $type", ({ value, error }) => expect(() => AsyncQuery.generate(1, value)).toThrow(error));
    });
    describe("consume()", () => {
        it("consumes", async () => {
            const q = AsyncQuery.consume(async function* () { yield 1; } ());
            await expect(q).toEqualSequenceAsync([1]);
            await expect(q).toEqualSequenceAsync([]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterator"} | ${{}}         | ${TypeError}
        `("throws if 'iterator' is $type", ({ value, error }) => expect(() => AsyncQuery.consume(value)).toThrow(error));
    });
});
describe("Subqueries", () => {
    describe("filter()", () => {
        it("filters", () => expect(AsyncQuery.from([1, 2, 3]).filter(x => x >= 2)).toEqualSequenceAsync([2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).filter(value)).toThrow(error));
    });
    describe("filterDefined()", () => {
        it("filterDefined()", () => expect(AsyncQuery.from([1, undefined, 2]).filterDefined()).toEqualSequenceAsync([1, 2]));
    });
    describe("map()", () => {
        it("maps", () => expect(AsyncQuery.from([1, 2, 3]).map(x => x * 2)).toEqualSequenceAsync([2, 4, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).map(value)).toThrow(error));
    });
    describe("flatMap()", () => {
        it("flatMaps", () => expect(AsyncQuery.from([1, 2, 3]).flatMap(x => [x, 0])).toEqualSequenceAsync([1, 0, 2, 0, 3, 0]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'projection' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).flatMap(value)).toThrow(error));
    });
    describe("tap()", () => {
        it("taps", async () => {
            const received: number[] = [];
            const result = AsyncQuery.from([1, 2, 3, 4]).tap(v => { received.push(v); });
            await expect(result).toEqualSequenceAsync([1, 2, 3, 4]);
            await expect(received).toEqual([1, 2, 3, 4]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).tap(value)).toThrow(error));
    });
    describe("reverse()", () => {
        it("reverses", () => expect(AsyncQuery.from([1, 2, 3]).reverse()).toEqualSequenceAsync([3, 2, 1]));
    });
    describe("drop()", () => {
        it("drops", () => expect(AsyncQuery.from([1, 2, 3]).drop(1)).toEqualSequenceAsync([2, 3]));
        it("drop none", () => expect(AsyncQuery.from([1, 2, 3]).drop(0)).toEqualSequenceAsync([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).drop(value)).toThrow(error));
    });
    describe("dropRight()", () => {
        it("drops right", () => expect(AsyncQuery.from([1, 2, 3]).dropRight(1)).toEqualSequenceAsync([1, 2]));
        it("drops right none", () => expect(AsyncQuery.from([1, 2, 3]).dropRight(0)).toEqualSequenceAsync([1, 2, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).drop(value)).toThrow(error));
    });
    describe("dropWhile()", () => {
        it("drops while", () => expect(AsyncQuery.from([1, 2, 1, 3]).dropWhile(x => x < 2)).toEqualSequenceAsync([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).dropWhile(value)).toThrow(error));
    });
    describe("dropUntil()", () => {
        it("drops until", () => expect(AsyncQuery.from([1, 2, 1, 3]).dropUntil(x => x >= 2)).toEqualSequenceAsync([2, 1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).dropUntil(value)).toThrow(error));
    });
    describe("take()", () => {
        it("takes", () => expect(AsyncQuery.from([1, 2, 3]).take(2)).toEqualSequenceAsync([1, 2]));
        it("takes none", () => expect(AsyncQuery.from([1, 2, 3]).take(0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).take(value)).toThrow(error));
    });
    describe("takeRight()", () => {
        it("takes right", () => expect(AsyncQuery.from([1, 2, 3]).takeRight(2)).toEqualSequenceAsync([2, 3]));
        it("takes right none", () => expect(AsyncQuery.from([1, 2, 3]).takeRight(0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'count' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).takeRight(value)).toThrow(error));
    });
    describe("takeWhile()", () => {
        it("takes while", () => expect(AsyncQuery.from([1, 2, 3, 1]).takeWhile(x => x < 3)).toEqualSequenceAsync([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).takeWhile(value)).toThrow(error));
    });
    describe("takeUntil()", () => {
        it("takes until", () => expect(AsyncQuery.from([1, 2, 3, 1]).takeUntil(x => x >= 3)).toEqualSequenceAsync([1, 2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).takeUntil(value)).toThrow(error));
    });
    describe("intersect()", () => {
        it("intersects", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).intersect([1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 3]));
        it("intersects none", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).intersect([])).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).intersect(value)).toThrow(error));
    });
    describe("union()", () => {
        it("unions", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).union([1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 2, 3, 4, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).union(value)).toThrow(error));
    });
    describe("except()", () => {
        it("excepts", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).except([2, 4, 5])).toEqualSequenceAsync([1, 3]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).except(value)).toThrow(error));
    });
    describe("symmetricDifference()", () => {
        it("symmetricDifference", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).symmetricDifference([2, 4, 5])).toEqualSequenceAsync([1, 3, 5]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).symmetricDifference(value)).toThrow(error));
    });
    describe("concat()", () => {
        it("concats", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).concat([1, 3, 3, 5, 7])).toEqualSequenceAsync([1, 1, 2, 3, 4, 1, 3, 3, 5, 7]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).concat(value)).toThrow(error));
    });
    describe("distinct()", () => {
        it("is distinct", () => expect(AsyncQuery.from([1, 1, 2, 3, 4]).distinct()).toEqualSequenceAsync([1, 2, 3, 4]));
    });
    describe("append()", () => {
        it("appends", () => expect(AsyncQuery.from([1, 2, 3]).append(5)).toEqualSequenceAsync([1, 2, 3, 5]));
    });
    describe("prepend()", () => {
        it("prepends", () => expect(AsyncQuery.from([1, 2, 3]).prepend(5)).toEqualSequenceAsync([5, 1, 2, 3]));
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
        `("patches with ($start, $drop, $range)", ({ start, drop, range, expected }) => expect(AsyncQuery.from([1, 2, 3]).patch(start, drop, range)).toEqualSequenceAsync(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'start' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).patch(value, 0, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'dropCount' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).patch(0, value, [])).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'range' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).patch(0, 0, value)).toThrow(error));
    });
    describe("defaultIfEmpty()", () => {
        it("not empty", () => expect(AsyncQuery.from([1, 2, 3]).defaultIfEmpty(9)).toEqualSequenceAsync([1, 2, 3]));
        it("empty", () => expect(AsyncQuery.from<number>([]).defaultIfEmpty(9)).toEqualSequenceAsync([9]));
    });
    describe("scan()", () => {
        it("scans sums", () => expect(AsyncQuery.from([1, 2, 3]).scan((c, e) => c + e, 0)).toEqualSequenceAsync([1, 3, 6]));
        it("scans sums no seed", () => expect(AsyncQuery.from([1, 2, 3]).scan((c, e) => c + e)).toEqualSequenceAsync([3, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).scan(value)).toThrow(error));
    });
    describe("scanRight()", () => {
        it("scans sums from right", () => expect(AsyncQuery.from([1, 2, 3]).scanRight((c, e) => c + e, 0)).toEqualSequenceAsync([3, 5, 6]));
        it("scans sums from right no seed", () => expect(AsyncQuery.from([1, 2, 3]).scanRight((c, e) => c + e)).toEqualSequenceAsync([5, 6]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).scanRight(value)).toThrow(error));
    });
    // describe("through()", () => {
    //     it("pipes through", () => expect(AsyncQuery.from([1, 2]).through(q => {
    //         expect(q).toEqualSequenceAsync([1, 2]);
    //         return AsyncQuery.from([3, 4]).from();
    //     })).toEqualSequenceAsync([3, 4]));
    //     it.each`
    //         type              | value         | error
    //         ${"undefined"}    | ${undefined}  | ${TypeError}
    //         ${"null"}         | ${null}       | ${TypeError}
    //         ${"non-function"} | ${""}         | ${TypeError}
    //     `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).through(value)).toThrow(error));
    // });
    describe("materialize()", () => {
        it("materializes", async () => {
            const received: number[] = [];
            const q = AsyncQuery.from([1, 2, 3, 4]).tap(x => { received.push(x); }).materialize();
            await expect(q).toEqualSequenceAsync([1, 2, 3, 4]);
            expect(received).toEqual([1, 2, 3, 4]);
        });
    });
});
describe("Grouping", () => {
    describe("pageBy()", () => {
        it("pages with partial last page", () => expect(AsyncQuery
                .from([1, 2, 3])
                .pageBy(2)
                .map(x => Array.from(x))
                .toArray()).resolves.toEqual([[1, 2], [3]]));
        it("pages exact", () => expect(AsyncQuery
                .from([1, 2, 3, 4])
                .pageBy(2)
                .map(x => Array.from(x))
                .toArray()).resolves.toEqual([[1, 2], [3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"0"}            | ${0}          | ${RangeError}
            ${"negative"}     | ${-1}         | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'pageSize' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).pageBy(value)).toThrow(error));
    });
    describe("spanMap()", () => {
        it("odd/even spans", () => expect(AsyncQuery
            .from([1, 3, 2, 4, 5, 7])
            .spanMap(k => k % 2 === 1)
            .map(g => Array.from(g))
            .toArray()).resolves.toEqual([[1, 3], [2, 4], [5, 7]]));
        it("empty", () => expect(AsyncQuery.from([]).spanMap(k => k % 2 === 1)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).spanMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).spanMap(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'spanSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).spanMap(x => x, x => x, value)).toThrow(error));
    });
    describe("groupBy()", () => {
        it("group by role", () => expect(AsyncQuery
            .from(users.users)
            .groupBy(u => u.role, u => u.name, (role, names) => ({ role: role, names: [...names] }))
            .toArray()).resolves.toEqual([
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
            await expect(AsyncQuery
                .from(data)
                .groupBy(row => row.category, row => row.value, (category, values) => ({ category, values: [...values] }))
                .toArray()).resolves.toEqual([
                    { category: "a", values: [1, 2, 3] },
                    { category: sym, values: [4] }
                ]);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupBy(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupBy(x => x, x => x, value)).toThrow(error));
    });
});
describe("Joins", () => {
    describe("groupJoin()", () => {
        it("joins groups", () => expect(AsyncQuery
            .from(users.roles)
            .groupJoin(users.users, g => g.name, u => u.role, (role, users) => ({ role: role, users: [...users] }))
            .toArray()).resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupJoin(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupJoin([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupJoin([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).groupJoin([], x => x, x => x, value)).toThrow(error));
    });
    describe("join()", () => {
        it("joins", () => expect(AsyncQuery
            .from(users.roles)
            .join(users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))
            .toArray()).resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).join(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).join([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).join([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).join([], x => x, x => x, value)).toThrow(error));
    });
    describe("fullJoin()", () => {
        it("joins", () => expect(AsyncQuery
            .from(users.roles)
            .fullJoin(users.users, g => g.name, u => u.role, (role, user) => ({ role: role, user: user }))
            .toArray()).resolves.toEqual([
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
        `("throws if 'inner' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).fullJoin(value, x => x, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'outerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).fullJoin([], value, x => x, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'innerKeySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).fullJoin([], x => x, value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).fullJoin([], x => x, x => x, value)).toThrow(error));
    });
    describe("zip()", () => {
        it.each`
            left            | right                 | expected
            ${[1, 2, 3]}    | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"], [3, "c"]]}
            ${[1, 2]}       | ${["a", "b", "c"]}    | ${[[1, "a"], [2, "b"]]}
            ${[1, 2, 3]}    | ${["a", "b"]}         | ${[[1, "a"], [2, "b"]]}
        `("zips with $left, $right", ({ left, right, expected }) => expect(AsyncQuery.from(left).zip(right).toArray()).resolves.toEqual(expected));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'right' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).zip(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'selector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).zip([], value)).toThrow(error));
    });
});
describe("Ordering", () => {
    describe("orderBy()", () => {
        it("orders", () => expect(AsyncQuery.from([3, 1, 2]).orderBy(x => x)).toEqualSequenceAsync([1, 2, 3]));
        it("orders same", async () => {
            const q = await AsyncQuery.from(books.books_same).orderBy(x => x.title).toArray();
            expect(q[0]).toBe(books.bookB2);
            expect(q[1]).toBe(books.bookB2_same);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(x => x, value)).toThrow(error));
    });
    describe("orderByDescending()", () => {
        it("orders", () => expect(AsyncQuery.from([3, 1, 2]).orderByDescending(x => x)).toEqualSequenceAsync([3, 2, 1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderByDescending(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderByDescending(x => x, value)).toThrow(error));
    });
    describe("thenBy()", () => {
        it("preserves preceding order", () => expect(AsyncQuery.from(books.books).orderBy(x => x.title).thenBy(x => x.id))
            .toEqualSequenceAsync([books.bookA3, books.bookA4, books.bookB1, books.bookB2]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(x => x).thenBy(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(x => x).thenBy(x => x, value)).toThrow(error));
    });
    describe("thenByDescending()", () => {
        it("preserves preceding order", () => expect(AsyncQuery.from(books.books).orderBy(x => x.title).thenByDescending(x => x.id)).toEqualSequenceAsync([books.bookA4, books.bookA3, books.bookB2, books.bookB1]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(x => x).thenByDescending(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-comparer"} | ${{}}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).orderBy(x => x).thenByDescending(x => x, value)).toThrow(error));
    });
});
describe("Scalars", () => {
    describe("reduce()", () => {
        it("reduces sum", () => expect(AsyncQuery.from([1, 2, 3]).reduce((c, e) => c + e)).resolves.toBe(6));
        it("reduces average", () => expect(AsyncQuery.from([1, 2, 3]).reduce((c, e) => c + e, 0, (r, c) => r / c)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).reduce(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).reduce(x => x, undefined, value)).toThrow(error));
    });
    describe("reduceRight()", () => {
        it("reduces sum", () => expect(AsyncQuery.from([1, 2, 3]).reduceRight((c, e) => c + e)).resolves.toBe(6));
        it("reduces average", () => expect(AsyncQuery.from([1, 2, 3]).reduceRight((c, e) => c + e, 0, (r, c) => r / c)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'accumulator' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).reduceRight(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'resultSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).reduceRight(x => x, undefined, value)).toThrow(error));
    });
    describe("count()", () => {
        it("counts array", () => expect(AsyncQuery.from([1, 2, 3]).count()).resolves.toBe(3));
        it("counts set", () => expect(AsyncQuery.from(new Set([1, 2, 3])).count()).resolves.toBe(3));
        it("counts map", () => expect(AsyncQuery.from(new Map([[1, 1], [2, 2], [3, 3]])).count()).resolves.toBe(3));
        it("counts odds", () => expect(AsyncQuery.from([1, 2, 3]).count(x => x % 2 === 1)).resolves.toBe(2));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).count(value)).toThrow(error));
    });
    describe("first()", () => {
        it("finds first", () => expect(AsyncQuery.from([1, 2, 3]).first()).resolves.toBe(1));
        it("finds first even", () => expect(AsyncQuery.from([1, 2, 3, 4]).first(x => x % 2 === 0)).resolves.toBe(2));
        it("finds undefined when empty", () => expect(AsyncQuery.from([]).first()).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).first(value)).toThrow(error));
    });
    describe("last()", () => {
        it("finds last", () => expect(AsyncQuery.from([1, 2, 3]).last()).resolves.toBe(3));
        it("finds last odd", () => expect(AsyncQuery.from([1, 2, 3, 4]).last(x => x % 2 === 1)).resolves.toBe(3));
        it("finds undefined when empty", () => expect(AsyncQuery.from([]).last()).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).last(value)).toThrow(error));
    });
    describe("single()", () => {
        it("finds single", () => expect(AsyncQuery.from([1]).single()).resolves.toBe(1));
        it("finds undefined when many", () => expect(AsyncQuery.from([1, 2, 3]).single()).resolves.toBeUndefined());
        it("finds undefined when empty", () => expect(AsyncQuery.from([]).single()).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).single(value)).toThrow(error));
    });
    describe("min()", () => {
        it("finds minimum", () => expect(AsyncQuery.from([5, 6, 3, 9, 4]).min()).resolves.toBe(3));
        it("finds undefined when empty", () => expect(AsyncQuery.from([]).min()).resolves.toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            return expect(AsyncQuery.from([a, b]).min()).resolves.toBe(a);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).min(value)).toThrow(error));
    });
    describe("max()", () => {
        it("finds maximum", () => expect(AsyncQuery.from([5, 6, 3, 9, 4]).max()).resolves.toBe(9));
        it("finds undefined when empty", () => expect(AsyncQuery.from([]).max()).resolves.toBeUndefined());
        it("uses comparable", () => {
            const a = { [Comparable.compareTo](x: any) { return -1; } };
            const b = { [Comparable.compareTo](x: any) { return +1; } };
            expect(AsyncQuery.from([a, b]).max()).resolves.toBe(b);
        });
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'comparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).max(value)).toThrow(error));
    });
    describe("sum()", () => {
        it("calculates sum", () => expect(AsyncQuery.from([1, 2, 3]).sum()).resolves.toBe(6));
        it("calculates sum using projection", () => expect(AsyncQuery.from(["1", "2", "3"]).sum(x => +x)).resolves.toBe(6));
        it("calculates zero sum when empty", () => expect(AsyncQuery.from([]).sum()).resolves.toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).sum(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(AsyncQuery.from([value]).sum()).rejects.toThrow(error));
    });
    describe("average()", () => {
        it("calculates average", () => expect(AsyncQuery.from([1, 2, 3]).average()).resolves.toBe(2));
        it("calculates average using projection", () => expect(AsyncQuery.from(["1", "2", "3"]).average(x => +x)).resolves.toBe(2));
        it("calculates zero average when empty", () => expect(AsyncQuery.from([]).average()).resolves.toBe(0));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).average(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${{}}         | ${TypeError}
        `("throws if sequence contains $type", ({ value, error }) => expect(AsyncQuery.from([value]).average()).rejects.toThrow(error));
    });
    describe("some()", () => {
        it("false when empty", () => expect(AsyncQuery.from([]).some()).resolves.toBe(false));
        it("true when one or more", () => expect(AsyncQuery.from([1]).some()).resolves.toBe(true));
        it("false when no match", () => expect(AsyncQuery.from([1, 3]).some(x => x === 2)).resolves.toBe(false));
        it("true when matched", () => expect(AsyncQuery.from([1, 3]).some(x => x === 3)).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).some(value)).toThrow(error));
    });
    describe("every()", () => {
        it("false when empty", () => expect(AsyncQuery.from([]).every(x => x % 2 === 1)).resolves.toBe(false));
        it("false when no match", () => expect(AsyncQuery.from([2, 4]).every(x => x % 2 === 1)).resolves.toBe(false));
        it("false when partial match", () => expect(AsyncQuery.from([1, 2]).every(x => x % 2 === 1)).resolves.toBe(false));
        it("true when fully matched", () => expect(AsyncQuery.from([1, 3]).every(x => x % 2 === 1)).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).every(value)).toThrow(error));
    });
    describe("corresponds()", () => {
        it("true when both match", () => expect(AsyncQuery.from([1, 2, 3]).corresponds([1, 2, 3])).resolves.toBe(true));
        it("false when source has fewer elements", () => expect(AsyncQuery.from([1, 2]).corresponds([1, 2, 3])).resolves.toBe(false));
        it("false when other has fewer elements", () => expect(AsyncQuery.from([1, 2, 3]).corresponds([1, 2])).resolves.toBe(false));
        it("false when other has elements in different order", () => expect(AsyncQuery.from([1, 2, 3]).corresponds([1, 3, 2])).resolves.toBe(false));
        it("false when other has different elements", () => expect(AsyncQuery.from([1, 2, 3]).corresponds([1, 2, 4])).resolves.toBe(false));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).corresponds(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).corresponds([], value)).toThrow(error));
    });
    describe("includes()", () => {
        it("true when present", () => expect(AsyncQuery.from([1, 2, 3]).includes(2)).resolves.toBe(true));
        it("false when missing", () => expect(AsyncQuery.from([1, 2, 3]).includes(4)).resolves.toBe(false));
        it("false when empty", () => expect(AsyncQuery.from<number>([]).includes(4)).resolves.toBe(false));
    });
    describe("includesSequence()", () => {
        it("true when included", () => expect(AsyncQuery.from([1, 2, 3, 4]).includesSequence([2, 3])).resolves.toBe(true));
        it("false when wrong order", () => expect(AsyncQuery.from([1, 2, 3, 4]).includesSequence([3, 2])).resolves.toBe(false));
        it("false when not present", () => expect(AsyncQuery.from([1, 2, 3, 4]).includesSequence([5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(AsyncQuery.from<number>([]).includesSequence([1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(AsyncQuery.from([1, 2, 3, 4]).includesSequence([])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).includesSequence(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).includesSequence([], value)).toThrow(error));
    });
    describe("startsWith()", () => {
        it("true when starts with other", () => expect(AsyncQuery.from([1, 2, 3, 4]).startsWith([1, 2])).resolves.toBe(true));
        it("false when not at start", () => expect(AsyncQuery.from([1, 2, 3, 4]).startsWith([2, 3])).resolves.toBe(false));
        it("false when wrong order", () => expect(AsyncQuery.from([1, 2, 3, 4]).startsWith([2, 1])).resolves.toBe(false));
        it("false when not present", () => expect(AsyncQuery.from([1, 2, 3, 4]).startsWith([5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(AsyncQuery.from<number>([]).startsWith([1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(AsyncQuery.from([1, 2, 3, 4]).startsWith([])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).startsWith(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).startsWith([], value)).toThrow(error));
    });
    describe("endsWith()", () => {
        it("true when ends with other", () => expect(AsyncQuery.from([1, 2, 3, 4]).endsWith([3, 4])).resolves.toBe(true));
        it("false when not at end", () => expect(AsyncQuery.from([1, 2, 3, 4]).endsWith([2, 3])).resolves.toBe(false));
        it("false when wrong order", () => expect(AsyncQuery.from([1, 2, 3, 4]).endsWith([4, 3])).resolves.toBe(false));
        it("false when not present", () => expect(AsyncQuery.from([1, 2, 3, 4]).endsWith([5, 6])).resolves.toBe(false));
        it("false when source empty", () => expect(AsyncQuery.from<number>([]).endsWith([1, 2])).resolves.toBe(false));
        it("true when other empty", () => expect(AsyncQuery.from([1, 2, 3, 4]).endsWith([])).resolves.toBe(true));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-iterable"} | ${{}}         | ${TypeError}
        `("throws if 'other' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).endsWith(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equalityComparison' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).endsWith([], value)).toThrow(error));
    });
    describe("elementAt()", () => {
        it("at offset 0", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(0)).resolves.toBe(1));
        it("at offset 1", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(1)).resolves.toBe(2));
        it("at offset -1", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(-1)).resolves.toBe(3));
        it("at offset -2", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(-2)).resolves.toBe(2));
        it("at offset ^0", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(Index.fromEnd(0))).resolves.toBe(undefined));
        it("at offset ^1", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(Index.fromEnd(1))).resolves.toBe(3));
        it("at offset ^2", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(Index.fromEnd(2))).resolves.toBe(2));
        it("at offset greater than size", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(3)).resolves.toBeUndefined());
        it("at negative offset greater than size", () => expect(AsyncQuery.from([1, 2, 3]).elementAt(-4)).resolves.toBeUndefined());
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).elementAt(value)).toThrow(error));
    });
    describe("span()", () => {
        it("gets initial span", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).span(x => x < 3)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[1, 2], [3, 4]]));
        it("gets whole source", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).span(x => x < 5)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).span(x => x < 1)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).span(value)).toThrow(error));
    });
    describe("spanUntil()", () => {
        it("gets initial span", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).spanUntil(x => x > 2)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[1, 2], [3, 4]]));
        it("gets whole source", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).spanUntil(x => x > 4)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[1, 2, 3, 4], []]));
        it("gets no initial span", async () => expect(Promise.all((await AsyncQuery.from([1, 2, 3, 4]).spanUntil(x => x > 0)).map(x => AsyncQuery.from(x).toArray()))).resolves.toEqual([[], [1, 2, 3, 4]]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).spanUntil(value)).toThrow(error));
    });
    describe("forEach()", () => {
        it("called for each item", async () => {
            const received: number[] = [];
            await AsyncQuery.from([1, 2, 3, 4]).forEach(v => { received.push(v); });
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
            await expect(AsyncQuery.from(iterator).forEach(() => { throw error; })).rejects.toThrow(error);
            expect(returnWasCalled).toBe(true);
        });
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'callback' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).forEach(value)).toThrow(error));
    });
    describe("unzip()", () => {
        it("unzips", () => expect(AsyncQuery.from([[1, "a"], [2, "b"]]).unzip()).resolves.toEqual([[1, 2], ["a", "b"]]));
    });
    describe("toArray()", () => {
        it("creates array", () => expect(AsyncQuery.from([1, 2, 3, 4]).toArray()).resolves.toEqual([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toArray(value)).toThrow(error));
    });
    describe("toSet()", () => {
        it("result is a Set", () => expect(AsyncQuery.from([1, 2, 3, 4]).toSet()).resolves.toBeInstanceOf(Set));
        it("creates with right size", () => expect(AsyncQuery.from([1, 2, 3, 4]).toSet()).resolves.toHaveProperty("size", 4));
        it("creates set in order", () => expect(AsyncQuery.from([1, 2, 3, 4]).toSet()).resolves.toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toSet(value)).toThrow(error));
    });
    describe("toHashSet()", () => {
        it("result is a HashSet", () => expect(AsyncQuery.from([1, 2, 3, 4]).toHashSet()).resolves.toBeInstanceOf(HashSet));
        it("creates with right size", () => expect(AsyncQuery.from([1, 2, 3, 4]).toHashSet()).resolves.toHaveProperty("size", 4));
        it("creates set in order", () => expect(AsyncQuery.from([1, 2, 3, 4]).toHashSet()).resolves.toEqualSequence([1, 2, 3, 4]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'equaler' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHashSet(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'equaler' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHashSet(x => x, value)).toThrow(error));
    });
    describe("toMap()", () => {
        it("result is a Map", () => expect(AsyncQuery.from([1, 2, 3, 4]).toMap(x => x)).resolves.toBeInstanceOf(Map));
        it("creates with right size", () => expect(AsyncQuery.from([1, 2, 3, 4]).toMap(x => x)).resolves.toHaveProperty("size", 4));
        it("creates with correct keys", async () => expect((await AsyncQuery.from([1, 2, 3, 4]).toMap(x => x * 2)).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toMap(x => x, value)).toThrow(error));
    });
    describe("toHashMap()", () => {
        it("result is a HashMap", () => expect(AsyncQuery.from([1, 2, 3, 4]).toHashMap(x => x)).resolves.toBeInstanceOf(HashMap));
        it("creates with right size", () => expect(AsyncQuery.from([1, 2, 3, 4]).toHashMap(x => x)).resolves.toHaveProperty("size", 4));
        it("creates with correct keys", async () => expect((await AsyncQuery.from([1, 2, 3, 4]).toHashMap(x => x * 2)).get(2)).toBe(1));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHashMap(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHashMap(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHashMap(x => x, x => x, value)).toThrow(error));
    });
    describe("toLookup()", () => {
        it("result is a Lookup", () => expect(AsyncQuery.from([1, 2, 3, 4]).toLookup(x => x)).resolves.toBeInstanceOf(Lookup));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toLookup(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'elementSelector'/'keyEqualer' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toLookup(x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-object"}   | ${""}         | ${TypeError}
            ${"non-equaler"}  | ${{}}         | ${TypeError}
        `("throws if 'keyEqualer' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toLookup(x => x, x => x, value)).toThrow(error));
    });
    describe("toObject()", () => {
        it("creates object with prototype", async () => {
            const proto = {};
            const obj: any = await AsyncQuery.from(["a", "b"]).toObject(proto, x => x);
            expect(obj).toHaveProperty("a", "a");
            expect(obj).toHaveProperty("b", "b");
            expect(Object.getPrototypeOf(obj)).toBe(proto);
        });
        it("creates object with null prototype", async () => {
            const obj: any = await AsyncQuery.from(["a", "b"]).toObject(null, x => x);
            expect(obj.a).toBe("a");
            expect(Object.getPrototypeOf(obj)).toBe(null);
        });
        it.each`
            type              | value         | error
            ${"non-object"}   | ${""}         | ${TypeError}
        `("throws if 'prototype' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toObject(value, x => x)).toThrow(error));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'keySelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toObject(null, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'elementSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toObject(null, x => x, value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'descriptorSelector' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toObject(null, x => x, x => x, value)).toThrow(error));
    });
    describe("copyTo", () => {
        it("copies to array", () => {
            expect(AsyncQuery.from([1, 2, 3, 4]).copyTo(Array(4))).resolves.toEqualSequence([1, 2, 3, 4]);
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
        `("throws if 'provider' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(value)).toThrow(error));
    });
    describe("root()", () => {
        it("gets root", () => expect(AsyncQuery.from([nodes.nodeAAAA]).toHierarchy(nodes.nodeHierarchy).root()).toEqualSequenceAsync([nodes.nodeA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).root()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).root(value)).toThrow(error));
    });
    describe("ancestors()", () => {
        it("gets ancestors", () => expect(AsyncQuery.from([nodes.nodeAAAA]).toHierarchy(nodes.nodeHierarchy).ancestors()).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).ancestors()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).ancestors(value)).toThrow(error));
    });
    describe("ancestorsAndSelf()", () => {
        it("gets ancestors and self", () => expect(AsyncQuery.from([nodes.nodeAAAA]).toHierarchy(nodes.nodeHierarchy).ancestorsAndSelf()).toEqualSequenceAsync([nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA, nodes.nodeA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).ancestorsAndSelf()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).ancestorsAndSelf(value)).toThrow(error));
    });
    describe("parents()", () => {
        it("gets parents", () => expect(AsyncQuery.from([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]).toHierarchy(nodes.nodeHierarchy).parents()).toEqualSequenceAsync([nodes.nodeAA, nodes.nodeAA, nodes.nodeAA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).parents()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).parents(value)).toThrow(error));
    });
    describe("self()", () => {
        it("gets self", () => expect(AsyncQuery.from([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]).toHierarchy(nodes.nodeHierarchy).self()).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).self()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).self(value)).toThrow(error));
    });
    describe("siblings()", () => {
        it("gets siblings", () => expect(AsyncQuery.from([nodes.nodeAAA]).toHierarchy(nodes.nodeHierarchy).siblings()).toEqualSequenceAsync([nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).siblings()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).siblings(value)).toThrow(error));
    });
    describe("siblingsAndSelf()", () => {
        it("gets siblings and self", () => expect(AsyncQuery.from([nodes.nodeAAA]).toHierarchy(nodes.nodeHierarchy).siblingsAndSelf()).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).siblingsAndSelf()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).siblingsAndSelf(value)).toThrow(error));
    });
    describe("precedingSiblings()", () => {
        it("gets siblings before self", () => expect(AsyncQuery.from([nodes.nodeAAB]).toHierarchy(nodes.nodeHierarchy).precedingSiblings()).toEqualSequenceAsync([nodes.nodeAAA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).precedingSiblings()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).precedingSiblings(value)).toThrow(error));
    });
    describe("preceding()", () => {
        it("gets nodes before self", () => expect(AsyncQuery.from([nodes.nodeAB]).toHierarchy(nodes.nodeHierarchy).preceding()).toEqualSequenceAsync([nodes.nodeAAC, nodes.nodeAAB, nodes.nodeAAAA, nodes.nodeAAA, nodes.nodeAA]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).preceding(value)).toThrow(error));
    });
    describe("followingSiblings()", () => {
        it("gets siblings after self", () => expect(AsyncQuery.from([nodes.nodeAAB]).toHierarchy(nodes.nodeHierarchy).followingSiblings()).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).followingSiblings()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).followingSiblings(value)).toThrow(error));
    });
    describe("following()", () => {
        it("gets nodes after self", () => expect(AsyncQuery.from([nodes.nodeAB]).toHierarchy(nodes.nodeHierarchy).following()).toEqualSequenceAsync([nodes.nodeACA, nodes.nodeAC]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).following(value)).toThrow(error));
    });
    describe("children()", () => {
        it("gets children", () => expect(AsyncQuery.from([nodes.nodeAA, nodes.nodeAB, nodes.nodeAC]).toHierarchy(nodes.nodeHierarchy).children()).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAB, nodes.nodeAAC, nodes.nodeACA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).children()).toEqualSequenceAsync([]));
        it("of undefined children", () => expect(AsyncQuery.from(books.books).toHierarchy(books.bookHierarchy).children()).toEqualSequenceAsync([]));
        it("of undefined child", () => expect(AsyncQuery.from([nodes.badNode]).toHierarchy(nodes.nodeHierarchy).children()).toEqualSequenceAsync([]));
        it("with predicate", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).children(x => !!x.marker)).toEqualSequenceAsync([nodes.nodeAAB]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).children(value)).toThrow(error));
    });
    describe("nthChild()", () => {
        it("gets nthChild(0)", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).nthChild(0)).toEqualSequenceAsync([nodes.nodeAAA]));
        it("gets nthChild(2)", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).nthChild(2)).toEqualSequenceAsync([nodes.nodeAAC]));
        it("gets nthChild(-1)", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).nthChild(-1)).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).nthChild(0)).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"undefined"}    | ${undefined}  | ${TypeError}
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-number"}   | ${""}         | ${TypeError}
            ${"float"}        | ${1.5}        | ${RangeError}
            ${"NaN"}          | ${NaN}        | ${RangeError}
            ${"Infinity"}     | ${Infinity}   | ${RangeError}
        `("throws if 'offset' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).nthChild(value)).toThrow(error));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).nthChild(0, value)).toThrow(error));
    });
    describe("firstChild(", () => {
        it("gets firstChild()", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).firstChild()).toEqualSequenceAsync([nodes.nodeAAA]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).firstChild()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).firstChild(value)).toThrow(error));
    });
    describe("lastChild(", () => {
        it("gets lastChild()", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).lastChild()).toEqualSequenceAsync([nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).lastChild()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).lastChild(value)).toThrow(error));
    });
    describe("descendants()", () => {
        it("gets descendants", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).descendants()).toEqualSequenceAsync([nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).descendants()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).descendants(value)).toThrow(error));
    });
    describe("descendantsAndSelf()", () => {
        it("gets descendants and self", () => expect(AsyncQuery.from([nodes.nodeAA]).toHierarchy(nodes.nodeHierarchy).descendantsAndSelf()).toEqualSequenceAsync([nodes.nodeAA, nodes.nodeAAA, nodes.nodeAAAA, nodes.nodeAAB, nodes.nodeAAC]));
        it("of undefined", () => expect(AsyncQuery.from([undefined!]).toHierarchy(nodes.nodeHierarchy).descendantsAndSelf()).toEqualSequenceAsync([]));
        it.each`
            type              | value         | error
            ${"null"}         | ${null}       | ${TypeError}
            ${"non-function"} | ${""}         | ${TypeError}
        `("throws if 'predicate' is $type", ({ value, error }) => expect(() => AsyncQuery.from([]).toHierarchy(nodes.nodeHierarchy).descendantsAndSelf(value)).toThrow(error));
    });
});
