import { readonly } from "../readonly";
import { writable } from "../writable";

it("writable", () => {
    class C {
        @writable
        @readonly
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.writable).toBe(true);
});