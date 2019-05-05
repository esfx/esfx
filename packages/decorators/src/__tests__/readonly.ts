import { readonly, writable } from "../readonly";

it("readonly", () => {
    class C {
        @readonly
        @writable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.writable).toBe(false);
});

it("writable", () => {
    class C {
        @writable
        @readonly
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.writable).toBe(true);
});