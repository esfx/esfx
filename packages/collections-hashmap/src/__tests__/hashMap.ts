import { Equatable, Equaler } from "@esfx/equatable";
import { HashMap } from '..';

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
    const set = new HashMap<Point, string>();
    set.set(p0, "p0");
    set.set(p1, "p1");
    set.set(p2, "p2");
    expect(set.size).toBe(2);
    expect(set.has(p0)).toBe(true);
    expect(set.has(p1)).toBe(true);
    expect(set.has(p2)).toBe(true);
    expect(set.get(p0)).toBe("p1");
    expect(set.get(p1)).toBe("p1");
    expect(set.get(p2)).toBe("p2");
});

it("delete", () => {
    const p0 = new Point(10, 20);
    const p1 = new Point(10, 20);
    const set = new HashMap<Point, string>();
    set.set(p0, "p0");
    set.delete(p1);
    expect(set.size).toBe(0);
});