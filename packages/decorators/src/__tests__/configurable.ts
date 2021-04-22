import { configurable } from "../configurable";
import { nonconfigurable } from "../nonconfigurable";

it("configurable", () => {
    class C {
        @configurable
        @nonconfigurable
        method() {}
    }

    expect(Object.getOwnPropertyDescriptor(C.prototype, "method")!.configurable).toBe(true);
});
