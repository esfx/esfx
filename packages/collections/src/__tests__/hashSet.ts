import { Equatable, Equaler } from "@esfx/equatable";
import { HashSet } from '../';

class Point {
    constructor(readonly x: number, readonly y: number) {
    }

    [Equatable.equals](other: unknown) {
        return other instanceof Point
            && this.x === other.x
            && this.y === other.y;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.x)
             ^ Equaler.defaultEqualer.hash(this.y);
    }
}

it("add", () => {
    const p0 = new Point(10, 20);
    const p1 = new Point(10, 20);
    const p2 = new Point(30, 40);
    const set = new HashSet<Point>();
    set.add(p0);
    set.add(p1);
    set.add(p2);
    expect(set.size).toBe(2);
    expect(set.has(p0)).toBe(true);
    expect(set.has(p1)).toBe(true);
    expect(set.has(p2)).toBe(true);
});

it("delete", () => {
    const p0 = new Point(10, 20);
    const p1 = new Point(10, 20);
    const set = new HashSet<Point>();
    set.add(p0);
    set.delete(p1);
    expect(set.size).toBe(0);
});