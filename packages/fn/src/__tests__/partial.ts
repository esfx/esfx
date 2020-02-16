import {
    partial,
    placeholder as _,
    thisPlaceholder as _this,
    restPlaceholder as _rest,
} from "../partial";

describe("partial", () => {
    it("leading placeholder", () => {
        const fn = jest.fn((a: number, b: number) => a + b);
        const pfn = partial(fn, _, 2);
        expect(fn).not.toHaveBeenCalled();
        pfn(1);
        expect(fn).toHaveBeenCalledWith(1, 2);
    });
    it("trailing placeholder", () => {
        const fn = jest.fn((a: number, b: number) => a + b);
        const pfn = partial(fn, 2, _);
        expect(fn).not.toHaveBeenCalled();
        pfn(1);
        expect(fn).toHaveBeenCalledWith(2, 1);
    });
    it("middle placeholder", () => {
        const fn = jest.fn((a: number, b: number, c: number) => a + b + c);
        const pfn = partial(fn, 2, _, 3);
        expect(fn).not.toHaveBeenCalled();
        pfn(1);
        expect(fn).toHaveBeenCalledWith(2, 1, 3);
    });
    it("multiple placeholders", () => {
        const fn = jest.fn((a: number, b: number, c: number) => a + b + c);
        const pfn = partial(fn, _, 2, _);
        expect(fn).not.toHaveBeenCalled();
        pfn(1, 3);
        expect(fn).toHaveBeenCalledWith(1, 2, 3);
    });
    it("preserves this", () => {
        const fn = jest.fn(function(this: any, a: number) { return this; });
        const obj = {};
        const pfn = partial(fn, _);
        expect(fn).not.toHaveBeenCalled();
        expect(pfn.call(obj, 1)).toBe(obj);
        expect(fn).toHaveBeenCalledWith(1);
    });
    it("this placeholder", () => {
        const fn = jest.fn(function(this: any, a: number) { return this; });
        const obj = {};
        const pfn = partial(fn, _this, 1);
        expect(fn).not.toHaveBeenCalled();
        expect(pfn(obj)).toBe(obj);
        expect(fn).toHaveBeenCalledWith(1);
    });
    it("leading this placeholder and normal placeholder", () => {
        const fn = jest.fn(function(this: {}, a: number) { return this; });
        const obj = {};
        const pfn = partial(fn, _this, _);
        expect(fn).not.toHaveBeenCalled();
        expect(pfn(obj, 1)).toBe(obj);
        expect(fn).toHaveBeenCalledWith(1);
    });
    it("trailing this placeholder and normal placeholder", () => {
        const fn = jest.fn(function(this: {}, a: number) { return this; });
        const obj = {};
        const pfn = partial(fn, _, _this);
        expect(fn).not.toHaveBeenCalled();
        expect(pfn(1, obj)).toBe(obj);
        expect(fn).toHaveBeenCalledWith(1);
    });
    it("extra args are truncated", () => {
        const fn = jest.fn((...args: [number, number?]) => args.length);
        const pfn = partial(fn, _);
        expect((pfn as any)(1, 2)).toBe(1);
    });
    it("rest placeholder", () => {
        const fn = jest.fn((...args: [number, number?]) => args.length);
        const pfn = partial(fn, _, _rest);
        expect((pfn as any)(1, 2)).toBe(2);
    });
    it("name", () => {
        const fn = () => {};
        const pfn = partial(fn);
        expect(pfn).not.toBe(fn);
        expect(fn.name).toBe("fn");
        expect(pfn.name).toBe("partial fn");
    });
});