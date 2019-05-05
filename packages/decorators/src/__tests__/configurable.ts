import { configurable, nonconfigurable } from "../configurable";

it("nonconfigurable", () => {
    class C {
        @nonconfigurable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.configurable).toBe(false);
});

it("configurable", () => {
    class C {
        @configurable
        @nonconfigurable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.configurable).toBe(true);
});
