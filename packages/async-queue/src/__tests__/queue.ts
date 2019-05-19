import { AsyncQueue } from "..";
import { CancelError } from '@esfx/cancelable';

describe("ctor", () => {
    it("throws if not iterable", () => {
        expect(() => new AsyncQueue(<any>{})).toThrow(TypeError);
    })
    it("from iterable", async () => {
        const queue = new AsyncQueue([1, 2, 3]);
        const sizeAfterConstruct = queue.size;
        const value1 = await queue.get();
        const value2 = await queue.get();
        const value3 = await queue.get();
        expect(value1).toBe(1);
        expect(value2).toBe(2);
        expect(value3).toBe(3);
        expect(sizeAfterConstruct).toBe(3);
        expect(queue.size).toBe(0);
    });
});
it("put1 get1", async () => {
    const queue = new AsyncQueue<number>();
    queue.put(1);
    const sizeAfterPut = queue.size;
    const value = await queue.get();
    expect(value).toBe(1);
    expect(sizeAfterPut).toBe(1);
    expect(queue.size).toBe(0);
});
it("get1 put1", async () => {
    const queue = new AsyncQueue<number>();
    const getPromise = queue.get();
    const sizeAfterGet = queue.size;
    await Promise.resolve();
    queue.put(1);
    const value = await getPromise;
    expect(value).toBe(1);
    expect(sizeAfterGet).toBe(-1);
    expect(queue.size).toBe(0);
});
it("put2 get2", async () => {
    const queue = new AsyncQueue<number>();
    queue.put(1);
    queue.put(2);
    const sizeAfterPut = queue.size;
    const value1 = await queue.get();
    const value2 = await queue.get();
    expect(value1).toBe(1);
    expect(value2).toBe(2);
    expect(sizeAfterPut).toBe(2);
    expect(queue.size).toBe(0);
});
describe("end", () => {
    it("throws if put past end", () => {
        const queue = new AsyncQueue<number>();
        queue.end();
        expect(() => queue.put(1)).toThrow();
    });
    it("get past end when not empty", async () => {
        const queue = new AsyncQueue<number>();
        queue.put(1);
        queue.end();
        expect(await queue.get()).toBe(1);
    });
    it("get before end when not empty", async () => {
        const queue = new AsyncQueue<number>();
        const p = queue.get();
        queue.put(1);
        queue.end();
        expect(await p).toBe(1);
    });
    it("get past end when empty throws", async () => {
        const queue = new AsyncQueue<number>();
        queue.end();
        await expect(queue.get()).rejects.toThrow();
    });
    it("get before end when empty throws", async () => {
        const queue = new AsyncQueue<number>();
        const p = queue.get();
        queue.end();
        await expect(p).rejects.toThrow(CancelError);
    });
});