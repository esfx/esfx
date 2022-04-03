import { DefaultMemoizeCache } from "../defaultMemoizeCache.js";
import { memoize } from "../memoize.js";

describe("memoize", () => {
    it("passes provided arguments", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj = {};
        memo(1, obj);
        expect(fn).toHaveBeenCalledWith(1, obj);
    });
    it("returns return value", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj = {};
        fn.mockReturnValueOnce(obj);
        const result = memo();
        expect(result).toBe(obj);
    });
    it("returns same return value", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj1 = {};
        const obj2 = {};

        fn.mockReturnValueOnce(obj1);
        expect(memo()).toBe(obj1);

        fn.mockReturnValueOnce(obj2);
        expect(memo()).toBe(obj1);
    });
    it("throws same error", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj1 = new Error("a");
        const obj2 = new Error("b");

        fn.mockImplementationOnce(() => { throw obj1; });
        expect(() => memo()).toThrow(obj1);
        
        fn.mockImplementationOnce(() => { throw obj2; });
        expect(() => memo()).toThrow(obj1);

        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("throws if circular", () => {
        const fn = jest.fn();
        const memo = memoize(fn);

        fn.mockImplementationOnce(() => memo());
        expect(() => memo()).toThrow();

        fn.mockImplementationOnce(() => memo());
        expect(() => memo()).toThrow();

        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("evals once when no args", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        memo();
        memo();
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("evals once with same primitive arg", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        memo(1);
        memo(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("evals once with same non-primitive arg", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj = {};
        memo(obj);
        memo(obj);
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("evals once for each different primitive arg", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        memo(1);
        memo(1);
        memo(2);
        memo(2);
        expect(fn).toHaveBeenCalledTimes(2);
    });
    it("evals once for each different non-primitive arg", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj1 = {};
        const obj2 = {};
        memo(obj1);
        memo(obj1);
        memo(obj2);
        memo(obj2);
        expect(fn).toHaveBeenCalledTimes(2);
    });
    it("evals once for each different set of args (mixed primitive and non-primitive)", () => {
        const fn = jest.fn();
        const memo = memoize(fn);
        const obj1 = {};
        const obj2 = {};
        memo(1, obj1);
        memo(1, obj1);
        memo(1, obj2);
        memo(1, obj2);
        memo(2, obj1);
        memo(2, obj1);
        memo(2, obj2);
        memo(2, obj2);
        memo(obj1, 1);
        memo(obj1, 1);
        memo(obj2, 1);
        memo(obj2, 1);
        memo(obj1, 2);
        memo(obj1, 2);
        memo(obj2, 2);
        memo(obj2, 2);
        expect(fn).toHaveBeenCalledTimes(8);
    });
    describe("custom cache", () => {
        it("passes args", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const obj = {};
            const memo = memoize(fn, { cache: { get }});
            get.mockReturnValueOnce({});
            memo(1, obj);
            expect(get).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledWith([1, obj]);
        });
        it("throws if cache entry not an object", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const memo = memoize(fn, { cache: { get }});
            get.mockReturnValueOnce(1);
            expect(() => memo()).toThrow();
        });
        it("throws if cache entry result not an object", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const memo = memoize(fn, { cache: { get }});
            get.mockReturnValueOnce({ result: 1 });
            expect(() => memo()).toThrow();
        });
        it("throws if cache entry result has invalid status", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const memo = memoize(fn, { cache: { get }});
            get.mockReturnValueOnce({ result: { status: "foo" } });
            expect(() => memo()).toThrow();
        });
        it("returns value from fulfilled entry result", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const memo = memoize(fn, { cache: { get }});
            get.mockReturnValueOnce({ result: { status: "fulfilled", value: 1 } });
            expect(memo()).toBe(1);
        });
        it("throws reason from rejected entry result", () => {
            const fn = jest.fn();
            const get = jest.fn();
            const memo = memoize(fn, { cache: { get }});
            const err1 = new Error("A");
            get.mockReturnValueOnce({ result: { status: "rejected", reason: err1 } });
            expect(() => memo()).toThrow(err1);
        });
    });
});
describe("DefaultMemoizeCache", () => {
    describe("has", () => {
        it("true if cache has a result for the provided args", () => {
            const cache = new DefaultMemoizeCache();
            cache.get([1]).result = { status: "fulfilled", value: 1 };
            expect(cache.has([1])).toBe(true);
        });
        it("false if cache does not have an entry for the provided args", () => {
            const cache = new DefaultMemoizeCache();
            expect(cache.has([1])).toBe(false);
        });
        it("false if cache does not have a result for the provided args", () => {
            const cache = new DefaultMemoizeCache();
            cache.get([1]);
            expect(cache.has([1])).toBe(false);
        });
        it("false if cache does not have an entry for the provided args but has a result for the same leading args", () => {
            const cache = new DefaultMemoizeCache();
            cache.get([1, 2]).result = { status: "fulfilled", value: 1 };
            expect(cache.has([1])).toBe(false);
        });
    });
    describe("get", () => {
        it("same entry for the same args", () => {
            const cache = new DefaultMemoizeCache();
            const obj1 = {};
            const entry1 = cache.get([1, obj1]);
            expect(cache.get([1, obj1])).toBe(entry1);

            const entry2 = cache.get([obj1, 1]);
            expect(cache.get([obj1, 1])).toBe(entry2);
        });
    });
    describe("clear", () => {
        it("removes cached entries", () => {
            const cache = new DefaultMemoizeCache();
            const entry1 = cache.get([1]);
            cache.clear();
            expect(cache.get([1])).not.toBe(entry1);
        });
    });
});