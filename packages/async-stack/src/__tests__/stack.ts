import { AsyncStack } from "..";

describe("ctor", () => {
    it("throws if not iterable", () => {
        expect(() => new AsyncStack(<any>{})).toThrow(TypeError);
    })
    it("from iterable", async () => {
        const stack = new AsyncStack([1, 2, 3]);
        const sizeAfterConstruct = stack.size;
        const value1 = await stack.pop();
        const value2 = await stack.pop();
        const value3 = await stack.pop();
        expect(value1).toBe(3);
        expect(value2).toBe(2);
        expect(value3).toBe(1);
        expect(sizeAfterConstruct).toBe(3);
        expect(stack.size).toBe(0);
    });
});
it("push1 pop1", async () => {
    const stack = new AsyncStack<number>();
    stack.push(1);
    const sizeAfterPush = stack.size;
    const value = await stack.pop();
    expect(value).toBe(1);
    expect(sizeAfterPush).toBe(1);
    expect(stack.size).toBe(0);
});
it("pop1 push1", async () => {
    const stack = new AsyncStack<number>();
    const popPromise = stack.pop();
    const sizeAfterPop = stack.size;
    await Promise.resolve();
    stack.push(1);
    const value = await popPromise;
    expect(value).toBe(1);
    expect(sizeAfterPop).toBe(-1);
    expect(stack.size).toBe(0);
});
it("push2 pop2", async () => {
    const stack = new AsyncStack<number>();
    stack.push(1);
    stack.push(2);
    const sizeAfterPush = stack.size;
    const value1 = await stack.pop();
    const value2 = await stack.pop();
    expect(value1).toBe(2);
    expect(value2).toBe(1);
    expect(sizeAfterPush).toBe(2);
    expect(stack.size).toBe(0);
});
it("pop2 push2", async () => {
    const stack = new AsyncStack<number>();
    const pop1 = stack.pop();
    const pop2 = stack.pop();
    const sizeAfterPop = stack.size;
    stack.push(1);
    stack.push(2);
    const value1 = await pop1;
    const value2 = await pop2;
    expect(value1).toBe(1);
    expect(value2).toBe(2);
    expect(sizeAfterPop).toBe(-2);
    expect(stack.size).toBe(0);
});