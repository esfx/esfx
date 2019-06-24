import { Equatable, Equaler } from "@esfx/equatable";
import { MultiMap } from '..';

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
    const p3 = new Point(30, 40);
    const set = new MultiMap<string, Point>();
    set.add("a", p0);
    set.add("a", p1);
    set.add("a", p2);
    set.add("b", p3);
    expect(set.size).toBe(3);
    expect(set.has("a", p0)).toBe(true);
    expect(set.has("a", p1)).toBe(true);
    expect(set.has("a", p2)).toBe(true);
    expect(set.get("a")).toBeDefined();
    expect(set.get("a")!.has(p0)).toBe(true);
    expect(set.get("a")!.has(p1)).toBe(true);
    expect(set.get("a")!.has(p2)).toBe(true);
    expect(set.get("b")).toBeDefined();
    expect(set.get("b")!.has(p3)).toBe(true);
});

it("delete", () => {
    const p0 = new Point(10, 20);
    const p1 = new Point(10, 20);
    const set = new MultiMap<string, Point>();
    set.add("a", p0);
    set.delete("a", p1);
    expect(set.size).toBe(0);
});