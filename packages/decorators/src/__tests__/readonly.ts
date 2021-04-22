import { readonly } from "../readonly";
import { writable } from "../writable";

it("readonly", () => {
    class C {
        @readonly
        @writable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.writable).toBe(false);
});