import { Equaler, Equatable, StructuralEquatable } from "@esfx/equatable";
import { StructType, int32 } from "..";

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
        view.setInt32(0, 1);
        view.setInt32(4, 2);
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
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        view.setInt32(8, 3);
        view.setInt32(12, 4);
        const l = new Line(buffer);
        expect(l.from.x).toBe(1);
        expect(l.from.y).toBe(2);
        expect(l.to.x).toBe(3);
        expect(l.to.y).toBe(4);
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
        view.setInt32(0, 1);
        view.setInt32(4, 2);
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
        view.setInt32(0, 1);
        view.setInt32(4, 2);
        view.setInt32(8, 3);
        const p = new Point3D(buffer);
        expect(p.x).toBe(1);
        expect(p.y).toBe(2);
        expect(p.z).toBe(3);
    });
});
describe("Equatable.equals", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Line = StructType([
        { name: "from", type: Point },
        { name: "to", type: Point }
    ]);
    it("same type, same values", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 20 });
        expect(p1[Equatable.equals](p2)).toBe(true);
        expect(p2[Equatable.equals](p1)).toBe(true);
    });
    it("complex type, same values", () => {
        const l1 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        const l2 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        expect(l1[Equatable.equals](l2)).toBe(true);
        expect(l2[Equatable.equals](l1)).toBe(true);
    });
    it("same type, different values", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        expect(p1[Equatable.equals](p2)).toBe(false);
        expect(p2[Equatable.equals](p1)).toBe(false);
    });
    it("similar type, same values", () => {
        const Vector = StructType([
            { name: "x", type: int32 },
            { name: "y", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ x: 10, y: 20 });
        expect(p[Equatable.equals](v)).toBe(true);
        expect(v[Equatable.equals](p)).toBe(true);
    });
    it("different type, same values", () => {
        const Vector = StructType([
            { name: "dx", type: int32 },
            { name: "dy", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ dx: 10, dy: 20 });
        expect(p[Equatable.equals](v)).toBe(false);
        expect(v[Equatable.equals](p)).toBe(false);
    });
});
describe("Equatable.hash", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Line = StructType([
        { name: "from", type: Point },
        { name: "to", type: Point }
    ]);
    it("repeatable", () => {
        const p = new Point({ x: 10, y: 20 });
        expect(p[Equatable.hash]()).toBe(p[Equatable.hash]());
    });
    it("unique", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        expect(p1[Equatable.hash]()).not.toBe(p2[Equatable.hash]());
    });
    it("complex", () => {
        const l1 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        const l2 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        expect(l1[Equatable.hash]()).toBe(l2[Equatable.hash]());
    });
    it("similar type, same values, same hash", () => {
        const Vector = StructType([
            { name: "x", type: int32 },
            { name: "y", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ x: 10, y: 20 });
        expect(p[Equatable.hash]()).toBe(v[Equatable.hash]());
    });
    it("different type, same values, different hash", () => {
        const Vector = StructType([
            { name: "dx", type: int32 },
            { name: "dy", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ dx: 10, dy: 20 });
        expect(p[Equatable.hash]()).not.toBe(v[Equatable.hash]());
    });
});
describe("StructuralEquatable.structuralEquals", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Line = StructType([
        { name: "from", type: Point },
        { name: "to", type: Point }
    ]);
    it("same type, same values", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 20 });
        expect(p1[StructuralEquatable.structuralEquals](p2, Equaler.defaultEqualer)).toBe(true);
        expect(p2[StructuralEquatable.structuralEquals](p1, Equaler.defaultEqualer)).toBe(true);
    });
    it("complex type, same values", () => {
        const l1 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        const l2 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        expect(l1[StructuralEquatable.structuralEquals](l2, Equaler.defaultEqualer)).toBe(true);
        expect(l2[StructuralEquatable.structuralEquals](l1, Equaler.defaultEqualer)).toBe(true);
    });
    it("same type, different values", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        expect(p1[StructuralEquatable.structuralEquals](p2, Equaler.defaultEqualer)).toBe(false);
        expect(p2[StructuralEquatable.structuralEquals](p1, Equaler.defaultEqualer)).toBe(false);
    });
    it("similar type, same values", () => {
        const Vector = StructType([
            { name: "x", type: int32 },
            { name: "y", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ x: 10, y: 20 });
        expect(p[StructuralEquatable.structuralEquals](v, Equaler.defaultEqualer)).toBe(true);
        expect(v[StructuralEquatable.structuralEquals](p, Equaler.defaultEqualer)).toBe(true);
    });
    it("different type, same values", () => {
        const Vector = StructType([
            { name: "dx", type: int32 },
            { name: "dy", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ dx: 10, dy: 20 });
        expect(p[StructuralEquatable.structuralEquals](v, Equaler.defaultEqualer)).toBe(false);
        expect(v[StructuralEquatable.structuralEquals](p, Equaler.defaultEqualer)).toBe(false);
    });
    it("custom equaler", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        // custom equaler that treats 20 and 21 as the same value
        const equaler = Equaler.create(
            (a, b) =>
                a === 20 && b === 21 ||
                a === 21 && b === 20 ||
                Equaler.defaultEqualer.equals(a, b),
            x =>
                x === 20 ? 0 :
                x === 21 ? 0 :
                Equaler.defaultEqualer.hash(x));
        expect(p1[StructuralEquatable.structuralEquals](p2, equaler)).toBe(true);
        expect(p2[StructuralEquatable.structuralEquals](p1, equaler)).toBe(true);
    });
});
describe("StructuralEquatable.structuralHash", () => {
    const Point = StructType([
        { name: "x", type: int32 },
        { name: "y", type: int32 }
    ]);
    const Line = StructType([
        { name: "from", type: Point },
        { name: "to", type: Point }
    ]);
    it("repeatable", () => {
        const p = new Point({ x: 10, y: 20 });
        expect(p[StructuralEquatable.structuralHash](Equaler.defaultEqualer)).toBe(p[StructuralEquatable.structuralHash](Equaler.defaultEqualer));
    });
    it("unique", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        expect(p1[StructuralEquatable.structuralHash](Equaler.defaultEqualer)).not.toBe(p2[StructuralEquatable.structuralHash](Equaler.defaultEqualer));
    });
    it("complex", () => {
        const l1 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        const l2 = new Line({ from: { x: 10, y: 20 }, to: { x: 15, y: 25 } });
        expect(l1[StructuralEquatable.structuralHash](Equaler.defaultEqualer)).toBe(l2[StructuralEquatable.structuralHash](Equaler.defaultEqualer));
    });
    it("similar type, same values, same hash", () => {
        const Vector = StructType([
            { name: "x", type: int32 },
            { name: "y", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ x: 10, y: 20 });
        expect(p[StructuralEquatable.structuralHash](Equaler.defaultEqualer)).toBe(v[StructuralEquatable.structuralHash](Equaler.defaultEqualer));
    });
    it("different type, same values, different hash", () => {
        const Vector = StructType([
            { name: "dx", type: int32 },
            { name: "dy", type: int32 }
        ]);
        const p = new Point({ x: 10, y: 20 });
        const v = new Vector({ dx: 10, dy: 20 });
        expect(p[StructuralEquatable.structuralHash](Equaler.defaultEqualer)).not.toBe(v[StructuralEquatable.structuralHash](Equaler.defaultEqualer));
    });
    it("custom equaler", () => {
        const p1 = new Point({ x: 10, y: 20 });
        const p2 = new Point({ x: 10, y: 21 });
        // custom equaler that treats 20 and 21 as the same value
        const equaler = Equaler.create(
            (a, b) =>
                a === 20 && b === 21 ||
                a === 21 && b === 20 ||
                Equaler.defaultEqualer.equals(a, b),
            x =>
                x === 20 ? 0 :
                x === 21 ? 0 :
                Equaler.defaultEqualer.hash(x));
        expect(p1[StructuralEquatable.structuralHash](equaler)).toBe(p2[StructuralEquatable.structuralHash](equaler));
    });
});