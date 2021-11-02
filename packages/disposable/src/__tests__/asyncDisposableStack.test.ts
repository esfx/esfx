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

describe("Properties of the AsyncDisposableStack prototype [non-spec]", () => {
    describe("AsyncDisposableStack.prototype[AsyncDisposable.asyncDispose]()", () => {
        it("disposes", async () => {
            const fn = jest.fn();
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                const stack = using(new AsyncDisposableStack());
                stack.enter(fn);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes once", async () => {
            const fn = jest.fn();
            const stack = new AsyncDisposableStack();
            stack.enter(fn);
            await stack[AsyncDisposable.asyncDispose]();
            await stack[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("disposes in reverse order", async () => {
            const steps: string[] = [];
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                const stack = using(new AsyncDisposableStack());
                stack.enter(() => { steps.push("step 1"); });
                stack.enter(() => { steps.push("step 2"); });
            } catch (e) { fail(e); }
            expect(steps).toEqual(["step 2", "step 1"]);
        });
    });

    describe("DisposableStack.prototype.enter()", () => {
        it("throws if enter after disposed", async () => {
            const stack = new AsyncDisposableStack();
            await stack[AsyncDisposable.asyncDispose]();
            expect(() => stack.enter(() => {})).toThrow(ReferenceError);
        });
    });

    describe("AsyncDisposableStack.prototype.move()", () => {
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
    });
});