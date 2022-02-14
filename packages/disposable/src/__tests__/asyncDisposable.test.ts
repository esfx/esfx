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

import { AsyncDisposable, AsyncDisposableScope } from "../asyncDisposable";
import "../internal/testUtils";

describe("The AsyncDisposable constructor [non-spec]", () => {
    describe("AsyncDisposable(onDispose)", () => {
        it("returns instance of AsyncDisposable", () => expect(new AsyncDisposable(() => {})).toBeInstanceOf(AsyncDisposable));
        it("Adds 'onDispose' as resource callback", async () => {
            const fn = jest.fn();
            const disposable = new AsyncDisposable(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("throws on call", () => expect(() => AsyncDisposable.call(null, () => {})).toThrow(TypeError));
    });
});

describe("Properties of the AsyncDisposable constructor [non-spec]", () => {
    it("AsyncDisposable.asyncDispose", () => expect(AsyncDisposable.asyncDispose).toBeTypeof("symbol"));
    describe("AsyncDisposable.scope()", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("scope"));
        it("disposes single resource", async () => {
            const fn = jest.fn();
            const disposable = AsyncDisposable.create(fn);
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(disposable);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes multiple resources", async () => {
            const fn1 = jest.fn();
            const disposable1 = AsyncDisposable.create(fn1);
            const fn2 = jest.fn();
            const disposable2 = AsyncDisposable.create(fn2);
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes resources in reverse order", async () => {
            const steps: string[] = [];
            const disposable1 = AsyncDisposable.create(() => { steps.push("disposable1"); });
            const disposable2 = AsyncDisposable.create(() => { steps.push("disposable2"); });

            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }

            expect(steps).toEqual(["disposable2", "disposable1"]);
        });
        it("allows null or undefined", async () => {
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(null);
                using(undefined);
            } catch (e) { fail(e); }
        });
        it("treat non-disposable function as disposable", async () => {
            const fn = jest.fn();
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(AsyncDisposable.create(fn));
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("error from invalid disposable not wrapped if no errors during dispose", async () => {
            const disposable1 = AsyncDisposable.create(() => { });

            let throwCompletion!: { cause: unknown };
            try {
                for await (const { using, fail } of AsyncDisposable.scope()) try {
                    using(disposable1);
                    using({} as AsyncDisposable);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(TypeError);
        });
        it("error from invalid disposable wrapped if errors during dispose", async () => {
            const e1 = new Error();
            const disposable1 = AsyncDisposable.create(() => { throw e1; });

            let throwCompletion!: { cause: unknown };
            try {
                for await (const { using, fail } of AsyncDisposable.scope()) try {
                    using(disposable1);
                    using({} as AsyncDisposable);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeInstanceOf(TypeError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBe(e1);
        });
        it("error from body not wrapped if no errors during dispose", async () => {
            const e = new Error();
            const disposable1 = AsyncDisposable.create(() => { });

            let throwCompletion!: { cause: unknown };
            try {
                for await (const { using, fail } of AsyncDisposable.scope()) try {
                    using(disposable1);
                    throw e;
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("single error from dispose wrapped in AggregateError", async () => {
            const e = new Error();
            const disposable1 = AsyncDisposable.create(() => { throw e; });

            let throwCompletion!: { cause: unknown };
            try {
                for await (const { using, fail } of AsyncDisposable.scope()) try {
                    using(disposable1);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeUndefined();
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBe(e);
        });
        it("multiple errors from dispose wrapped in AggregateError", async () => {
            const e1 = new Error();
            const disposable1 = AsyncDisposable.create(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = AsyncDisposable.create(() => { throw e2; });

            let throwCompletion!: { cause: unknown };
            try {
                for await (const { using, fail } of AsyncDisposable.scope()) try {
                    using(disposable1);
                    using(disposable2);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeUndefined();
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(2);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBe(e2);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[1]).toBe(e1);
        });
        it("throws if scope.using is called late", async () => {
            let scope!: AsyncDisposableScope;
            for await (scope of AsyncDisposable.scope());
            expect(() => scope.using(null)).toThrow();
        });
        it("throws if scope.fail is called late", async () => {
            let scope!: AsyncDisposableScope;
            for await (scope of AsyncDisposable.scope());
            expect(() => scope.fail(null)).toThrow();
        });
    });
    describe("AsyncDisposable.usingEach(iterable)", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("usingEach"));
        it("disposes each", async () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            for await (const _ of AsyncDisposable.usingEach([AsyncDisposable.create(fn1), AsyncDisposable.create(fn2)]));
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("does not dispose later if earlier throws", async () => {
            const fn1 = () => { throw new Error(); };
            const fn2 = jest.fn();
            await expect(async () => {
                for await (const _ of AsyncDisposable.usingEach([AsyncDisposable.create(fn1), AsyncDisposable.create(fn2)]));
            }).rejects.toThrow();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("is not eager", async () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            function* g() {
                yield AsyncDisposable.create(fn1);
                yield AsyncDisposable.create(fn2);
            }
            for await (const _ of AsyncDisposable.usingEach(g())) {
                break;
            }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        })
    });
    describe("AsyncDisposable.create(dispose)", () => {
        it("disposes resource stack [spec]", async () => {
            const fn = jest.fn();
            const disposable = AsyncDisposable.create(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes resource only once [spec]", async () => {
            const fn = jest.fn();
            const disposable = AsyncDisposable.create(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
    describe("AsyncDisposable.hasInstance(value)", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("hasInstance"));
        it("returns true if value is disposable", () => expect(AsyncDisposable.hasInstance({ [AsyncDisposable.asyncDispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(AsyncDisposable.hasInstance({ })).toBe(false));
    });
    describe("AsyncDisposable[Symbol.hasInstance](value)", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod(Symbol.hasInstance));
        it("returns true if value is disposable", () => expect(AsyncDisposable[Symbol.hasInstance]({ [AsyncDisposable.asyncDispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(AsyncDisposable[Symbol.hasInstance]({ })).toBe(false));
    });
});

describe("Properties of AsyncDisposable instances [non-spec]", () => {
    it("Inherits from %AsyncDisposable.prototype%", () => expect(Object.getPrototypeOf(AsyncDisposable.create(() => {}))).toBe(AsyncDisposable.prototype));
});
