import "../index.js";
import { Equatable, Comparable, rawHash } from '@esfx/equatable';

describe("Object", () => {
    describe("Equatable", () => {
        it("Equatable.equals", () => {
            const a = {};
            const b = {};
            expect(a[Equatable.equals](a)).toBe(true);
            expect(a[Equatable.equals](b)).toBe(false);
        });
        it("Equatable.hash", () => {
            const a = {};
            expect(a[Equatable.hash]()).toBe(rawHash(a));
        });
    });
});

describe("String", () => {
    describe("Equatable", () => {
        it("Equatable.equals", () => {
            expect("a"[Equatable.equals]("a")).toBe(true);
            expect("a"[Equatable.equals]("b")).toBe(false);
        });
        it("Equatable.hash", () => {
            expect("abc"[Equatable.hash]()).toBe(rawHash("abc"));
        });
    });
    describe("Comparable", () => {
        it("Comparable.compareTo", () => {
            expect("a"[Comparable.compareTo]("a")).toBe(0);
            expect("a"[Comparable.compareTo]("b")).toBeLessThan(0);
            expect("b"[Comparable.compareTo]("a")).toBeGreaterThan(0);
        });
    });
});

describe("Symbol", () => {
    describe("Equatable", () => {
        it("Equatable.equals", () => {
            const a = Symbol("a");
            const b = Symbol("b");
            expect(a[Equatable.equals](a)).toBe(true);
            expect(a[Equatable.equals](b)).toBe(false);
        });
        it("Equatable.hash", () => {
            const a = Symbol("a");
            expect(a[Equatable.hash]()).toBe(rawHash(a));
        });
    });
});

describe("Number", () => {
    describe("Equatable", () => {
        it("Equatable.equals", () => {
            expect(1[Equatable.equals](1)).toBe(true);
            expect(1[Equatable.equals](0)).toBe(false);
        });
        it("Equatable.hash", () => {
            expect(1[Equatable.hash]()).toBe(rawHash(1));
        });
    });
    describe("Comparable", () => {
        it("Comparable.compareTo", () => {
            expect(1[Comparable.compareTo](1)).toBe(0);
            expect(1[Comparable.compareTo](2)).toBeLessThan(0);
            expect(2[Comparable.compareTo](1)).toBeGreaterThan(0);
        });
    });
});

describe("Boolean", () => {
    describe("Equatable", () => {
        it("Equatable.equals", () => {
            expect(true[Equatable.equals](true)).toBe(true);
            expect(true[Equatable.equals](false)).toBe(false);
        });
        it("Equatable.hash", () => {
            expect(true[Equatable.hash]()).toBe(rawHash(true));
        });
    });
    describe("Comparable", () => {
        it("Comparable.compareTo", () => {
            expect(true[Comparable.compareTo](true)).toBe(0);
            expect(false[Comparable.compareTo](true)).toBeLessThan(0);
            expect(true[Comparable.compareTo](false)).toBeGreaterThan(0);
        });
    });
});

if (typeof BigInt === "function") {
    describe("BigInt", () => {
        describe("Equatable", () => {
            it("Equatable.equals", () => {
                expect(BigInt(1)[Equatable.equals](BigInt(1))).toBe(true);
                expect(BigInt(1)[Equatable.equals](BigInt(0))).toBe(false);
            });
            it("Equatable.hash", () => {
                expect(BigInt(123)[Equatable.hash]()).toBe(rawHash(BigInt(123)));
            });
        });
        describe("Comparable", () => {
            it("Comparable.compareTo", () => {
                expect(BigInt(1)[Comparable.compareTo](BigInt(1))).toBe(0);
                expect(BigInt(1)[Comparable.compareTo](BigInt(2))).toBeLessThan(0);
                expect(BigInt(2)[Comparable.compareTo](BigInt(1))).toBeGreaterThan(0);
            });
        });
    });
}
