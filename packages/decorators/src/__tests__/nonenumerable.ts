import { enumerable } from "../enumerable";
import { nonenumerable } from "../nonenumerable";

it("nonenumerable", () => {
    class C {
        @nonenumerable
        @enumerable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.enumerable).toBe(false);
});
