import { Equaler, Equatable, Comparable, StructuralEquatable, StructuralComparable } from "../index";

describe("Equatable", () => {
    it("equals", () => {
        expect(typeof Equatable.equals).toBe("symbol");
        expect(Symbol.keyFor(Equatable.equals)).not.toBeUndefined();
    });
    it("hash", () => {
        expect(typeof Equatable.hash).toBe("symbol");
        expect(Symbol.keyFor(Equatable.hash)).not.toBeUndefined();
    });
    it("name", () => {
        expect(Equatable.name).toBe("Equatable");
    });
    it("hasInstance", () => {
        const obj = {
            [Equatable.equals]() { return true; },
            [Equatable.hash]() { return 0; }
        };
        expect(Equatable.hasInstance(obj)).toBe(true);
        expect(Equatable.hasInstance({})).toBe(false);
    });
});

describe("Comparable", () => {
    it("compareTo", () => {
        expect(typeof Comparable.compareTo).toBe("symbol");
        expect(Symbol.keyFor(Comparable.compareTo)).not.toBeUndefined();
    });
    it("name", () => {
        expect(Comparable.name).toBe("Comparable");
    });
    it("hasInstance", () => {
        const obj = {
            [Comparable.compareTo]() { return 0; }
        };
        expect(Comparable.hasInstance(obj)).toBe(true);
        expect(Comparable.hasInstance({})).toBe(false);
    });
});

describe("StructuralEquatable", () => {
    it("structuralEquals", () => {
        expect(typeof StructuralEquatable.structuralEquals).toBe("symbol");
        expect(Symbol.keyFor(StructuralEquatable.structuralEquals)).not.toBeUndefined();
    });
    it("structuralHash", () => {
        expect(typeof StructuralEquatable.structuralHash).toBe("symbol");
        expect(Symbol.keyFor(StructuralEquatable.structuralHash)).not.toBeUndefined();
    });
    it("name", () => {
        expect(StructuralEquatable.name).toBe("StructuralEquatable");
    });
    it("hasInstance", () => {
        const obj = {
            [StructuralEquatable.structuralEquals]() { return true; },
            [StructuralEquatable.structuralHash]() { return 0; }
        };
        expect(StructuralEquatable.hasInstance(obj)).toBe(true);
        expect(StructuralEquatable.hasInstance({})).toBe(false);
    });
});

describe("StructuralComparable", () => {
    it("structuralCompareTo", () => {
        expect(typeof StructuralComparable.structuralCompareTo).toBe("symbol");
        expect(Symbol.keyFor(StructuralComparable.structuralCompareTo)).not.toBeUndefined();
    });
    it("name", () => {
        expect(StructuralComparable.name).toBe("StructuralComparable");
    });
    it("hasInstance", () => {
        const obj = {
            [StructuralComparable.structuralCompareTo]() { return 0; }
        };
        expect(StructuralComparable.hasInstance(obj)).toBe(true);
        expect(StructuralComparable.hasInstance({})).toBe(false);
    });
});

describe("Equaler", () => {
    describe("defaultEqualer", () => {
        describe("equals (left is Equatable)", () => {
            const a = {};
            const b = {};
            const obj = {
                [Equatable.equals](other: unknown) { return other === a; },
                [Equatable.hash]() { return 0; }
            };
            expect(Equaler.defaultEqualer.equals(obj, a)).toBe(true);
            expect(Equaler.defaultEqualer.equals(obj, b)).toBe(false);
        });
        describe("equals (right is Equatable)", () => {
            const a = {};
            const b = {};
            const obj = {
                [Equatable.equals](other: unknown) { return other === a; },
                [Equatable.hash]() { return 0; }
            };
            expect(Equaler.defaultEqualer.equals(a, obj)).toBe(true);
            expect(Equaler.defaultEqualer.equals(b, obj)).toBe(false);
        });
        describe("equals (neither is Equatable)", () => {
            const a = {};
            const b = {};
            expect(Equaler.defaultEqualer.equals(a, a)).toBe(true);
            expect(Equaler.defaultEqualer.equals(a, b)).toBe(false);
        });
        describe("hash (value is Equatable)", () => {
            it("Equatable object", () => {
                const obj: unknown = {
                    [Equatable.equals]() { return false; },
                    [Equatable.hash]() { return 123; }
                };
                expect(Equaler.defaultEqualer.hash(obj)).toBe(123);
            });
        });
        describe("hash (value is not Equatable)", () => {
            it("Equatable object", () => {
                expect(Equaler.defaultEqualer.hash(undefined)).toBe(0);
            });
        });
    });
    describe("tupleEqualer", () => {
        describe("equals (neither is Equatable)", () => {
            expect(Equaler.tupleEqualer.equals([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(Equaler.tupleEqualer.equals([1, 2, 3], [1, 2, 4])).toBe(false);
            expect(Equaler.tupleEqualer.equals([1, 2, 3], [1, 2, 3, 4])).toBe(false);
        });
        describe("hash (value is not Equatable)", () => {
            expect(Equaler.tupleEqualer.hash([1, 2, 3])).toBe(16643);
        });
    });
    it("combineHashes", () => {
        expect(() => Equaler.combineHashes(undefined!, 0)).toThrow();
        expect(() => Equaler.combineHashes(NaN, 0)).toThrow();
        expect(() => Equaler.combineHashes(Infinity, 0)).toThrow();
        expect(() => Equaler.combineHashes(0, undefined!)).toThrow();
        expect(() => Equaler.combineHashes(0, NaN)).toThrow();
        expect(() => Equaler.combineHashes(0, Infinity)).toThrow();
        expect(() => Equaler.combineHashes(0, 0, null!)).toThrow();
        expect(() => Equaler.combineHashes(0, 0, NaN)).toThrow();
        expect(() => Equaler.combineHashes(0, 0, Infinity)).toThrow();
        expect(Equaler.combineHashes(0, 0, 0)).toBe(0);
        expect(Equaler.combineHashes(10, 20, 7)).toBe(1300);
        expect(Equaler.combineHashes(10, 20, -25)).toBe(1300);
    });
});
