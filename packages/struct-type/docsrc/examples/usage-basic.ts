import { StructType, int32 } from "@esfx/struct-type";

// simple types
const Point = StructType([
    { name: "x", type: int32 },
    { name: "y", type: int32 },
] as const);

// complex types
const Line = StructType([
    { name: "from", type: Point },
    { name: "to", type: Point },
] as const);

// inherited types
const Point3D = StructType(Point, [
    { name: "z", type: int32 }
] as const);

// create instances
const p1 = new Point({ x: 1, y: 2 }); // by field name
const p2 = new Point([3, 4]); // by field ordinal

// copy contents
const buffer = new ArrayBuffer(16);
const l1 = new Line([p1, p2]);
l1.writeTo(buffer);

// read from field names
console.log(l1.from.x); // 1
console.log(l1.from.y); // 2
console.log(l1.to.x); // 3
console.log(l1.to.y); // 4

// read from field ordinals
console.log(l1[0][0]); // 1
console.log(l1[0][1]); // 2
console.log(l1[1][0]); // 3
console.log(l1[1][1]); // 4

// create from a buffer
const l2 = new Line(buffer);
