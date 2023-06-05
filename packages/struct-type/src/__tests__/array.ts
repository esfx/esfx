import { ArrayType, bigint64, int16, int32, StructType } from "..";

describe("primitive typed array", () => {
    const Int32Array = ArrayType(int32);
    it("defaults", () => {
        const ar = new Int32Array(2);
        expect(ar[0]).toBe(0);
        expect(ar[1]).toBe(0);
    });
    it("can set/get elements", () => {
        const ar = new Int32Array(2);
        ar[0] = 1;
        ar[1] = 2;
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from array", () => {
        const ar = new Int32Array([1, 2]);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        const ar = new Int32Array(buffer);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
});
describe("primitive fixed-length typed array", () => {
    const Int32Arrayx2 = ArrayType(int32, 2);
    it("size", () => {
        expect(Int32Arrayx2.SIZE).toBe(8);
    });
    it("defaults", () => {
        const ar = new Int32Arrayx2();
        expect(ar[0]).toBe(0);
        expect(ar[1]).toBe(0);
    });
    it("can set/get elements", () => {
        const ar = new Int32Arrayx2();
        ar[0] = 1;
        ar[1] = 2;
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from array", () => {
        const ar = new Int32Arrayx2([1, 2]);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        const ar = new Int32Arrayx2(buffer);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
});
describe("primitive fixed-length typed array from non-fixed typed array", () => {
    const Int32Array = ArrayType(int32);
    const Int32Arrayx2 = Int32Array.toFixed(2);
    it("size", () => {
        expect(Int32Arrayx2.SIZE).toBe(8);
    });
    it("defaults", () => {
        const ar = new Int32Arrayx2();
        expect(ar[0]).toBe(0);
        expect(ar[1]).toBe(0);
    });
    it("can set/get elements", () => {
        const ar = new Int32Arrayx2();
        ar[0] = 1;
        ar[1] = 2;
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from array", () => {
        const ar = new Int32Arrayx2([1, 2]);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        const ar = new Int32Arrayx2(buffer);
        expect(ar[0]).toBe(1);
        expect(ar[1]).toBe(2);
    });
});
describe("complex typed array", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const PointArray = ArrayType(Point);
    it("defaults", () => {
        const l = new PointArray(2);
        expect(l[0].x).toBe(0);
        expect(l[0].y).toBe(0);
        expect(l[1].x).toBe(0);
        expect(l[1].y).toBe(0);
    });
    it("can set/get fields", () => {
        const l = new PointArray(2);
        l[0] = new Point({ x: 1, y: 2 });
        l[1] = new Point({ x: 3, y: 4 });
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from array", () => {
        const l = new PointArray([new Point([1, 2]), new Point([3, 4])]);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from nested objects", () => {
        const l = new PointArray([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from nested arrays", () => {
        const l = new PointArray([[1, 2], [3, 4]]);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        view.setInt32(8, 3);
        view.setInt32(12, 4);
        const l = new PointArray(buffer);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("produces same struct instance at same element", () => {
        const ar = new PointArray([[0, 0], [1, 1]]);
        const p0 = ar[0];
        const p1 = ar[1];
        expect(ar[0]).toBe(p0);
        expect(ar[1]).toBe(p1);
        ar[0] = p1;
        expect(ar[0]).toBe(p0);
        expect(p0.x).toBe(1);
    });
});
describe("complex fixed-length typed array", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const PointArrayx2 = ArrayType(Point, 2);
    it("size", () => {
        expect(PointArrayx2.SIZE).toBe(16);
    });
    it("defaults", () => {
        const l = new PointArrayx2();
        expect(l[0].x).toBe(0);
        expect(l[0].y).toBe(0);
        expect(l[1].x).toBe(0);
        expect(l[1].y).toBe(0);
    });
    it("can set/get fields", () => {
        const l = new PointArrayx2();
        l[0] = new Point({ x: 1, y: 2 });
        l[1] = new Point({ x: 3, y: 4 });
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from array", () => {
        const l = new PointArrayx2([new Point([1, 2]), new Point([3, 4])]);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        view.setInt32(8, 3);
        view.setInt32(12, 4);
        const l = new PointArrayx2(buffer);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
});
describe("complex fixed-length typed array from non-fixed typed array", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const PointArray = ArrayType(Point);
    const PointArrayx2 = PointArray.toFixed(2);
    it("size", () => {
        expect(PointArrayx2.SIZE).toBe(16);
    });
    it("defaults", () => {
        const l = new PointArrayx2();
        expect(l[0].x).toBe(0);
        expect(l[0].y).toBe(0);
        expect(l[1].x).toBe(0);
        expect(l[1].y).toBe(0);
    });
    it("can set/get fields", () => {
        const l = new PointArrayx2();
        l[0] = new Point({ x: 1, y: 2 });
        l[1] = new Point({ x: 3, y: 4 });
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from array", () => {
        const l = new PointArrayx2([new Point([1, 2]), new Point([3, 4])]);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        view.setInt32(8, 3);
        view.setInt32(12, 4);
        const l = new PointArrayx2(buffer);
        expect(l[0].x).toBe(1);
        expect(l[0].y).toBe(2);
        expect(l[1].x).toBe(3);
        expect(l[1].y).toBe(4);
    });
});
describe("methods", () => {
    describe("on primitives", () => {
        const Int16Array = ArrayType(int16);
        const Int32Array = ArrayType(int32);
        const Int32Arrayx2 = Int32Array.toFixed(2);
        const BigInt64Array = ArrayType(bigint64);
        describe("copyWithin()", () => {
            it("positive target, positive start, no end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, 2);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(5);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, positive start, positive end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, 2, 4);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, positive start, positive end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(2, 0, 3);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("positive target, positive start, negative end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, 2, -1);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, positive start, negative end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(2, 0, -1);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("positive target, negative start, no end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, -3);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(5);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, negative start, positive end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, -3, 4);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, negative start, positive end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(2, -5, 3);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("positive target, negative start, negative end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(0, -3, -1);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("positive target, negative start, negative end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(2, -5, -1);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });

            it("negative target, positive start, no end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, 2);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(5);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, positive start, positive end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, 2, 4);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, positive start, positive end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-3, 0, 3);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("negative target, positive start, negative end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, 2, -1);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, positive start, negative end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-3, 0, -1);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("negative target, negative start, no end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, -3);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(5);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, negative start, positive end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, -3, 4);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, negative start, positive end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-3, -5, 3);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
            it("negative target, negative start, negative end, copy from end to start, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-5, -3, -1);
                expect(ar[0]).toBe(3);
                expect(ar[1]).toBe(4);
                expect(ar[2]).toBe(3);
                expect(ar[3]).toBe(4);
                expect(ar[4]).toBe(5);
            });
            it("negative target, negative start, negative end, copy from start to end, fits", () => {
                const ar = new Int32Array([1, 2, 3, 4, 5]);
                ar.copyWithin(-3, -5, -1);
                expect(ar[0]).toBe(1);
                expect(ar[1]).toBe(2);
                expect(ar[2]).toBe(1);
                expect(ar[3]).toBe(2);
                expect(ar[4]).toBe(3);
            });
        });
        describe("every()", () => {
            it("when all match predicate", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.every(x => x >= 0);
                expect(actual).toBe(true);
            });
            it("when one element does not match predicate", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.every(x => x > 0);
                expect(actual).toBe(false);
            });
            it("when empty", () => {
                const ar = new Int32Array([]);
                const actual = ar.every(x => x > 0);
                expect(actual).toBe(true);
            });
        });
        describe("some()", () => {
            it("when all match predicate", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.some(x => x >= 0);
                expect(actual).toBe(true);
            });
            it("when one element matches predicate", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.some(x => x === 7);
                expect(actual).toBe(true);
            });
            it("when no elements match predicate", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.some(x => x < 0);
                expect(actual).toBe(false);
            });
            it("when empty", () => {
                const ar = new Int32Array([]);
                const actual = ar.some(x => x > 0);
                expect(actual).toBe(false);
            });
        });
        describe("fill()", () => {
            describe("fills array with value", () => {
                it("no start, no end", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("no start, positive end less than length", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, undefined, 4);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(5);
                });
                it("no start, positive end greater than length", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, undefined, 10);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("no start, negative end greater than -length", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, undefined, -2);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(4);
                    expect(ar[4]).toBe(5);
                });
                it("no start, negative end less than -length", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, undefined, -10);
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(4);
                    expect(ar[4]).toBe(5);
                });
                it("positive start greater than 0, no end", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, 1);
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("positive start greater than length, no end", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, 10);
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(4);
                    expect(ar[4]).toBe(5);
                });
                it("negative start greater than -length, no end", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, -2);
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("negative start less than -length, no end", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5]);
                    ar.fill(0, -10);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(0);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
            });
        });
        describe("filter()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([1, 2, 3, 4, 5, 5, 6, 7, 8, 9]);
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual).toBeInstanceOf(Int32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual).toBeInstanceOf(Int32Array.toFixed(1));
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Int32Array(new ArrayBuffer(8));
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Int32Array(new SharedArrayBuffer(8));
                    const actual = ar.filter(x => x % 2 === 0);
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });
            it("produces only matching values", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const actual = ar.filter(x => x % 2 === 0);
                expect(actual.length).toBe(5);
                expect(actual[0]).toBe(0);
                expect(actual[1]).toBe(2);
                expect(actual[2]).toBe(4);
                expect(actual[3]).toBe(6);
                expect(actual[4]).toBe(8);
            });
        });
        describe("find()", () => {
            it("when predicate matches", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.find(el => el === 2);
                expect(actual).toBe(2);
            });
            it("when predicate does not match", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.find(el => el < 0);
                expect(actual).toBeUndefined();
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.find(el => el === 0, 1);
                expect(actual).toBeUndefined();
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 2]);
                const actual = ar.find((el, index) => el === 2 && index > 2, 3);
                expect(actual).toBe(2);
            });
        });
        describe("findIndex()", () => {
            it("when predicate matches", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findIndex(el => el === 2);
                expect(actual).toBe(2);
            });
            it("when predicate does not match", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findIndex(el => el < 0);
                expect(actual).toBe(-1);
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findIndex(el => el === 0, 1);
                expect(actual).toBe(-1);
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 2]);
                const actual = ar.findIndex((el, index) => el === 2 && index > 2, 3);
                expect(actual).toBe(5);
            });
        });
        describe("findLast()", () => {
            it("when predicate matches", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLast(el => el === 2);
                expect(actual).toBe(2);
            });
            it("when predicate does not match", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLast(el => el < 0);
                expect(actual).toBeUndefined();
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLast(el => el === 4, 1);
                expect(actual).toBeUndefined();
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 2]);
                const actual = ar.findLast((el, index) => el === 2 && index <= 2, 3);
                expect(actual).toBe(2);
            });
        });
        describe("findLastIndex()", () => {
            it("when predicate matches", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLastIndex(el => el === 2);
                expect(actual).toBe(2);
            });
            it("when predicate does not match", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLastIndex(el => el < 0);
                expect(actual).toBe(-1);
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4]);
                const actual = ar.findLastIndex(el => el === 4, 1);
                expect(actual).toBe(-1);
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Int32Array([0, 1, 2, 3, 4, 2]);
                const actual = ar.findLastIndex((el, index) => el === 2 && index <= 2, 3);
                expect(actual).toBe(2);
            });
        });
        describe("forEach()", () => {
            it("visits each element", () => {
                const actual: number[] = [];
                const ar = new Int32Array([0, 1, 2]);
                ar.forEach(i => actual.push(i));
                expect(actual).toEqual([0, 1, 2]);
            })
        });
        describe("map()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([0, 1]);
                    const actual = ar.map(x => x + 1);
                    expect(actual).toBeInstanceOf(Int32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.map(x => x + 1);
                    expect(actual).toBeInstanceOf(Int32Arrayx2);
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([0, 1]);
                    const actual = ar.map(x => x + 1);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.map(x => x + 1);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Int32Array(new ArrayBuffer(8));
                    const actual = ar.map(x => x + 1);
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Int32Array(new SharedArrayBuffer(8));
                    const actual = ar.map(x => x + 1);
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });
            it("produces a typed array of mapped values", () => {
                const ar = new Int32Array([0, 1]);
                const actual = ar.map(x => x + 3);
                expect(actual.length).toBe(2);
                expect(actual[0]).toBe(3);
                expect(actual[1]).toBe(4);
            });
        });
        describe("mapToArray()", () => {
            it("produces an array of mapped values", () => {
                const ar = new Int32Array([0, 1]);
                const actual = ar.mapToArray(x => ({ x }));
                expect(actual).toEqual([{ x: 0 }, { x: 1 }]);
            });
        });
        describe("reduce()", () => {
            it("when empty, no initial value", () => {
                const ar = new Int32Array([]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([]);
                expect(value).toBeUndefined();
            });
            it("when empty, with initial value", () => {
                const ar = new Int32Array([]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([]);
                expect(value).toBe(99);
            });
            it("when single element, no initial value", () => {
                const ar = new Int32Array([1]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([]);
                expect(value).toBe(1);
            });
            it("when single element, with initial value", () => {
                const ar = new Int32Array([1]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([[99, 1]]);
                expect(value).toBe(100);
            });
            it("when multiple elements, no initial value", () => {
                const ar = new Int32Array([1, 33, 44]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([[1, 33], [34, 44]]);
                expect(value).toBe(78);
            });
            it("when multiple elements, with initial value", () => {
                const ar = new Int32Array([1, 33, 44]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduce((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([[99, 1], [100, 33], [133, 44]]);
                expect(value).toBe(177);
            });
        });
        describe("reduceRight()", () => {
            it("when empty, no initial value", () => {
                const ar = new Int32Array([]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([]);
                expect(value).toBeUndefined();
            });
            it("when empty, with initial value", () => {
                const ar = new Int32Array([]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([]);
                expect(value).toBe(99);
            });
            it("when single element, no initial value", () => {
                const ar = new Int32Array([1]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([]);
                expect(value).toBe(1);
            });
            it("when single element, with initial value", () => {
                const ar = new Int32Array([1]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([[99, 1]]);
                expect(value).toBe(100);
            });
            it("when multiple elements, no initial value", () => {
                const ar = new Int32Array([1, 33, 44]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v));
                expect(order).toEqual([[44, 33], [77, 1]]);
                expect(value).toBe(78);
            });
            it("when multiple elements, with initial value", () => {
                const ar = new Int32Array([1, 33, 44]);
                const order: [m: number, v: number][] = [];
                const value = ar.reduceRight((m, v) => (order.push([m, v]), m + v), 99);
                expect(order).toEqual([[99, 44], [143, 33], [176, 1]]);
                expect(value).toBe(177);
            });
        });
        describe("set()", () => {
            describe("when source is ArrayLike", () => {
                it("and source is smaller, at default offset", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set([1, 2, 3]);
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("and source is smaller, at offset within bounds", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set([1, 2, 3], 2);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(1);
                    expect(ar[3]).toBe(2);
                    expect(ar[4]).toBe(3);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set([1, 2, 3], 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set([1, 2, 3, 4, 5, 6])).toThrow();
                });
            });
            describe("when source is same TypedArray type", () => {
                it("and source is smaller, at default offset", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set(new Int32Array([1, 2, 3]));
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("and source is smaller, at offset within bounds", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set(new Int32Array([1, 2, 3]), 2);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(1);
                    expect(ar[3]).toBe(2);
                    expect(ar[4]).toBe(3);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new Int32Array([1, 2, 3]), 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new Int32Array([1, 2, 3, 4, 5, 6]))).toThrow();
                });
            });
            describe("when source is compatible TypedArray type", () => {
                it("and source is smaller, at default offset", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set(new Int16Array([1, 2, 3]));
                    expect(ar[0]).toBe(1);
                    expect(ar[1]).toBe(2);
                    expect(ar[2]).toBe(3);
                    expect(ar[3]).toBe(0);
                    expect(ar[4]).toBe(0);
                });
                it("and source is smaller, at offset within bounds", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    ar.set(new Int16Array([1, 2, 3]), 2);
                    expect(ar[0]).toBe(0);
                    expect(ar[1]).toBe(0);
                    expect(ar[2]).toBe(1);
                    expect(ar[3]).toBe(2);
                    expect(ar[4]).toBe(3);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new Int16Array([1, 2, 3]), 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new Int16Array([1, 2, 3, 4, 5, 6]))).toThrow();
                });
            });
            describe("when source is incompatible TypedArray type", () => {
                it("and source is smaller, at default offset, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new BigInt64Array([1, 2, 3]) as any)).toThrow();
                });
                it("and source is smaller, at offset within bounds, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new BigInt64Array([1, 2, 3]) as any, 2)).toThrow();
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new BigInt64Array([1, 2, 3]) as any, 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Int32Array([0, 0, 0, 0, 0]);
                    expect(() => ar.set(new BigInt64Array([1, 2, 3, 4, 5, 6]) as any)).toThrow();
                });
            });
        });
        describe("subarray()", () => {
            describe("for whole array", () => {
                it("is not same array", () => {
                    const ar1 = new Int32Array([0, 1, 2]);
                    const ar2 = ar1.subarray();
                    expect(ar2).not.toBe(ar1);
                });
                it("is same buffer, byteOffset, and byteLength", () => {
                    const ar1 = new Int32Array([0, 1, 2]);
                    const ar2 = ar1.subarray();
                    expect(ar2.buffer).toBe(ar1.buffer);
                    expect(ar2.byteOffset).toBe(ar1.byteOffset);
                    expect(ar2.byteLength).toBe(ar1.byteLength);
                });
            });
            it("no start, positive end less than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(undefined, 4);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(4);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
            });
            it("no start, positive end greater than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(undefined, 10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(5);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
                expect(ar2[4]).toBe(5);
            });
            it("no start, negative end greater than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(undefined, -2);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(3);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
            });
            it("no start, negative end less than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(undefined, -10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(0);
            });
            it("positive start greater than 0, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(1);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(4);
                expect(ar2[0]).toBe(2);
                expect(ar2[1]).toBe(3);
                expect(ar2[2]).toBe(4);
                expect(ar2[3]).toBe(5);
            });
            it("positive start greater than length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(0);
            });
            it("negative start greater than -length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(-2);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(2);
                expect(ar2[0]).toBe(4);
                expect(ar2[1]).toBe(5);
            });
            it("negative start less than -length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.subarray(-10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(5);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
                expect(ar2[4]).toBe(5);
            });
        });
        describe("slice()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([0, 1]);
                    const actual = ar.slice();
                    expect(actual).toBeInstanceOf(Int32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.slice();
                    expect(actual).toBeInstanceOf(Int32Array.toFixed(2));
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Int32Array([0, 1]);
                    const actual = ar.slice();
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Int32Arrayx2([0, 1]);
                    const actual = ar.slice();
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Int32Array(new ArrayBuffer(8));
                    const actual = ar.slice();
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Int32Array(new SharedArrayBuffer(8));
                    const actual = ar.slice();
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });

            describe("for whole array", () => {
                it("is not same array", () => {
                    const ar1 = new Int32Array([0, 1, 2]);
                    const ar2 = ar1.slice();
                    expect(ar2).not.toBe(ar1);
                });
                it("is not same buffer", () => {
                    const ar1 = new Int32Array([0, 1, 2]);
                    const ar2 = ar1.slice();
                    expect(ar2.buffer).not.toBe(ar1.buffer);
                    expect(ar2.byteOffset).toBe(0);
                });
                it("has same elements", () => {
                    const ar1 = new Int32Array([0, 1, 2]);
                    const ar2 = ar1.slice();
                    expect(ar2.length).toBe(3);
                    expect(ar2[0]).toBe(0);
                    expect(ar2[1]).toBe(1);
                    expect(ar2[2]).toBe(2);
                });
            });
            it("no start, positive end less than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(undefined, 4);
                expect(ar2.length).toBe(4);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
            });
            it("no start, positive end greater than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(undefined, 10);
                expect(ar2.length).toBe(5);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
                expect(ar2[4]).toBe(5);
            });
            it("no start, negative end greater than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(undefined, -2);
                expect(ar2.length).toBe(3);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
            });
            it("no start, negative end less than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(undefined, -10);
                expect(ar2.length).toBe(0);
            });
            it("positive start greater than 0, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(1);
                expect(ar2.length).toBe(4);
                expect(ar2[0]).toBe(2);
                expect(ar2[1]).toBe(3);
                expect(ar2[2]).toBe(4);
                expect(ar2[3]).toBe(5);
            });
            it("positive start greater than length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(10);
                expect(ar2.length).toBe(0);
            });
            it("negative start greater than -length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(-2);
                expect(ar2.length).toBe(2);
                expect(ar2[0]).toBe(4);
                expect(ar2[1]).toBe(5);
            });
            it("negative start less than -length, no end", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const ar2 = ar1.slice(-10);
                expect(ar2.length).toBe(5);
                expect(ar2[0]).toBe(1);
                expect(ar2[1]).toBe(2);
                expect(ar2[2]).toBe(3);
                expect(ar2[3]).toBe(4);
                expect(ar2[4]).toBe(5);
            });
        });
        describe("at()", () => {
            it("positive index less than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const actual = ar1.at(4);
                expect(actual).toBe(5);
            });
            it("positive index greater than length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const actual = ar1.at(10);
                expect(actual).toBeUndefined();
            });
            it("negative index greater than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const actual = ar1.at(-2);
                expect(actual).toBe(4);
            });
            it("negative index less than -length", () => {
                const ar1 = new Int32Array([1, 2, 3, 4, 5]);
                const actual = ar1.at(-10);
                expect(actual).toBeUndefined();
            });
        });
        it("keys()", () => {
            const ar = new Int32Array([1, 2, 3]);
            const keys = [...ar.keys()];
            expect(keys).toEqual([0, 1, 2]);
        });
        it("values()", () => {
            const ar = new Int32Array([1, 2, 3]);
            const values = [...ar.values()];
            expect(values).toEqual([1, 2, 3]);
        });
        it("entries()", () => {
            const ar = new Int32Array([1, 2, 3]);
            const entries = [...ar.entries()];
            expect(entries).toEqual([[0, 1], [1, 2], [2, 3]]);
        });
        it("toArray()", () => {
            const ar = new Int32Array([1, 2, 3]);
            const values = ar.toArray();
            expect(values).toEqual([1, 2, 3]);
        });
    });

    // NOTE: remember to check for struct reference equality on subarray
    describe("on structured types", () => {
        const Point16 = StructType([
            { name: "x", type: int16 },
            { name: "y", type: int16 },
        ]);
        type Point32 = InstanceType<typeof Point32>;
        const Point32 = StructType([
            { name: "x", type: int32 },
            { name: "y", type: int32 },
        ]);
        const Point64 = StructType([
            { name: "x", type: bigint64 },
            { name: "y", type: bigint64 },
        ]);
        const Point16Array = ArrayType(Point16);
        const Point32Array = ArrayType(Point32);
        const Point32Arrayx2 = Point32Array.toFixed(2);
        const Point64Array = ArrayType(Point64);
        const P = (p: Point32) => [p[0], p[1]] as [number, number];
        describe("copyWithin()", () => {
            it("positive target, positive start, no end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, 2);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([5, 5]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, positive start, positive end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, 2, 4);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, positive start, positive end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(2, 0, 3);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("positive target, positive start, negative end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, 2, -1);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, positive start, negative end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(2, 0, -1);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("positive target, negative start, no end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, -3);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([5, 5]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, negative start, positive end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, -3, 4);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, negative start, positive end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(2, -5, 3);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("positive target, negative start, negative end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(0, -3, -1);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("positive target, negative start, negative end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(2, -5, -1);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("negative target, positive start, no end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, 2);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([5, 5]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, positive start, positive end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, 2, 4);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, positive start, positive end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-3, 0, 3);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("negative target, positive start, negative end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, 2, -1);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, positive start, negative end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-3, 0, -1);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("negative target, negative start, no end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, -3);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([5, 5]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, negative start, positive end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, -3, 4);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, negative start, positive end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-3, -5, 3);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
            it("negative target, negative start, negative end, copy from end to start, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-5, -3, -1);
                expect(P(ar[0])).toEqual([3, 3]);
                expect(P(ar[1])).toEqual([4, 4]);
                expect(P(ar[2])).toEqual([3, 3]);
                expect(P(ar[3])).toEqual([4, 4]);
                expect(P(ar[4])).toEqual([5, 5]);
            });
            it("negative target, negative start, negative end, copy from start to end, fits", () => {
                const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                ar.copyWithin(-3, -5, -1);
                expect(P(ar[0])).toEqual([1, 1]);
                expect(P(ar[1])).toEqual([2, 2]);
                expect(P(ar[2])).toEqual([1, 1]);
                expect(P(ar[3])).toEqual([2, 2]);
                expect(P(ar[4])).toEqual([3, 3]);
            });
        });
        describe("every()", () => {
            it("when all match predicate", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const actual = ar.every(x => x[0] >= 0);
                expect(actual).toBe(true);
            });
            it("when one element does not match predicate", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const actual = ar.every(x => x[0] > 0);
                expect(actual).toBe(false);
            });
            it("when empty", () => {
                const ar = new Point32Array([]);
                const actual = ar.every(x => x[0] > 0);
                expect(actual).toBe(true);
            });
        });
        describe("some()", () => {
            it("when all match predicate", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const actual = ar.some(x => x[0] >= 0);
                expect(actual).toBe(true);
            });
            it("when one element matches predicate", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const actual = ar.some(x => x[0] === 2);
                expect(actual).toBe(true);
            });
            it("when no elements match predicate", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const actual = ar.some(x => x[0] < 0);
                expect(actual).toBe(false);
            });
            it("when empty", () => {
                const ar = new Point32Array([]);
                const actual = ar.some(x => x[0] > 0);
                expect(actual).toBe(false);
            });
        });
        describe("fill()", () => {
            describe("fills array with value", () => {
                it("no start, no end", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]));
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("no start, positive end less than length", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), undefined, 4);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([5, 5]);
                });
                it("no start, positive end greater than length", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), undefined, 10);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("no start, negative end greater than -length", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), undefined, -2);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([4, 4]);
                    expect(P(ar[4])).toEqual([5, 5]);
                });
                it("no start, negative end less than -length", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), undefined, -10);
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([2, 2]);
                    expect(P(ar[2])).toEqual([3, 3]);
                    expect(P(ar[3])).toEqual([4, 4]);
                    expect(P(ar[4])).toEqual([5, 5]);
                });
                it("positive start greater than 0, no end", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), 1);
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("positive start greater than length, no end", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), 10);
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([2, 2]);
                    expect(P(ar[2])).toEqual([3, 3]);
                    expect(P(ar[3])).toEqual([4, 4]);
                    expect(P(ar[4])).toEqual([5, 5]);
                });
                it("negative start greater than -length, no end", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), -2);
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([2, 2]);
                    expect(P(ar[2])).toEqual([3, 3]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("negative start less than -length, no end", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                    ar.fill(new Point32([0, 0]), -10);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([0, 0]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
            });
        });
        describe("filter()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual).toBeInstanceOf(Point32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual).toBeInstanceOf(Point32Array.toFixed(1));
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Point32Array(new ArrayBuffer(8));
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Point32Array(new SharedArrayBuffer(8));
                    const actual = ar.filter(x => x[0] % 2 === 0);
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });
            it("produces only matching values", () => {
                const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3]]);
                const ar2 = ar1.filter(x => x[0] % 2 === 0);
                expect(ar2.length).toBe(2);
                expect([ar2[0][0], ar2[0][1]]).toEqual([0, 0]);
                expect([ar2[1][0], ar2[1][1]]).toEqual([2, 2]);
            });
        });
        describe("find()", () => {
            it("when predicate matches", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.find(x => x[0] === 2);
                expect(actual && P(actual)).toEqual([2, 2]);
            });
            it("when predicate does not match", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.find(x => x[0] < 0);
                expect(actual).toBeUndefined();
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.find(x => x[0] === 0, 1);
                expect(actual).toBeUndefined();
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [2, 2]]);
                const actual = ar.find((x, i) => x[0] === 2 && i > 2, 3);
                expect(actual && P(actual)).toEqual([2, 2]);
            });
        });
        describe("findIndex()", () => {
            it("when predicate matches", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.findIndex(x => x[0] === 2);
                expect(actual).toBe(2);
            });
            it("when predicate does not match", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.findIndex(x => x[0] < 0);
                expect(actual).toBe(-1);
            });
            it("when predicate does not match because fromIndex is supplied", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
                const actual = ar.findIndex(x => x[0] === 0, 1);
                expect(actual).toBe(-1);
            });
            it("when predicate match when fromIndex is supplied", () => {
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [2, 2]]);
                const actual = ar.findIndex((x, i) => x[0] === 2 && i > 2, 3);
                expect(actual).toBe(5);
            });
        });
        describe("forEach()", () => {
            it("visits each element", () => {
                const actual: [number, number][] = [];
                const ar = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                ar.forEach(i => actual.push([i[0], i[1]]));
                expect(actual).toEqual([[0, 0], [1, 1], [2, 2]]);
            })
        });
        describe("map()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[0, 0], [1, 1]]);
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual).toBeInstanceOf(Point32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual).toBeInstanceOf(Point32Arrayx2);
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[0, 0], [1, 1]]);
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Point32Array(new ArrayBuffer(8));
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Point32Array(new SharedArrayBuffer(8));
                    const actual = ar.map(x => new Point32([x[0] + 1, x[1] + 1]));
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });
            it("produces a typed array of mapped values", () => {
                const ar1 = new Point32Array([[0, 0], [1, 1]]);
                const ar2 = ar1.map(x => new Point32([x[0] + 3, x[1] + 3]));
                expect(ar2.length).toBe(2);
                expect([ar2[0][0], ar2[0][1]]).toEqual([3, 3]);
                expect([ar2[1][0], ar2[1][1]]).toEqual([4, 4]);
            });
        });
        describe("mapToArray()", () => {
            it("produces an array of mapped values", () => {
                const ar = new Point32Array([[0, 0], [1, 1]]);
                const actual = ar.mapToArray(x => ({ x: [x[0], x[1]] }));
                expect(actual).toEqual([{ x: [0, 0] }, { x: [1, 1] }]);
            });
        });
        describe("reduce()", () => {
            it("when empty, no initial value", () => {
                const ar = new Point32Array([]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([]);
                expect(value).toBeUndefined();
            });
            it("when empty, with initial value", () => {
                const ar = new Point32Array([]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([]);
                expect(P(value)).toEqual([99, 99]);
            });
            it("when single element, no initial value", () => {
                const ar = new Point32Array([[1, 1]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([]);
                expect(P(value)).toEqual([1, 1]);
            });
            it("when single element, with initial value", () => {
                const ar = new Point32Array([[1, 1]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([[[99, 99], [1, 1]]]);
                expect(P(value)).toEqual([100, 100]);
            });
            it("when multiple elements, no initial value", () => {
                const ar = new Point32Array([[1, 1], [33, 33], [44, 44]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([[[1, 1], [33, 33]], [[34, 34], [44, 44]]]);
                expect(P(value)).toEqual([78, 78]);
            });
            it("when multiple elements, with initial value", () => {
                const ar = new Point32Array([[1, 1], [33, 33], [44, 44]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduce((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([[[99, 99], [1, 1]], [[100, 100], [33, 33]], [[133, 133], [44, 44]]]);
                expect(P(value)).toEqual([177, 177]);
            });
        });
        describe("reduceRight()", () => {
            it("when empty, no initial value", () => {
                const ar = new Point32Array([]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([]);
                expect(value).toBeUndefined();
            });
            it("when empty, with initial value", () => {
                const ar = new Point32Array([]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([]);
                expect(P(value)).toEqual([99, 99]);
            });
            it("when single element, no initial value", () => {
                const ar = new Point32Array([[1, 1]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([]);
                expect(P(value)).toEqual([1, 1]);
            });
            it("when single element, with initial value", () => {
                const ar = new Point32Array([[1, 1]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([[[99, 99], [1, 1]]]);
                expect(P(value)).toEqual([100, 100]);
            });
            it("when multiple elements, no initial value", () => {
                const ar = new Point32Array([[1, 1], [33, 33], [44, 44]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])));
                expect(order).toEqual([[[44, 44], [33, 33]], [[77, 77], [1, 1]]]);
                expect(P(value)).toEqual([78, 78]);
            });
            it("when multiple elements, with initial value", () => {
                const ar = new Point32Array([[1, 1], [33, 33], [44, 44]]);
                const order: [m: [number, number], v: [number, number]][] = [];
                const value = ar.reduceRight((m, v) => (order.push([P(m), P(v)]), new Point32([m[0] + v[0], m[1] + v[1]])), new Point32([99, 99]));
                expect(order).toEqual([[[99, 99], [44, 44]], [[143, 143], [33, 33]], [[176, 176], [1, 1]]]);
                expect(P(value)).toEqual([177, 177]);
            });
        });
        describe("set()", () => {
            describe("when source is ArrayLike", () => {
                it("and source is smaller, at default offset", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    ar.set([new Point32([1, 1]), new Point32([2, 2]), new Point32([3, 3])]);
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([2, 2]);
                    expect(P(ar[2])).toEqual([3, 3]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("and source is smaller, at offset within bounds", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    ar.set([new Point32([1, 1]), new Point32([2, 2]), new Point32([3, 3])], 2);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([1, 1]);
                    expect(P(ar[3])).toEqual([2, 2]);
                    expect(P(ar[4])).toEqual([3, 3]);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set([new Point32([1, 1]), new Point32([2, 2]), new Point32([3, 3])], 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set([new Point32([1, 1]), new Point32([2, 2]), new Point32([3, 3]), new Point32([4, 4]), new Point32([5, 5]), new Point32([6, 6])])).toThrow();
                });
            });
            describe("when source is same TypedArray type", () => {
                it("and source is smaller, at default offset", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    ar.set(new Point32Array([[1, 1], [2, 2], [3, 3]]));
                    expect(P(ar[0])).toEqual([1, 1]);
                    expect(P(ar[1])).toEqual([2, 2]);
                    expect(P(ar[2])).toEqual([3, 3]);
                    expect(P(ar[3])).toEqual([0, 0]);
                    expect(P(ar[4])).toEqual([0, 0]);
                });
                it("and source is smaller, at offset within bounds", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    ar.set(new Point32Array([[1, 1], [2, 2], [3, 3]]), 2);
                    expect(P(ar[0])).toEqual([0, 0]);
                    expect(P(ar[1])).toEqual([0, 0]);
                    expect(P(ar[2])).toEqual([1, 1]);
                    expect(P(ar[3])).toEqual([2, 2]);
                    expect(P(ar[4])).toEqual([3, 3]);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point32Array([[1, 1], [2, 2], [3, 3]]), 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]]))).toThrow();
                });
            });
            describe("when source is compatible TypedArray type", () => {
                it("and source is smaller, at default offset", () => {
                    // TODO: allow coersion
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point16Array([[1, 1], [2, 2], [3, 3]]))).toThrow();
                    // expect(P(ar[0])).toEqual([1, 1]);
                    // expect(P(ar[1])).toEqual([2, 2]);
                    // expect(P(ar[2])).toEqual([3, 3]);
                    // expect(P(ar[3])).toEqual([0, 0]);
                    // expect(P(ar[4])).toEqual([0, 0]);
                });
                it("and source is smaller, at offset within bounds", () => {
                    // TODO: allow coersion
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point16Array([[1, 1], [2, 2], [3, 3]]), 2)).toThrow();
                    // expect(P(ar[0])).toEqual([0, 0]);
                    // expect(P(ar[1])).toEqual([0, 0]);
                    // expect(P(ar[2])).toEqual([1, 1]);
                    // expect(P(ar[3])).toEqual([2, 2]);
                    // expect(P(ar[4])).toEqual([3, 3]);
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point16Array([[1, 1], [2, 2], [3, 3]]), 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point16Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]]))).toThrow();
                });
            });
            describe("when source is incompatible TypedArray type", () => {
                it("and source is smaller, at default offset, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point64Array([[1, 1], [2, 2], [3, 3]]) as any)).toThrow();
                });
                it("and source is smaller, at offset within bounds, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point64Array([[1, 1], [2, 2], [3, 3]]) as any, 2)).toThrow();
                });
                it("and source is smaller, but offset+source.length is outside of bounds, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point64Array([[1, 1], [2, 2], [3, 3]]) as any, 3)).toThrow();
                });
                it("and source is larger, should throw", () => {
                    const ar = new Point32Array([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]);
                    expect(() => ar.set(new Point64Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]]) as any)).toThrow();
                });
            });
        });
        describe("subarray()", () => {
            describe("for whole array", () => {
                it("is not same array", () => {
                    const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                    const ar2 = ar1.subarray();
                    expect(ar2).not.toBe(ar1);
                });
                it("is same buffer, byteOffset, byteLength, and cached values", () => {
                    const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                    const ar2 = ar1.subarray();
                    expect(ar2.buffer).toBe(ar1.buffer);
                    expect(ar2.byteOffset).toBe(ar1.byteOffset);
                    expect(ar2.byteLength).toBe(ar1.byteLength);
                    expect(ar2[0]).toBe(ar1[0]);
                });
            });
            it("no start, positive end less than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(undefined, 4);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(4);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
            });
            it("no start, positive end greater than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(undefined, 10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(5);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
                expect(P(ar2[4])).toEqual([5, 5]);
            });
            it("no start, negative end greater than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(undefined, -2);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(3);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
            });
            it("no start, negative end less than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(undefined, -10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(0);
            });
            it("positive start greater than 0, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(1);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(4);
                expect(P(ar2[0])).toEqual([2, 2]);
                expect(P(ar2[1])).toEqual([3, 3]);
                expect(P(ar2[2])).toEqual([4, 4]);
                expect(P(ar2[3])).toEqual([5, 5]);
            });
            it("positive start greater than length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(0);
            });
            it("negative start greater than -length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(-2);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(2);
                expect(P(ar2[0])).toEqual([4, 4]);
                expect(P(ar2[1])).toEqual([5, 5]);
            });
            it("negative start less than -length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.subarray(-10);
                expect(ar2.buffer).toBe(ar1.buffer);
                expect(ar2.length).toBe(5);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
                expect(P(ar2[4])).toEqual([5, 5]);
            });
        });
        describe("slice()", () => {
            describe("produces a new TypedArray with equivalent length fixing", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[0, 0], [1, 1]]);
                    const actual = ar.slice();
                    expect(actual).toBeInstanceOf(Point32Array);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.slice();
                    expect(actual).toBeInstanceOf(Point32Array.toFixed(2));
                });
            });
            describe("produces a new TypedArray with independent buffer", () => {
                it("(non-fixed-length)", () => {
                    const ar = new Point32Array([[0, 0], [1, 1]]);
                    const actual = ar.slice();
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
                it("(fixed-length)", () => {
                    const ar = new Point32Arrayx2([[0, 0], [1, 1]]);
                    const actual = ar.slice();
                    expect(actual.buffer).not.toBe(ar.buffer);
                });
            });
            describe("produces a new TypedArray with same memory sharing requirements", () => {
                it("(non-shared)", () => {
                    const ar = new Point32Array(new ArrayBuffer(8));
                    const actual = ar.slice();
                    expect(actual.buffer).toBeInstanceOf(ArrayBuffer);
                });
                it("(shared)", () => {
                    const ar = new Point32Array(new SharedArrayBuffer(8));
                    const actual = ar.slice();
                    expect(actual.buffer).toBeInstanceOf(SharedArrayBuffer);
                });
            });
            describe("for whole array", () => {
                it("is not same array", () => {
                    const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                    const ar2 = ar1.slice();
                    expect(ar2).not.toBe(ar1);
                });
                it("is not same buffer", () => {
                    const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                    const ar2 = ar1.slice();
                    expect(ar2.buffer).not.toBe(ar1.buffer);
                    expect(ar2.byteOffset).toBe(0);
                });
                it("has equivalent elements", () => {
                    const ar1 = new Point32Array([[0, 0], [1, 1], [2, 2]]);
                    const ar2 = ar1.slice();
                    expect(ar2.length).toBe(3);
                    expect(P(ar2[0])).toEqual([0, 0]);
                    expect(P(ar2[1])).toEqual([1, 1]);
                    expect(P(ar2[2])).toEqual([2, 2]);
                });
            });
            it("no start, positive end less than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(undefined, 4);
                expect(ar2.length).toBe(4);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
            });
            it("no start, positive end greater than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(undefined, 10);
                expect(ar2.length).toBe(5);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
                expect(P(ar2[4])).toEqual([5, 5]);
            });
            it("no start, negative end greater than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(undefined, -2);
                expect(ar2.length).toBe(3);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
            });
            it("no start, negative end less than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(undefined, -10);
                expect(ar2.length).toBe(0);
            });
            it("positive start greater than 0, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(1);
                expect(ar2.length).toBe(4);
                expect(P(ar2[0])).toEqual([2, 2]);
                expect(P(ar2[1])).toEqual([3, 3]);
                expect(P(ar2[2])).toEqual([4, 4]);
                expect(P(ar2[3])).toEqual([5, 5]);
            });
            it("positive start greater than length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(10);
                expect(ar2.length).toBe(0);
            });
            it("negative start greater than -length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(-2);
                expect(ar2.length).toBe(2);
                expect(P(ar2[0])).toEqual([4, 4]);
                expect(P(ar2[1])).toEqual([5, 5]);
            });
            it("negative start less than -length, no end", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const ar2 = ar1.slice(-10);
                expect(ar2.length).toBe(5);
                expect(P(ar2[0])).toEqual([1, 1]);
                expect(P(ar2[1])).toEqual([2, 2]);
                expect(P(ar2[2])).toEqual([3, 3]);
                expect(P(ar2[3])).toEqual([4, 4]);
                expect(P(ar2[4])).toEqual([5, 5]);
            });
        });
        describe("at()", () => {
            it("positive index less than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const actual = ar1.at(4);
                expect(actual && P(actual)).toEqual([5, 5]);
            });
            it("positive index greater than length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const actual = ar1.at(10);
                expect(actual).toBeUndefined();
            });
            it("negative index greater than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const actual = ar1.at(-2);
                expect(actual && P(actual)).toEqual([4, 4]);
            });
            it("negative index less than -length", () => {
                const ar1 = new Point32Array([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
                const actual = ar1.at(-10);
                expect(actual).toBeUndefined();
            });
        });
        it("keys()", () => {
            const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
            const keys = [...ar.keys()];
            expect(keys).toEqual([0, 1, 2]);
        });
        it("values()", () => {
            const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
            const values = [...ar.values()].map(P);
            expect(values).toEqual([[1, 1], [2, 2], [3, 3]]);
        });
        it("entries()", () => {
            const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
            const entries = [...ar.entries()].map(([k, v]) => [k, P(v)]);
            expect(entries).toEqual([[0, [1, 1]], [1, [2, 2]], [2, [3, 3]]]);
        });
        it("toArray()", () => {
            const ar = new Point32Array([[1, 1], [2, 2], [3, 3]]);
            const values = ar.toArray().map(P);
            expect(values).toEqual([[1, 1], [2, 2], [3, 3]]);
        });
    });
});
