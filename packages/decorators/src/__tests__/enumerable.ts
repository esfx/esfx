import { enumerable, nonenumerable } from "../enumerable";

it("enumerable", () => {
    class C {
        @enumerable
        @nonenumerable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.enumerable).toBe(true);
});

it("nonenumerable", () => {
    class C {
        @nonenumerable
        @enumerable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.enumerable).toBe(false);
});
