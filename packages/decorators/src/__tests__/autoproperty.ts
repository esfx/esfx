import { autoproperty } from "../autoproperty";

it("autoproperty", () => {
    class C {
        @autoproperty
        x = 1;
    }

    const c = new C();
    expect(c.x).toBe(1);
    expect(c.hasOwnProperty("x")).toBe(false);
});

it("autoproperty readonly", () => {
    class C {
        @autoproperty(true)
        x = 1;
    }

    const c = new C();
    expect(c.x).toBe(1);
    expect(() => { c.x = 2; }).toThrow();
});