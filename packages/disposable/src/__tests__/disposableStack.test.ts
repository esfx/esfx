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

describe("Properties of the DisposableStack prototype [non-spec]", () => {
    describe("DisposableStack.prototype[Disposable.dispose]()", () => {
        it("disposes", () => {
            const fn = jest.fn();
            for (const { using, fail } of Disposable.scope()) try {
                const stack = using(new DisposableStack());
                stack.enter(fn);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", () => {
            const fn = jest.fn();
            const stack = new DisposableStack();
            stack.enter(fn);
            stack[Disposable.dispose]();
            stack[Disposable.dispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", () => {
            const steps: string[] = [];
            for (const { using, fail } of Disposable.scope()) try {
                const stack = using(new DisposableStack());
                stack.enter(() => steps.push("step 1"));
                stack.enter(() => steps.push("step 2"));
            } catch (e) { fail(e); }
            expect(steps).toEqual(["step 2", "step 1"]);
        });
    });
    describe("DisposableStack.prototype.enter()", () => {
        it("throws if enter after disposed", () => {
            const stack = new DisposableStack();
            stack[Disposable.dispose]();
            expect(() => stack.enter(() => {})).toThrow(ReferenceError);
        });
    });
    describe("DisposableStack.prototype.move()", () => {
        it("resources from initial stack not disposed after move", () => {
            const stack = new DisposableStack();
            const fn = stack.enter(jest.fn());
            stack.move();
            stack[Disposable.dispose]();
            expect(fn).not.toHaveBeenCalled();
        });
        it("resources from initial stack disposed after new stack from move is disposed", () => {
            const stack = new DisposableStack();
            const fn = stack.enter(jest.fn());
            const newStack = stack.move();
            newStack[Disposable.dispose]();
            expect(fn).toHaveBeenCalled();
        });
    });
});
