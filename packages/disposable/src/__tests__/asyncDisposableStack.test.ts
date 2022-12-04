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

import { jest } from "@jest/globals";
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
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
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
        it("(deprecated) treats non-disposable function as disposable", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
            const stack = new AsyncDisposableStack();
            stack.use(fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("(deprecated) pass custom dispose for resource", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
            const resource = {};
            const stack = new AsyncDisposableStack();
            const result = stack.use(resource, fn);
            await stack.disposeAsync();
            expect(result).toBe(resource);
            expect(fn).toHaveBeenCalled();
        });
        it("(deprecated) custom dispose invoked even if resource is null/undefined", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
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

    describe("AsyncDisposableStack.prototype.adopt()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("adopt"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("adopt"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("adopt"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("adopt"));
        it("length is 2", () => expect(AsyncDisposableStack.prototype.adopt.length).toBe(2));
        it("name is 'adopt'", () => expect(AsyncDisposableStack.prototype.adopt.name).toBe("adopt"));
        it("returns resource", () => {
            const stack = new AsyncDisposableStack();
            const resource = {};
            const result = stack.adopt(resource, () => {});
            expect(result).toBe(resource);
        });
        it("disposes", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
            const stack = new AsyncDisposableStack();
            stack.adopt({}, fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.adopt("step 1", res => { steps.push(res); });
            stack.adopt("step 2", res => { steps.push(res); });
            await stack.disposeAsync();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("custom dispose invoked even if resource is null/undefined", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
            const stack = new AsyncDisposableStack();
            stack.adopt(null, fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => AsyncDisposableStack.prototype.adopt.call({}, undefined!, undefined!)).toThrow());
        it("throws if called after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack.disposeAsync();
            expect(() => stack.adopt({}, () => {})).toThrow(ReferenceError);
        });
    });

    describe("AsyncDisposableStack.prototype.defer()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("defer"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("defer"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("defer"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("defer"));
        it("length is 1", () => expect(AsyncDisposableStack.prototype.defer.length).toBe(1));
        it("name is 'defer'", () => expect(AsyncDisposableStack.prototype.defer.name).toBe("defer"));
        it("disposes", async () => {
            const fn = jest.fn<() => Promise<void>>().mockResolvedValue();
            const stack = new AsyncDisposableStack();
            stack.defer(fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes serially in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            let resolve!: () => void;
            const waiter = new Promise<void>(r => resolve = r);
            stack.defer(() => { steps.push("step 1"); });
            stack.defer(async () => { await waiter; steps.push("step 2"); });
            const promise = stack.disposeAsync();
            resolve();
            await promise;
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("throws if wrong target", () => expect(() => AsyncDisposableStack.prototype.defer.call({}, undefined!)).toThrow());
        it("throws if called after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack.disposeAsync();
            expect(() => stack.defer(() => {})).toThrow(ReferenceError);
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
            const fn = jest.fn<() => void>()
            stack.defer(fn);
            stack.move();
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).not.toHaveBeenCalled();
        });
        it("initial stack disposed after move", () => {
            const stack = new AsyncDisposableStack();
            stack.move();
            expect(stack.disposed).toBe(true);
        });
        it("resources from initial stack disposed after new stack from move is disposed", async () => {
            const stack = new AsyncDisposableStack();
            const fn = stack.use(jest.fn<() => void>());
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

    describe("AsyncDisposableStack.prototype.disposeAsync", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("disposeAsync"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("disposeAsync"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("disposeAsync"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("disposeAsync"));
        it("length is 0", () => expect(AsyncDisposableStack.prototype.disposeAsync.length).toBe(0));
        it("name is 'disposeAsync'", () => expect(AsyncDisposableStack.prototype.disposeAsync.name).toBe("disposeAsync"));
        it("disposes", async () => {
            const fn = jest.fn<() => Promise<void>>();
            const stack = new AsyncDisposableStack();
            stack.use({ [AsyncDisposable.asyncDispose]: fn });
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", async () => {
            const fn = jest.fn<() => Promise<void>>();
            const stack = new AsyncDisposableStack();
            stack.defer(fn);
            await stack.disposeAsync();
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 1"); } });
            stack.use({ async [AsyncDisposable.asyncDispose]() { steps.push("step 2"); } });
            await stack.disposeAsync();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("throws if wrong target", () => expect(AsyncDisposableStack.prototype.disposeAsync.call({})).rejects.toThrow());
    });

    describe("AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose]()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod(AsyncDisposable.asyncDispose));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty(AsyncDisposable.asyncDispose));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty(AsyncDisposable.asyncDispose));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty(AsyncDisposable.asyncDispose));
        it("is alias for 'disposeAsync'", () => expect(AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose]).toBe(AsyncDisposableStack.prototype.disposeAsync));
    });
});
