import "../index";
import { ReadonlyCollection, Collection, ReadonlyIndexedCollection, FixedSizeIndexedCollection, IndexedCollection, ReadonlyKeyedCollection, KeyedCollection } from '@esfx/collection-core';

describe("Array", () => {
    describe("ReadonlyCollection", () => {
        it("isReadonlyCollection", () => {
            expect(ReadonlyCollection.isReadonlyCollection([])).toBe(true);
        });
        it("size", () => {
            expect([][ReadonlyCollection.size]).toBe(0);
            expect([""][ReadonlyCollection.size]).toBe(1);
        });
        it("has", () => {
            expect(["a"][ReadonlyCollection.has]("a")).toBe(true);
            expect(["a"][ReadonlyCollection.has]("b")).toBe(false);
        });
    });
    describe("Collection", () => {
        it("isCollection", () => {
            expect(Collection.isCollection([])).toBe(true);
        });
        it("add", () => {
            const obj = ["a"];
            obj[Collection.add]("b");
            expect(obj).toEqual(["a", "b"]);
        });
        it("delete", () => {
            const obj = ["a", "b"];
            expect(obj[Collection.delete]("b")).toBe(true);
            expect(obj).toEqual(["a"]);
        });
        it("clear", () => {
            const obj = ["a", "b"];
            obj[Collection.clear]();
            expect(obj).toEqual([]);
        });
    });
    describe("ReadonlyIndexedCollection", () => {
        it("isReadonlyIndexedCollection", () => {
            expect(ReadonlyIndexedCollection.isReadonlyIndexedCollection([])).toBe(true);
        });
        it("indexOf", () => {
            expect(["a", "b", "c", "b"][ReadonlyIndexedCollection.indexOf]("b")).toBe(1);
            expect(["a", "b", "c", "b"][ReadonlyIndexedCollection.indexOf]("b", 2)).toBe(3);
            expect(["a", "b", "c", "b"][ReadonlyIndexedCollection.indexOf]("z")).toBe(-1);
        });
        it("getAt", () => {
            expect(["a", "b"][ReadonlyIndexedCollection.getAt](0)).toBe("a");
            expect(["a", "b"][ReadonlyIndexedCollection.getAt](3)).toBeUndefined();
        });
    });
    describe("FixedSizeIndexedCollection", () => {
        it("isFixedSizeIndexedCollection", () => {
            expect(FixedSizeIndexedCollection.isFixedSizeIndexedCollection([])).toBe(true);
        });
        it("setAt", () => {
            const obj = ["a", "b"];
            expect(obj[FixedSizeIndexedCollection.setAt](0, "c")).toBe(true);
            expect(obj).toEqual(["c", "b"]);
            expect(obj[FixedSizeIndexedCollection.setAt](2, "d")).toBe(true);
            expect(obj).toEqual(["c", "b", "d"]);
        });
    });
    describe("IndexedCollection", () => {
        it("IndexedCollection", () => {
            expect(IndexedCollection.isIndexedCollection([])).toBe(true);
        });
        it("insertAt", () => {
            const obj = ["a", "b"];
            obj[IndexedCollection.insertAt](1, "c");
            expect(obj).toEqual(["a", "c", "b"]);
        });
        it("removeAt", () => {
            const obj = ["a", "b"];
            obj[IndexedCollection.removeAt](0);
            expect(obj).toEqual(["b"]);
        });
    });
});

const typedArrays = [Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array]

for (const TypedArray of typedArrays) {
    describe(TypedArray.name, () => {
        describe("ReadonlyCollection", () => {
            it("isReadonlyCollection", () => {
                expect(ReadonlyCollection.isReadonlyCollection(new TypedArray())).toBe(true);
            });
            it("size", () => {
                expect(new TypedArray([])[ReadonlyCollection.size]).toBe(0);
                expect(new TypedArray([0])[ReadonlyCollection.size]).toBe(1);
            });
            it("has", () => {
                expect(new TypedArray([1])[ReadonlyCollection.has](1)).toBe(true);
                expect(new TypedArray([1])[ReadonlyCollection.has](2)).toBe(false);
            });
        });
        describe("ReadonlyIndexedCollection", () => {
            it("isReadonlyIndexedCollection", () => {
                expect(ReadonlyIndexedCollection.isReadonlyIndexedCollection(new TypedArray())).toBe(true);
            });
            it("indexOf", () => {
                expect(new TypedArray([1, 2, 3, 2])[ReadonlyIndexedCollection.indexOf](2)).toBe(1);
                expect(new TypedArray([1, 2, 3, 2])[ReadonlyIndexedCollection.indexOf](2, 2)).toBe(3);
                expect(new TypedArray([1, 2, 3, 2])[ReadonlyIndexedCollection.indexOf](9)).toBe(-1);
            });
            it("getAt", () => {
                expect(new TypedArray([1, 2])[ReadonlyIndexedCollection.getAt](0)).toBe(1);
                expect(new TypedArray([1, 2])[ReadonlyIndexedCollection.getAt](3)).toBeUndefined();
            });
        });
        describe("FixedSizeIndexedCollection", () => {
            it("isFixedSizeIndexedCollection", () => {
                expect(FixedSizeIndexedCollection.isFixedSizeIndexedCollection(new TypedArray())).toBe(true);
            });
            it("setAt", () => {
                const ar = new TypedArray([1, 2]);
                expect(ar[FixedSizeIndexedCollection.setAt](0, 3)).toBe(true);
                expect(ar).toEqual(new TypedArray([3, 2]));
                expect(ar[FixedSizeIndexedCollection.setAt](2, 4)).toBe(false);
                expect(ar).toEqual(new TypedArray([3, 2]));
            });
        });
    });
}

if (typeof BigInt64Array === "function" && typeof BigUint64Array === "function" && typeof BigInt === "function") {
    const typedArrays = [BigInt64Array, BigUint64Array];
    for (const TypedArray of typedArrays) {
        describe(TypedArray.name, () => {
            describe("ReadonlyCollection", () => {
                it("isReadonlyCollection", () => {
                    expect(ReadonlyCollection.isReadonlyCollection(new TypedArray())).toBe(true);
                });
                it("size", () => {
                    expect(new TypedArray([])[ReadonlyCollection.size]).toBe(0);
                    expect(new TypedArray([BigInt(0)])[ReadonlyCollection.size]).toBe(1);
                });
                it("has", () => {
                    expect(new TypedArray([BigInt(1)])[ReadonlyCollection.has](BigInt(1))).toBe(true);
                    expect(new TypedArray([BigInt(1)])[ReadonlyCollection.has](BigInt(2))).toBe(false);
                });
            });
            describe("ReadonlyIndexedCollection", () => {
                it("isReadonlyIndexedCollection", () => {
                    expect(ReadonlyIndexedCollection.isReadonlyIndexedCollection(new TypedArray())).toBe(true);
                });
                it("indexOf", () => {
                    expect(new TypedArray([BigInt(1), BigInt(2), BigInt(3), BigInt(2)])[ReadonlyIndexedCollection.indexOf](BigInt(2))).toBe(1);
                    expect(new TypedArray([BigInt(1), BigInt(2), BigInt(3), BigInt(2)])[ReadonlyIndexedCollection.indexOf](BigInt(2), 2)).toBe(3);
                    expect(new TypedArray([BigInt(1), BigInt(2), BigInt(3), BigInt(2)])[ReadonlyIndexedCollection.indexOf](BigInt(9))).toBe(-1);
                });
                it("getAt", () => {
                    expect(new TypedArray([BigInt(1), BigInt(2)])[ReadonlyIndexedCollection.getAt](0)).toBe(BigInt(1));
                    expect(new TypedArray([BigInt(1), BigInt(2)])[ReadonlyIndexedCollection.getAt](3)).toBeUndefined();
                });
            });
            describe("FixedSizeIndexedCollection", () => {
                it("isFixedSizeIndexedCollection", () => {
                    expect(FixedSizeIndexedCollection.isFixedSizeIndexedCollection(new TypedArray())).toBe(true);
                });
                it("setAt", () => {
                    const ar = new TypedArray([BigInt(1), BigInt(2)]);
                    expect(ar[FixedSizeIndexedCollection.setAt](0, BigInt(3))).toBe(true);
                    expect(ar).toEqual(new TypedArray([BigInt(3), BigInt(2)]));
                    expect(ar[FixedSizeIndexedCollection.setAt](2, BigInt(4))).toBe(false);
                    expect(ar).toEqual(new TypedArray([BigInt(3), BigInt(2)]));
                });
            });
        });
    }
}

describe("Set", () => {
    describe("ReadonlyCollection", () => {
        it("isReadonlyCollection", () => {
            expect(ReadonlyCollection.isReadonlyCollection(new Set())).toBe(true);
        });
        it("size", () => {
            expect(new Set([])[ReadonlyCollection.size]).toBe(0);
            expect(new Set([""])[ReadonlyCollection.size]).toBe(1);
        });
        it("has", () => {
            expect(new Set(["a"])[ReadonlyCollection.has]("a")).toBe(true);
            expect(new Set(["a"])[ReadonlyCollection.has]("b")).toBe(false);
        });
    });
    describe("Collection", () => {
        it("isCollection", () => {
            expect(Collection.isCollection(new Set([]))).toBe(true);
        });
        it("add", () => {
            const obj = new Set(["a"]);
            obj[Collection.add]("b");
            expect([...obj]).toEqual(["a", "b"]);
        });
        it("delete", () => {
            const obj = new Set(["a", "b"]);
            expect(obj[Collection.delete]("b")).toBe(true);
            expect([...obj]).toEqual(["a"]);
        });
        it("clear", () => {
            const obj = new Set(["a", "b"]);
            obj[Collection.clear]();
            expect([...obj]).toEqual([]);
        });
    });
});

describe("Map", () => {
    describe("ReadonlyKeyedCollection", () => {
        it("isReadonlyKeyedCollection", () => {
            expect(ReadonlyKeyedCollection.isReadonlyKeyedCollection(new Map())).toBe(true);
        });
        it("size", () => {
            expect(new Map([])[ReadonlyKeyedCollection.size]).toBe(0);
            expect(new Map([["", 1]])[ReadonlyKeyedCollection.size]).toBe(1);
        });
        it("has", () => {
            expect(new Map([["a", 1]])[ReadonlyKeyedCollection.has]("a")).toBe(true);
            expect(new Map([["a", 1]])[ReadonlyKeyedCollection.has]("b")).toBe(false);
        });
        it("get", () => {
            expect(new Map([["a", 1]])[ReadonlyKeyedCollection.get]("a")).toBe(1);
            expect(new Map([["a", 1]])[ReadonlyKeyedCollection.get]("b")).toBe(undefined);
        });
        it("keys", () => {
            expect([...(new Map([["a", 1]])[ReadonlyKeyedCollection.keys]())]).toEqual(["a"]);
        });
        it("values", () => {
            expect([...(new Map([["a", 1]])[ReadonlyKeyedCollection.values]())]).toEqual([1]);
        });
    });
    describe("KeyedCollection", () => {
        it("isKeyedCollection", () => {
            expect(KeyedCollection.isKeyedCollection(new Map([]))).toBe(true);
        });
        it("set", () => {
            const obj = new Map([["a", 1]]);
            obj[KeyedCollection.set]("b", 2);
            expect([...obj]).toEqual([["a", 1], ["b", 2]]);
        });
        it("delete", () => {
            const obj = new Map([["a", 1], ["b", 2]]);
            expect(obj[KeyedCollection.delete]("b")).toBe(true);
            expect([...obj]).toEqual([["a", 1]]);
        });
        it("clear", () => {
            const obj = new Map([["a", 1], ["b", 2]]);
            obj[KeyedCollection.clear]();
            expect([...obj]).toEqual([]);
        });
    });
});
