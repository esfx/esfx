import { lazyinit } from "../lazyinit";

it("lazyinit", () => {
    let f = false;
    class C {
        @lazyinit(() => {
            f = true;
            return 1;
        })
        x!: number;
    }

    const c = new C();
    expect(f).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(c, "x")).toBe(false);
    expect(c.x).toBe(1);
    expect(f).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(c, "x")).toBe(true);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.enumerable).toBe(true);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.configurable).toBe(true);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.writable).toBe(true);
});

it("lazyinit non-enumerable", () => {
    let f = false;
    class C {
        @lazyinit(() => {
            f = true;
            return 1;
        }, { enumerable: false })
        x!: number;
    }

    const c = new C();
    expect(c.x).toBe(1);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.enumerable).toBe(false);
});

it("lazyinit non-configurable", () => {
    let f = false;
    class C {
        @lazyinit(() => {
            f = true;
            return 1;
        }, { configurable: false })
        x!: number;
    }

    const c = new C();
    expect(c.x).toBe(1);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.configurable).toBe(false);
});

it("lazyinit non-writable", () => {
    let f = false;
    class C {
        @lazyinit(() => {
            f = true;
            return 1;
        }, { writable: false })
        x!: number;
    }

    const c = new C();
    expect(c.x).toBe(1);
    expect(Object.getOwnPropertyDescriptor(c, "x")!.writable).toBe(false);
});
