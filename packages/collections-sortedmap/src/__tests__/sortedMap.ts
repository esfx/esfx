import { SortedMap } from "..";

it("set", () => {
    const set = new SortedMap<number, string>();
    set.set(5, "5");
    set.set(3, "3");
    set.set(1, "1");
    set.set(2, "2");
    expect([...set]).toEqual([[1, "1"], [2, "2"], [3, "3"], [5, "5"]]);
});