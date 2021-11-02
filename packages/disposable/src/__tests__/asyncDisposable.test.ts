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

describe("The AsyncDisposable constructor", () => {
    it("is a function [spec]", () => expect(AsyncDisposable).toBeTypeof("function"));
    it("[[Prototype]] is %Function.prototype% [spec]", () => expect(Object.getPrototypeOf(AsyncDisposable)).toBe(Function.prototype));
    it("length is 1 [spec]", () => expect(AsyncDisposable.length).toBe(1));
    it("name is 'AsyncDisposable' [spec]", () => expect(AsyncDisposable.name).toBe("AsyncDisposable"));
    describe("AsyncDisposable(onDispose)", () => {
        it("returns instance of AsyncDisposable [spec]", () => expect(new AsyncDisposable(() => {})).toBeInstanceOf(AsyncDisposable));
        it("Adds 'onDispose' as resource callback [spec]", async () => {
            const fn = jest.fn();
            const disposable = new AsyncDisposable(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("throws on call [spec]", () => expect(() => AsyncDisposable.call(null, () => {})).toThrow(TypeError));
    });
});

describe("Properties of the AsyncDisposable constructor", () => {
    it("AsyncDisposable.asyncDispose [non-spec]", () => expect(AsyncDisposable.asyncDispose).toBeTypeof("symbol"));
    describe("AsyncDisposable.from(iterable)", () => {
        it("is an own method [spec]", () => expect(AsyncDisposable).toHaveOwnMethod("from"));
        it("is writable [spec]", () => expect(AsyncDisposable).toHaveWritableProperty("from"));
        it("is non-enumerable [spec]", () => expect(AsyncDisposable).toHaveNonEnumerableProperty("from"));
        it("is configurable [spec]", () => expect(AsyncDisposable).toHaveConfigurableProperty("from"));
        it("returns instance of Dispose [spec]", () => expect(AsyncDisposable.from([])).resolves.toBeInstanceOf(AsyncDisposable));
        it("disposes elements [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes elements only once [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);
            await disposable[AsyncDisposable.asyncDispose]();
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });
        it("disposes elements in reverse order [spec]", async () => {
            const steps: string[] = [];
            const disposable1 = new AsyncDisposable(() => { steps.push("disposable1"); });
            const disposable2 = new AsyncDisposable(() => { steps.push("disposable2"); });
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(steps).toEqual(["disposable2", "disposable1"]);
        });
        it("allows null and undefined [spec]", async () => {
            await expect(AsyncDisposable.from([null, undefined])).resolves.toBeDefined();
        });
        it("does not allow non-object [spec]", async () => {
            await expect(() => AsyncDisposable.from(["" as unknown as AsyncDisposable])).rejects.toThrow();
        });
        it("does not allow object without [AsyncDisposable.asyncDispose] [spec]", async () => {
            await expect(() => AsyncDisposable.from([{} as unknown as AsyncDisposable])).rejects.toThrow();
        });
        it("disposes all elements even if previous element throws during dispose [spec]", async () => {
            const disposable1 = new AsyncDisposable(() => { throw new Error(); });
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);
            await expect(() => disposable[AsyncDisposable.asyncDispose]()).rejects.toThrow();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes all elements even if later element throws during dispose [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const disposable2 = new AsyncDisposable(() => { throw new Error(); });
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);
            await expect(() => disposable[AsyncDisposable.asyncDispose]()).rejects.toThrow();
            expect(fn1).toHaveBeenCalled();
        });
        it("disposes all elements even if previous element not disposable [spec]", async () => {
            const disposable1 = {} as AsyncDisposable;
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            await expect(() => AsyncDisposable.from([disposable1, disposable2])).rejects.toThrow();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes all elements even if next element not disposable [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            await expect(() => AsyncDisposable.from([disposable1, {} as AsyncDisposable])).rejects.toThrow();
            expect(fn1).toHaveBeenCalled();
        });
        it("disposes only leading elements if iteration fails during IteratorNext [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: disposable1, done: false };
                        case 1: throw new Error();
                        case 2: return { value: disposable2, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() {
                    return this;
                }
            };
            await expect(() => AsyncDisposable.from(iter)).rejects.toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("disposes only leading elements if iteration fails during IteratorComplete [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: disposable1, done: false };
                        case 1: return { value: undefined!, get done(): boolean { throw new Error(); } };
                        case 2: return { value: disposable2, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() {
                    return this;
                }
            };
            await expect(() => AsyncDisposable.from(iter)).rejects.toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("disposes only leading elements if iteration fails during IteratorValue [spec]", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: disposable1, done: false };
                        case 1: return { get value(): AsyncDisposable { throw new Error(); }, done: false };
                        case 2: return { value: disposable2, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() {
                    return this;
                }
            };
            await expect(() => AsyncDisposable.from(iter)).rejects.toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("single error from invalid disposable wrapped in AggregateError [spec]", async () => {
            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from([{} as AsyncDisposable]);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeUndefined();
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("multiple errors from invalid disposable wrapped in AggregateError [spec]", async () => {
            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from([{} as AsyncDisposable, {} as AsyncDisposable]);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeUndefined();
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(2);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[1]).toBeInstanceOf(TypeError);
        });
        it("single error from dispose wrapped in AggregateError [spec]", async () => {
            const e1 = new Error();
            const disposable1 = new AsyncDisposable(() => { throw e1; });
            const disposable = await AsyncDisposable.from([disposable1]);

            let throwCompletion!: { cause: unknown };
            try {
                await disposable[AsyncDisposable.asyncDispose]();
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBeUndefined();
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBe(e1);
        });
        it("multiple errors from dispose wrapped in AggregateError [spec]", async () => {
            const e1 = new Error();
            const disposable1 = new AsyncDisposable(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = new AsyncDisposable(() => { throw e2; });
            const disposable = await AsyncDisposable.from([disposable1, disposable2]);

            let throwCompletion!: { cause: unknown };
            try {
                await disposable[AsyncDisposable.asyncDispose]();
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
        it("error from iteration during IteratorNext not wrapped if no errors during dispose [spec]", async () => {
            const e = new Error();
            const iter: IterableIterator<AsyncDisposable> = {
                next() { throw e; },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorComplete not wrapped if no errors during dispose [spec]", async () => {
            const e = new Error();
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    return { value: undefined!, get done(): boolean { throw e; } };
                },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorValue not wrapped if no errors during dispose [spec]", async () => {
            const e = new Error();
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    return { get value(): AsyncDisposable { throw e; }, done: false };
                },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorNext wrapped if errors during dispose [spec]", async () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as AsyncDisposable, done: false };
                        case 1: throw eCause;
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("error from iteration during IteratorComplete wrapped if errors during dispose [spec]", async () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as AsyncDisposable, done: false };
                        case 1: return { value: undefined!, get done(): boolean { throw eCause; } };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("error from iteration during IteratorValue wrapped if errors during dispose [spec]", async () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<AsyncDisposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as AsyncDisposable, done: false };
                        case 1: return { get value(): AsyncDisposable { throw eCause; }, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };

            let throwCompletion!: { cause: unknown };
            try {
                await AsyncDisposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("treat non-disposable function as disposable [non-spec]", async () => {
            const fn = jest.fn();
            const disposable = await AsyncDisposable.from([fn]);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
    });
    describe("AsyncDisposable.scope() [non-spec]", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("scope"));
        it("disposes single resource", async () => {
            const fn = jest.fn();
            const disposable = new AsyncDisposable(fn);
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(disposable);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes multiple resources", async () => {
            const fn1 = jest.fn();
            const disposable1 = new AsyncDisposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new AsyncDisposable(fn2);
            for await (const { using, fail } of AsyncDisposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes resources in reverse order", async () => {
            const steps: string[] = [];
            const disposable1 = new AsyncDisposable(() => { steps.push("disposable1"); });
            const disposable2 = new AsyncDisposable(() => { steps.push("disposable2"); });

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
                using(fn);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("error from invalid disposable not wrapped if no errors during dispose", async () => {
            const disposable1 = new AsyncDisposable(() => { });

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
            const disposable1 = new AsyncDisposable(() => { throw e1; });

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
            const disposable1 = new AsyncDisposable(() => { });

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
            const disposable1 = new AsyncDisposable(() => { throw e; });

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
            const disposable1 = new AsyncDisposable(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = new AsyncDisposable(() => { throw e2; });

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
    describe("AsyncDisposable.usingEach(iterable) [non-spec]", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("usingEach"));
        it("disposes each", async () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            for await (const _ of AsyncDisposable.usingEach([fn1, fn2]));
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("does not dispose later if earlier throws", async () => {
            const fn1 = () => { throw new Error(); };
            const fn2 = jest.fn();
            await expect(async () => {
                for await (const _ of AsyncDisposable.usingEach([fn1, fn2]));
            }).rejects.toThrow();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("is not eager", async () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            function* g() {
                yield fn1;
                yield fn2;
            }
            for await (const _ of AsyncDisposable.usingEach(g())) {
                break;
            }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        })
    });
    describe("AsyncDisposable.use(resource, callback) [non-spec]", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("use"));
        it("disposes", async () => {
            const fn = jest.fn();
            await AsyncDisposable.use(fn, () => {});
            expect(fn).toHaveBeenCalled();
        });
        it("returns result", async () => {
            const sentinel = {};
            const fn = jest.fn<void, []>();
            const result = await AsyncDisposable.use(fn, () => sentinel);
            expect(result).toBe(sentinel);
        });
        it("passes resource", async () => {
            const fn = jest.fn<void, []>();
            const cb = jest.fn();
            await AsyncDisposable.use(fn, cb);
            expect(cb).toHaveBeenCalledWith(fn);
        });
    });
    describe("AsyncDisposable.hasInstance(value) [non-spec]", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod("hasInstance"));
        it("returns true if value is disposable", () => expect(AsyncDisposable.hasInstance({ [AsyncDisposable.asyncDispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(AsyncDisposable.hasInstance({ })).toBe(false));
    });
    describe("AsyncDisposable[Symbol.hasInstance](value) [non-spec]", () => {
        it("is an own method", () => expect(AsyncDisposable).toHaveOwnMethod(Symbol.hasInstance));
        it("returns true if value is disposable", () => expect(AsyncDisposable[Symbol.hasInstance]({ [AsyncDisposable.asyncDispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(AsyncDisposable[Symbol.hasInstance]({ })).toBe(false));
    });
});

describe("Properties of the AsyncDisposable.prototype object", () => {
    it("is an object [spec]", () => expect(AsyncDisposable.prototype).toBeTypeof("object"));
    describe("AsyncDisposable.prototype[AsyncDisposable.asyncDispose]()", () => {
        it("is an own method [spec]", () => expect(AsyncDisposable.prototype).toHaveOwnMethod(AsyncDisposable.asyncDispose));
        it("is writable [spec]", () => expect(AsyncDisposable.prototype).toHaveWritableProperty(AsyncDisposable.asyncDispose));
        it("is non-enumerable [spec]", () => expect(AsyncDisposable.prototype).toHaveNonEnumerableProperty(AsyncDisposable.asyncDispose));
        it("is configurable [spec]", () => expect(AsyncDisposable.prototype).toHaveConfigurableProperty(AsyncDisposable.asyncDispose));
        it("disposes resource stack [spec]", async () => {
            const fn = jest.fn();
            const disposable = new AsyncDisposable(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes resource only once [spec]", async () => {
            const fn = jest.fn();
            const disposable = new AsyncDisposable(fn);
            await disposable[AsyncDisposable.asyncDispose]();
            await disposable[AsyncDisposable.asyncDispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("throws on non instance [spec]", () => expect(AsyncDisposable.prototype[AsyncDisposable.asyncDispose].call({})).rejects.toThrow());
    });
    describe("AsyncDisposable.prototype[Symbol.toStringTag]", () => {
        it("is an own property [spec]", () => expect(AsyncDisposable.prototype).toHaveOwnProperty(Symbol.toStringTag));
        it("is non-writable [spec]", () => expect(AsyncDisposable.prototype).toHaveNonWritableProperty(Symbol.toStringTag));
        it("is non-enumerable [spec]", () => expect(AsyncDisposable.prototype).toHaveNonEnumerableProperty(Symbol.toStringTag));
        it("is configurable [spec]", () => expect(AsyncDisposable.prototype).toHaveConfigurableProperty(Symbol.toStringTag));
        it("is 'AsyncDisposable' [spec]", () => expect((AsyncDisposable.prototype as any)[Symbol.toStringTag]).toBe("AsyncDisposable"));
    });
});

describe("Properties of AsyncDisposable instances", () => {
    it("Inherits from %AsyncDisposable.prototype%", () => expect(Object.getPrototypeOf(new AsyncDisposable(() => {}))).toBe(AsyncDisposable.prototype));
});
