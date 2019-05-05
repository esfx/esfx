import { SortedSet } from "../";

it("add", () => {
    const set = new SortedSet();
    set.add(5);
    set.add(3);
    set.add(1);
    set.add(2);
    expect([...set]).toEqual([1, 2, 3, 5]);
});