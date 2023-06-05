import { jest } from "@jest/globals";
import { IntegerIndexedObject } from "..";

describe("indexedObject", () => {
    class TestableIntegerIndexedObject extends IntegerIndexedObject<any> {
        getLength(): number { throw new Error("Not implemented"); }
        getIndex(index: number) { throw new Error("Not implemented"); }
    }
    it("keys", () => {
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 2; }
        };
        const keys = Reflect.ownKeys(obj);
        expect(keys).toEqual(["0", "1"]);
    })
    it("getLength", () => {
        const fn = jest.fn<() => number>().mockReturnValue(1);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return fn(); }
        };

        const x = 0 in obj;
        expect(x).toBe(true);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith();
    });
    it("hasIndex", () => {
        const fn = jest.fn<(x: number) => boolean>().mockReturnValue(true);
        const obj = new class extends TestableIntegerIndexedObject {
            hasIndex(index: number) { return fn(index); }
        };

        const x = 0 in obj;
        expect(x).toBe(true);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith(0);
    });
    it("getIndex", () => {
        const expected = {};
        const fn = jest.fn().mockReturnValue(expected);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 1; }
            getIndex(index: number) { return fn(index); }
        };

        const x = obj[0];
        expect(x).toBe(expected);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith(0);
    });
    it("setIndex", () => {
        const expected = {};
        const fn = jest.fn<(x: number, v: any) => boolean>().mockReturnValue(true);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 1; }
            setIndex(index: number, value: any) { return fn(index, value); }
        };

        obj[0] = expected;
        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith(0, expected);
    });
    it("deleteIndex", () => {
        const fn = jest.fn<(i: number) => boolean>().mockReturnValue(true);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 1; }
            deleteIndex(index: number) { return fn(index); }
        };

        delete obj[0];
        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith(0);
    });
    it("defineProperty", () => {
        const sentinel = {};
        const fn = jest.fn<() => boolean>().mockReturnValue(true);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 1; }
            setIndex(index: number, value: any): boolean { return fn(); }
        };
        const a = Reflect.defineProperty(obj, 0, { enumerable: true, configurable: false, writable: true, value: sentinel });
        expect(fn).toBeCalledTimes(0);
        expect(a).toBe(false);

        const b = Reflect.defineProperty(obj, 0, { enumerable: true, configurable: true, writable: true, value: sentinel });
        expect(fn).toBeCalledTimes(1);
        expect(b).toBe(true);
    });
    it("getOwnPropertyDescriptor", () => {
        const value = "foo";
        const fn = jest.fn().mockReturnValue(value);
        const obj = new class extends TestableIntegerIndexedObject {
            getLength() { return 1; }
            getIndex(index: number) { return fn(index); }
        };

        const desc1 = Reflect.getOwnPropertyDescriptor(obj, 0);
        const desc2 = Reflect.getOwnPropertyDescriptor(obj, "0");
        const desc3 = Reflect.getOwnPropertyDescriptor(obj, -1);
        const desc4 = Reflect.getOwnPropertyDescriptor(obj, 1);
        expect(fn).toBeCalledTimes(2);
        expect(desc1).toEqual({ enumerable: true, configurable: true, writable: true, value });
        expect(desc2).toEqual({ enumerable: true, configurable: true, writable: true, value });
        expect(desc3).toBeUndefined();
        expect(desc4).toBeUndefined();
    });
});