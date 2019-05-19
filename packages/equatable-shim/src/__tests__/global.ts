import "..";
import { Equatable, Comparable } from '@esfx/equatable';
import { hashUnknown } from "@esfx/internal-hashcode";

const state = hashUnknown.getState();

beforeEach(() => {
    hashUnknown.setState({
        objectSeed: 0x1dc8529e,
        stringSeed: 0x6744b005,
        bigIntSeed: 0x6c9503bc,
        localSymbolSeed: 0x78819b01,
        globalSymbolSeed: 0x1875c170
    });
});

afterEach(() => {
    hashUnknown.setState(state);
});

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
            expect(a[Equatable.hash]()).toBe(-467054833);
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
            expect("abc"[Equatable.hash]()).toBe(38704718);
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
            expect(a[Equatable.hash]()).toBe(767180218);
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
            expect(1[Equatable.hash]()).toBe(1);
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
            expect(true[Equatable.hash]()).toBe(1);
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
                expect(BigInt(123)[Equatable.hash]()).toBe(251);
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
