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

import { Disposable } from "../disposable";
import { DisposableStack } from "../disposableStack";
import "../internal/testUtils";

describe("The DisposableStack constructor [non-spec]", () => {
    it("is a function", () => expect(DisposableStack).toBeTypeof("function"));
    it("[[Prototype]] is %Function.prototype%", () => expect(Object.getPrototypeOf(DisposableStack)).toBe(Function.prototype));
    it("length is 0", () => expect(DisposableStack.length).toBe(0));
    it("name is 'DisposableStack'", () => expect(DisposableStack.name).toBe("DisposableStack"));
    describe("DisposableStack()", () => {
        it("returns instance of DisposableStack", () => expect(new DisposableStack()).toBeInstanceOf(DisposableStack));
        it("throws on call", () => expect(() => DisposableStack.call(null)).toThrow(TypeError));
    });
});

describe("Properties of the DisposableStack prototype [non-spec]", () => {
    describe("DisposableStack.prototype.dispose()", () => {
        it("is an own method", () => expect(DisposableStack.prototype).toHaveOwnMethod("dispose"));
        it("is writable", () => expect(DisposableStack.prototype).toHaveWritableProperty("dispose"));
        it("is non-enumerable", () => expect(DisposableStack.prototype).toHaveNonEnumerableProperty("dispose"));
        it("is configurable", () => expect(DisposableStack.prototype).toHaveConfigurableProperty("dispose"));
        it("length is 0", () => expect(DisposableStack.prototype.dispose.length).toBe(0));
        it("name is 'dispose'", () => expect(DisposableStack.prototype.dispose.name).toBe("dispose"));
        it("disposes", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.use({ [Disposable.dispose]: fn });
            stack.dispose();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.use({ [Disposable.dispose]: fn });
            stack.dispose();
            stack.dispose();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", () => {
            const steps: string[] = [];
            const stack = new DisposableStack();
            stack.use({ [Disposable.dispose]() { steps.push("step 1"); } });
            stack.use({ [Disposable.dispose]() { steps.push("step 2"); } });
            stack.dispose();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("throws if wrong target", () => expect(() => DisposableStack.prototype.dispose.call({})).toThrow());
    });
    describe("DisposableStack.prototype.use()", () => {
        it("is an own method", () => expect(DisposableStack.prototype).toHaveOwnMethod("use"));
        it("is writable", () => expect(DisposableStack.prototype).toHaveWritableProperty("use"));
        it("is non-enumerable", () => expect(DisposableStack.prototype).toHaveNonEnumerableProperty("use"));
        it("is configurable", () => expect(DisposableStack.prototype).toHaveConfigurableProperty("use"));
        it("length is 1", () => expect(DisposableStack.prototype.use.length).toBe(1));
        it("name is 'use'", () => expect(DisposableStack.prototype.use.name).toBe("use"));
        it("returns resource", () => {
            const stack = new DisposableStack();
            const disposable = { [Disposable.dispose]() {} };
            const result = stack.use(disposable);
            expect(result).toBe(disposable);
        });
        it("disposes", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.use({ [Disposable.dispose]: fn });
            stack.dispose();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes in reverse order", () => {
            const steps: string[] = [];
            const stack = new DisposableStack();
            stack.use({ [Disposable.dispose]() { steps.push("step 1"); } });
            stack.use({ [Disposable.dispose]() { steps.push("step 2"); } });
            stack.dispose();
            expect(steps).toEqual(["step 2", "step 1"]);
        });
        it("treats non-disposable function as disposable", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.use(fn);
            stack.dispose();
            expect(fn).toHaveBeenCalled();
        });
        it("pass custom dispose for resource", () => {
            const fn = jest.fn();
            const resource = {};
            const stack = new DisposableStack();
            const result = stack.use(resource, fn);
            stack.dispose();
            expect(result).toBe(resource);
            expect(fn).toHaveBeenCalled();
        });
        it("custom dispose invoked even if resource is null/undefined", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.use(null, fn);
            stack.dispose();
            expect(fn).toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => DisposableStack.prototype.use.call({}, undefined!, undefined!)).toThrow());
        it("throws if called after disposed", () => {
            const stack = new DisposableStack();
            stack.dispose();
            expect(() => stack.use({ [Disposable.dispose]() {} })).toThrow(ReferenceError);
        });
    });
    describe("DisposableStack.prototype.move()", () => {
        it("is an own method", () => expect(DisposableStack.prototype).toHaveOwnMethod("move"));
        it("is writable", () => expect(DisposableStack.prototype).toHaveWritableProperty("move"));
        it("is non-enumerable", () => expect(DisposableStack.prototype).toHaveNonEnumerableProperty("move"));
        it("is configurable", () => expect(DisposableStack.prototype).toHaveConfigurableProperty("move"));
        it("length is 0", () => expect(DisposableStack.prototype.move.length).toBe(0));
        it("name is 'move'", () => expect(DisposableStack.prototype.move.name).toBe("move"));
        it("returns new DisposableStack", () => {
            const stack = new DisposableStack();
            const newStack = stack.move();
            expect(newStack).toBeInstanceOf(DisposableStack);
            expect(newStack).not.toBe(stack);
        });
        it("resources from initial stack not disposed after move", () => {
            const stack = new DisposableStack();
            const fn = stack.use(jest.fn());
            stack.move();
            stack.dispose();
            expect(fn).not.toHaveBeenCalled();
        });
        it("resources from initial stack disposed only after moved stack is disposed", () => {
            const stack = new DisposableStack();
            const fn = stack.use(jest.fn());
            const newStack = stack.move();
            newStack.dispose();
            expect(fn).toHaveBeenCalled();
        });
        it("throws if wrong target", () => expect(() => DisposableStack.prototype.move.call({})).toThrow());
        it("throws if called after disposed", () => {
            const stack = new DisposableStack();
            stack.dispose();
            expect(() => stack.move()).toThrow(ReferenceError);
        });
    });
    describe("DisposableStack.prototype[Disposable.dispose]()", () => {
        it("is an own method", () => expect(DisposableStack.prototype).toHaveOwnMethod(Disposable.dispose));
        it("is writable", () => expect(DisposableStack.prototype).toHaveWritableProperty(Disposable.dispose));
        it("is non-enumerable", () => expect(DisposableStack.prototype).toHaveNonEnumerableProperty(Disposable.dispose));
        it("is configurable", () => expect(DisposableStack.prototype).toHaveConfigurableProperty(Disposable.dispose));
        it("is alias for .dispose", () => expect(DisposableStack.prototype[Disposable.dispose]).toBe(DisposableStack.prototype.dispose));
    });
});
