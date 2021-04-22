import { configurable } from "../configurable";
import { nonconfigurable } from "../nonconfigurable";

it("nonconfigurable", () => {
    class C {
        @nonconfigurable
        @configurable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.configurable).toBe(false);
});
