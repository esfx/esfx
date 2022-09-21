import { jest } from "@jest/globals";
import { obsolete } from "../obsolete";

let consoleWarnSpy: globalThis.jest.SpyInstance;

beforeEach(() => {
    consoleWarnSpy = jest.spyOn(global.console, "warn");
    consoleWarnSpy.mockImplementation(() => {});
});

afterEach(() => {
    consoleWarnSpy.mockRestore();
});

it("obsolete method", () => {
    class C {
        @obsolete
        method() {}
    }

    const c = new C();
    expect(consoleWarnSpy).not.toBeCalled();
    c.method();
    c.method();
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith("DEPRECATION C#method: This member will be removed in a future revision.");
});

it("obsolete method with error", () => {
    class C {
        @obsolete("test", /*error*/ true)
        method() {}
    }

    const c = new C();
    expect(consoleWarnSpy).not.toBeCalled();
    expect(() => c.method()).toThrow("DEPRECATION C#method: test");
    expect(() => c.method()).toThrow("DEPRECATION C#method: test");
    expect(consoleWarnSpy).not.toBeCalled();
});

it("obsolete accessor get", () => {
    class C {
        @obsolete
        get x() { return 0; }
    }

    const c = new C();
    expect(consoleWarnSpy).not.toBeCalled();
    void c.x;
    void c.x;
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith("DEPRECATION C#x: This member will be removed in a future revision.");
});

it("obsolete accessor set", () => {
    class C {
        @obsolete
        set x(v: number) { }
    }

    const c = new C();
    expect(consoleWarnSpy).not.toBeCalled();
    c.x = 0;
    c.x = 0;
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith("DEPRECATION C#x: This member will be removed in a future revision.");
});

it("obsolete class", () => {
    @obsolete
    class C {
        method() {}
    }

    expect(consoleWarnSpy).not.toBeCalled();
    new C();
    new C();
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith("DEPRECATION C: This class will be removed in a future revision.");
});

it("obsolete class with message", () => {
    @obsolete("test")
    class C {
    }

    expect(consoleWarnSpy).not.toBeCalled();
    new C();
    new C();
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith("DEPRECATION C: test");
});

it("obsolete class with error", () => {
    @obsolete("test", /*error*/ true)
    class C {
    }

    expect(consoleWarnSpy).not.toBeCalled();
    expect(() => new C()).toThrow("DEPRECATION C: test");
    expect(() => new C()).toThrow("DEPRECATION C: test");
    expect(consoleWarnSpy).not.toBeCalled();
});