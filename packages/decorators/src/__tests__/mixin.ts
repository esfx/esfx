import { mixin } from "../mixin";

it("mixin", () => {
    type M = typeof M;
    const M = {
        method() {
            return 1;
        }
    };

    @mixin(M)
    class C {
    }

    interface C extends M {
    }

    const c = new C();
    expect(c.method()).toBe(1);
});