/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { AsyncDisposable } from "../asyncDisposable";
import { AsyncDisposableStack } from "../asyncDisposableStack";
import "../internal/testUtils";

describe("The AsyncDisposableStack constructor [spec]", () => {
    it("is a function", () => expect(AsyncDisposableStack).toBeTypeof("function"));
    it("[[Prototype]] is %Function.prototype%", () => expect(Object.getPrototypeOf(AsyncDisposableStack)).toBe(Function.prototype));
    it("length is 0", () => expect(AsyncDisposableStack.length).toBe(0));
    it("name is 'AsyncDisposableStack'", () => expect(AsyncDisposableStack.name).toBe("AsyncDisposableStack"));
    describe("AsyncDisposableStack()", () => {
        it("returns instance of AsyncDisposableStack", () => expect(new AsyncDisposableStack()).toBeInstanceOf(AsyncDisposableStack));
        it("throws on call", () => expect(() => AsyncDisposableStack.call(null)).toThrow(TypeError));
    });
});

describe("Properties of the AsyncDisposableStack prototype [spec]", () => {
    describe("AsyncDisposableStack.prototype.use()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("use"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("use"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("use"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("use"));
        it("length is 1", () => expect(AsyncDisposableStack.prototype.use.length).toBe(1));
        it("name is 'use'", () => expect(AsyncDisposableStack.prototype.use.name).toBe("use"));
        it("returns resource", () => {
            const stack = new AsyncDisposableStack();
            const disposable = { async [AsyncDisposable.asyncDispose]() {} };
            const result = stack.use(disposable);
            expect(result).toBe(disposable);
        });
        it("disposes", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.use({ [AsyncDisposable.asyncDispose]: fn });
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 1"); } });
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 2"); } });
            await stack.disposeAsync();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("treats non-disposable function as disposable", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.use(fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("pass custom dispose for resource", async () => {
            const fn = jest.fn();
            const resource = {};
            const stack = new AsyncDisposableStack();
            const result = stack.use(resource, fn);
            await stack.disposeAsync();
            expect(result).toBe(resource);
            expect(fn).toHaveBeenCalled();
        });
        it("custom dispose invoked even if resource is null/undefined", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.use(null, fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => AsyncDisposableStack.prototype.use.call({}, undefined!, undefined!)).toThrow());
        it("throws if called after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack.disposeAsync();
            expect(() => stack.use({ async [AsyncDisposable.asyncDispose]() {} })).toThrow(ReferenceError);
        });
    });

    describe("AsyncDisposableStack.prototype.move()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("move"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("move"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("move"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("move"));
        it("length is 0", () => expect(AsyncDisposableStack.prototype.move.length).toBe(0));
        it("name is 'move'", () => expect(AsyncDisposableStack.prototype.move.name).toBe("move"));
        it("returns new AsyncDisposableStack", () => {
            const stack = new AsyncDisposableStack();
            const newStack = stack.move();
            expect(newStack).toBeInstanceOf(AsyncDisposableStack);
            expect(newStack).not.toBe(stack);
        });
        it("resources from initial stack not disposed after move", async () => {
            const stack = new AsyncDisposableStack();
            const fn = stack.use(jest.fn());
            stack.move();
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).not.toHaveBeenCalled();
        });
        it("resources from initial stack disposed after new stack from move is disposed", async () => {
            const stack = new AsyncDisposableStack();
            const fn = stack.use(jest.fn());
            const newStack = stack.move();
            await newStack[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => AsyncDisposableStack.prototype.move.call({})).toThrow());
        it("throws if called after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack.disposeAsync();
            expect(() => stack.move()).toThrow(ReferenceError);
        });
    });

    describe("AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose]()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod(AsyncDisposable.asyncDispose));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty(AsyncDisposable.asyncDispose));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty(AsyncDisposable.asyncDispose));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty(AsyncDisposable.asyncDispose));
        it("length is 0", () => expect(AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose].length).toBe(0));
        it("disposes", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.use({ [AsyncDisposable.asyncDispose]: fn });
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.use(fn);
            await stack[AsyncDisposable.asyncDispose]();
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 1"); } });
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 2"); } });
            await stack[AsyncDisposable.asyncDispose]();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("throws if wrong target", () => expect(AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose].call({})).rejects.toThrow());
    });

    describe("AsyncDisposableStack.prototype.disposeAsync", () => {
        it("is an own getter", () => expect(AsyncDisposableStack.prototype).toHaveOwnGetter("disposeAsync"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("disposeAsync"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("disposeAsync"));
        it("returns a bound method", async () => {
            const stack = new AsyncDisposableStack();
            const fn = stack.use(jest.fn());
            const disposeAsync = stack.disposeAsync;
            await disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("returns the same bound method", () => {
            const stack = new AsyncDisposableStack();
            const disposeAsync = stack.disposeAsync;
            expect(disposeAsync).toBe(stack.disposeAsync);
        });
        it("throws when accessed from the prototype", () => {
            expect(() => AsyncDisposableStack.prototype.disposeAsync).toThrowError();
        });
    });
});
