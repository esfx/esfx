import { StructType, ArrayType, int32 } from "..";
import { isLittleEndian } from "../endianness";
import { bigint64 } from "../primitive";

describe("simple struct", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    it("size", () => {
        expect(Point.SIZE).toBe(8);
    });
    it("defaults", () => {
        const p = new Point();
        expect(p.x).toBe(0);
        expect(p.y).toBe(0);
    });
    it("can set/get fields", () => {
        const p = new Point();
        p.x = 1;
        p.y = 2;
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can set/get elements", () => {
        const p = new Point();
        p[0] = 1;
        p[1] = 2;
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p[0]).toBe(1);
        expect(p[1]).toBe(2);
    });
    it("can init from object", () => {
        const p = new Point({ x: 1, y: 2 });
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can init from array", () => {
        const p = new Point([1, 2]);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 1, isLittleEndian);
        view.setInt32(4, 2, isLittleEndian);
        const p = new Point(buffer);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
});
describe("complex struct", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Line = StructType([
        { name: "from", type: Point },
        { name: "to", type: Point }
    ]);
    it("size", () => {
        expect(Line.SIZE).toBe(16);
    });
    it("defaults", () => {
        const l = new Line();
        expect(l.from.x).toBe(0);
        expect(l.from.y).toBe(0);
        expect(l.to.x).toBe(0);
        expect(l.to.y).toBe(0);
    });
    it("can set/get fields", () => {
        const l = new Line();
        l.from = new Point({ x: 1, y: 2 });
        l.to = new Point({ x: 3, y: 4 });
        expect(l.from.x).toBe(1);
        expect(l.from.y).toBe(2);
        expect(l.to.x).toBe(3);
        expect(l.to.y).toBe(4);
    });
    it("can init from object", () => {
        const l = new Line({ from: { x: 1, y: 2 }, to: { x: 3, y: 4 } });
        expect(l.from.x).toBe(1);
        expect(l.from.y).toBe(2);
        expect(l.to.x).toBe(3);
        expect(l.to.y).toBe(4);
    });
    it("can init from array", () => {
        const l = new Line([[1, 2], [3, 4]]);
        expect(l.from.x).toBe(1);
        expect(l.from.y).toBe(2);
        expect(l.to.x).toBe(3);
        expect(l.to.y).toBe(4);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setInt32(0, 1, isLittleEndian);
        view.setInt32(4, 2, isLittleEndian);
        view.setInt32(8, 3, isLittleEndian);
        view.setInt32(12, 4, isLittleEndian);
        const l = new Line(buffer);
        expect(l.from.x).toBe(1);
        expect(l.from.y).toBe(2);
        expect(l.to.x).toBe(3);
        expect(l.to.y).toBe(4);
    });
    it("can contain array type", () => {
        const PointArrayx2 = ArrayType(Point, 2);
        const Record = StructType([
            { name: "values", type: PointArrayx2 }
        ]);
        const rec = new Record();
        rec.values
    });
});
describe("subclass", () => {
    class Point extends StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]) {
    }
    it("size", () => {
        expect(Point.SIZE).toBe(8);
    });
    it("defaults", () => {
        const p = new Point();
        expect(p.x).toBe(0);
        expect(p.y).toBe(0);
    });
    it("can set/get fields", () => {
        const p = new Point();
        p.x = 1;
        p.y = 2;
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can init from object", () => {
        const p = new Point({ x: 1, y: 2 });
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can init from array", () => {
        const p = new Point([1, 2]);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 1, isLittleEndian);
        view.setInt32(4, 2, isLittleEndian);
        const p = new Point(buffer);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
    });
});
describe("baseType", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Point3D = StructType(Point, [
        { name: "z", type: int32 }
    ]);
    it("size", () => {
        expect(Point3D.SIZE).toBe(12);
    });
    it("defaults", () => {
        const p = new Point3D();
        expect(p.x).toBe(0);
        expect(p.y).toBe(0);
        expect(p.z).toBe(0);
    });
    it("can set/get fields", () => {
        const p = new Point3D();
        p.x = 1;
        p.y = 2;
        p.z = 3;
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p.z).toBe(3);
    });
    it("can init from object", () => {
        const p = new Point3D({ x: 1, y: 2, z: 3 });
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p.z).toBe(3);
    });
    it("can init from array", () => {
        const p = new Point3D([1, 2, 3]);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p.z).toBe(3);
    });
    it("can init from buffer", () => {
        const buffer = new ArrayBuffer(12);
        const view = new DataView(buffer);
        view.setInt32(0, 1, isLittleEndian);
        view.setInt32(4, 2, isLittleEndian);
        view.setInt32(8, 3, isLittleEndian);
        const p = new Point3D(buffer);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p.z).toBe(3);
    });
});
describe("byte order", () => {
    const Point = StructType({
        x: int32,
        y: int32
    });
    describe("read()", () => {
        it("big-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            view.setInt32(0, 0x12345678, false);
            view.setInt32(4, 0x98765432 >> 0, false);
            const p = Point.read(view.buffer, 0, false, "BE");
            expect(p.x).toBe(0x12345678);
            expect(p.y).toBe(0x98765432 >> 0);
        });
        it("little-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            view.setInt32(0, 0x12345678, true);
            view.setInt32(4, 0x98765432 >> 0, true);
            const p = Point.read(view.buffer, 0, false, "LE");
            expect(p.x).toBe(0x12345678);
            expect(p.y).toBe(0x98765432 >> 0);
        });
    });
    describe("write()", () => {
        it("big-endian byte order", () => {
            const p = new Point({
                x: 0x12345678,
                y: 0x98765432,
            });
            const view = new DataView(new ArrayBuffer(8));
            Point.write(view.buffer, 0, p, "BE");
            expect(view.getInt32(0, false)).toBe(0x12345678);
            expect(view.getInt32(4, false)).toBe(0x98765432 >> 0);
        });
        it("little-endian byte order", () => {
            const p = new Point({
                x: 0x12345678,
                y: 0x98765432,
            });
            const view = new DataView(new ArrayBuffer(8));
            Point.write(view.buffer, 0, p, "LE");
            expect(view.getInt32(0, true)).toBe(0x12345678);
            expect(view.getInt32(4, true)).toBe(0x98765432 >> 0);
        });
    });
});