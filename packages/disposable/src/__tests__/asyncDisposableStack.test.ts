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

describe("The AsyncDisposableStack constructor [non-spec]", () => {
    it("is a function", () => expect(AsyncDisposableStack).toBeTypeof("function"));
    it("[[Prototype]] is %Function.prototype%", () => expect(Object.getPrototypeOf(AsyncDisposableStack)).toBe(Function.prototype));
    it("length is 0", () => expect(AsyncDisposableStack.length).toBe(0));
    it("name is 'AsyncDisposableStack'", () => expect(AsyncDisposableStack.name).toBe("AsyncDisposableStack"));
    describe("AsyncDisposableStack()", () => {
        it("returns instance of AsyncDisposableStack", () => expect(new AsyncDisposableStack()).toBeInstanceOf(AsyncDisposableStack));
        it("throws on call", () => expect(() => AsyncDisposableStack.call(null)).toThrow(TypeError));
    });
});

describe("Properties of the AsyncDisposableStack prototype [non-spec]", () => {
    describe("AsyncDisposableStack.prototype.disposeAsync()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("disposeAsync"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("disposeAsync"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("disposeAsync"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("disposeAsync"));
        it("length is 0", () => expect(AsyncDisposableStack.prototype.disposeAsync.length).toBe(0));
        it("name is 'disposeAsync'", () => expect(AsyncDisposableStack.prototype.disposeAsync.name).toBe("disposeAsync"));
        it("disposes", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(new AsyncDisposable(fn));
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(fn);
            await stack.disposeAsync();
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.enter(new AsyncDisposable(() => { steps.push("step 1"); }));
            stack.enter(new AsyncDisposable(() => { steps.push("step 2"); }));
            await stack.disposeAsync();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("throws if wrong target", () => expect(AsyncDisposableStack.prototype.disposeAsync.call({})).rejects.toThrow());
    });

    describe("AsyncDisposableStack.prototype.enter()", () => {
        it("is an own method", () => expect(AsyncDisposableStack.prototype).toHaveOwnMethod("enter"));
        it("is writable", () => expect(AsyncDisposableStack.prototype).toHaveWritableProperty("enter"));
        it("is non-enumerable", () => expect(AsyncDisposableStack.prototype).toHaveNonEnumerableProperty("enter"));
        it("is configurable", () => expect(AsyncDisposableStack.prototype).toHaveConfigurableProperty("enter"));
        it("length is 1", () => expect(AsyncDisposableStack.prototype.enter.length).toBe(1));
        it("name is 'enter'", () => expect(AsyncDisposableStack.prototype.enter.name).toBe("enter"));
        it("returns resource", () => {
            const stack = new AsyncDisposableStack();
            const disposable = new AsyncDisposable(() => {});
            const result = stack.enter(disposable);
            expect(result).toBe(disposable);
        });
        it("disposes", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(new AsyncDisposable(fn));
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            const stack = new AsyncDisposableStack();
            stack.enter(new AsyncDisposable(() => { steps.push("step 1"); }));
            stack.enter(new AsyncDisposable(() => { steps.push("step 2"); }));
            await stack.disposeAsync();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("treats non-disposable function as disposable", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(fn);
            await stack.disposeAsync();
            expect(fn).toHaveBeenCalled();
        });
        it("pass custom dispose for resource", async () => {
            const fn = jest.fn();
            const resource = {};
            const stack = new AsyncDisposableStack();
            const result = stack.enter(resource, fn);
            await stack.disposeAsync();
            expect(result).toBe(resource);
            expect(fn).toHaveBeenCalled();
        });
        it("custom dispose not invoked if resource is null/undefined", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(null, fn);
            await stack.disposeAsync();
            expect(fn).not.toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => AsyncDisposableStack.prototype.enter.call({}, undefined!, undefined!)).toThrow());
        it("throws if called after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack.disposeAsync();
            expect(() => stack.enter(new AsyncDisposable(() => {}))).toThrow(ReferenceError);
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
            const fn = stack.enter(jest.fn());
            stack.move();
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).not.toHaveBeenCalled();
        });
        it("resources from initial stack disposed after new stack from move is disposed", async () => {
            const stack = new AsyncDisposableStack();
            const fn = stack.enter(jest.fn());
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
        it("is alias for .disposeAsync", () => expect(AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose]).toBe(AsyncDisposableStack.prototype.disposeAsync));
    });
});