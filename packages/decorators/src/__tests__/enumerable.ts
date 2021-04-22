import { enumerable } from "../enumerable";
import { nonenumerable } from "../nonenumerable";

it("enumerable", () => {
    class C {
        @enumerable
        @nonenumerable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.enumerable).toBe(true);
});
