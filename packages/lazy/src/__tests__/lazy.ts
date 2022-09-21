import { jest } from "@jest/globals";
import { Lazy } from "..";

describe("from()", () => {
    it("eval only once", () => {
        const fn = jest.fn();
        fn.mockReturnValue(0);

        const lazy = Lazy.from(fn);
        expect(fn).toBeCalledTimes(0);
        expect(lazy.hasValue).toBe(false);
        expect(lazy.value).toBe(0);
        expect(lazy.hasValue).toBe(true);
        expect(fn).toBeCalledTimes(1);
        expect(lazy.value).toBe(0);
        expect(fn).toBeCalledTimes(1);
    });
    it("throws if recursive", () => {
        const lazy: Lazy<any> = Lazy.from(() => lazy.value);
        expect(lazy.hasValue).toBe(false);
        expect(() => lazy.value).toThrow();
        expect(lazy.hasValue).toBe(false);
    });
});

describe("for()", () => {
    it("is value", () => {
        const lazy = Lazy.for(0);
        expect(lazy.hasValue).toBe(true);
        expect(lazy.value).toBe(0);
    })
});