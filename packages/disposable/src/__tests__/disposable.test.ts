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

import { Disposable, DisposableScope } from "../disposable";
import "../internal/testUtils";

describe("The Disposable constructor", () => {
    it("is a function [spec]", () => expect(Disposable).toBeTypeof("function"));
    it("[[Prototype]] is %Function.prototype% [spec]", () => expect(Object.getPrototypeOf(Disposable)).toBe(Function.prototype));
    it("length is 1 [spec]", () => expect(Disposable.length).toBe(1));
    it("name is 'Disposable' [spec]", () => expect(Disposable.name).toBe("Disposable"));
    describe("Disposable(onDispose)", () => {
        it("returns instance of Disposable [spec]", () => expect(new Disposable(() => {})).toBeInstanceOf(Disposable));
        it("Adds 'onDispose' as resource callback [spec]", () => {
            const fn = jest.fn();
            const disposable = new Disposable(fn);
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("throws on call [spec]", () => expect(() => Disposable.call(null, () => {})).toThrow(TypeError));
    });
});

describe("Properties of the Disposable constructor", () => {
    it("Disposable.dispose [non-spec]", () => expect(Disposable.dispose).toBeTypeof("symbol"));
    describe("Disposable.from(iterable)", () => {
        it("is an own method [spec]", () => expect(Disposable).toHaveOwnMethod("from"));
        it("is writable [spec]", () => expect(Disposable).toHaveWritableProperty("from"));
        it("is non-enumerable [spec]", () => expect(Disposable).toHaveNonEnumerableProperty("from"));
        it("is configurable [spec]", () => expect(Disposable).toHaveConfigurableProperty("from"));
        it("returns instance of Dispose [spec]", () => expect(Disposable.from([])).toBeInstanceOf(Disposable));
        it("disposes resources [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            const disposable = Disposable.from([disposable1, disposable2]);
            disposable[Disposable.dispose]();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes resources only once [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            const disposable = Disposable.from([disposable1, disposable2]);
            disposable[Disposable.dispose]();
            disposable[Disposable.dispose]();
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });
        it("disposes resources in reverse order [spec]", () => {
            const steps: string[] = [];
            const disposable1 = new Disposable(() => { steps.push("disposable1"); });
            const disposable2 = new Disposable(() => { steps.push("disposable2"); });
            Disposable.from([disposable1, disposable2])[Disposable.dispose]();
            expect(steps).toEqual(["disposable2", "disposable1"]);
        });
        it("allows null and undefined [spec]", () => {
            expect(() => Disposable.from([null, undefined])).not.toThrow();
        });
        it("does not allow non-object [spec]", () => {
            expect(() => Disposable.from(["" as unknown as Disposable])).toThrow();
        });
        it("does not allow object without [Disposable.dispose] [spec]", () => {
            expect(() => Disposable.from([{} as unknown as Disposable])).toThrow();
        });
        it("disposes all resources even if previous element throws during dispose [spec]", () => {
            const disposable1 = new Disposable(() => { throw new Error(); });
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            const disposable = Disposable.from([disposable1, disposable2]);
            expect(() => disposable[Disposable.dispose]()).toThrow();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes all resources even if later element throws during dispose [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const disposable2 = new Disposable(() => { throw new Error(); });
            const disposable = Disposable.from([disposable1, disposable2]);
            expect(() => disposable[Disposable.dispose]()).toThrow();
            expect(fn1).toHaveBeenCalled();
        });
        it("disposes all resources even if previous element not disposable [spec]", () => {
            const disposable1 = {} as Disposable;
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            expect(() => Disposable.from([disposable1, disposable2])).toThrow();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes all resources even if next element not disposable [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            expect(() => Disposable.from([disposable1, {} as Disposable])).toThrow();
            expect(fn1).toHaveBeenCalled();
        });
        it("disposes only leading resources if iteration fails during IteratorNext [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            let i = 0;
            const iter: IterableIterator<Disposable> = {
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
            expect(() => Disposable.from(iter)).toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("disposes only leading resources if iteration fails during IteratorComplete [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            let i = 0;
            const iter: IterableIterator<Disposable> = {
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
            expect(() => Disposable.from(iter)).toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("disposes only leading resources if iteration fails during IteratorValue [spec]", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            let i = 0;
            const iter: IterableIterator<Disposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: disposable1, done: false };
                        case 1: return { get value(): Disposable { throw new Error(); }, done: false };
                        case 2: return { value: disposable2, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() {
                    return this;
                }
            };
            expect(() => Disposable.from(iter)).toThrow();
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("single error from invalid disposable wrapped in AggregateError [spec]", () => {
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from([{} as Disposable]);
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
        it("multiple errors from invalid disposable wrapped in AggregateError [spec]", () => {
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from([{} as Disposable, {} as Disposable]);
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
        it("single error from dispose wrapped in AggregateError [spec]", () => {
            const e1 = new Error();
            const disposable1 = new Disposable(() => { throw e1; });
            const disposable = Disposable.from([disposable1]);

            let throwCompletion!: { cause: unknown };
            try {
                disposable[Disposable.dispose]();
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
        it("multiple errors from dispose wrapped in AggregateError [spec]", () => {
            const e1 = new Error();
            const disposable1 = new Disposable(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = new Disposable(() => { throw e2; });
            const disposable = Disposable.from([disposable1, disposable2]);

            let throwCompletion!: { cause: unknown };
            try {
                disposable[Disposable.dispose]();
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
        it("error from iteration during IteratorNext not wrapped if no errors during dispose [spec]", () => {
            const e = new Error();
            const iter: IterableIterator<Disposable> = {
                next() { throw e; },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorComplete not wrapped if no errors during dispose [spec]", () => {
            const e = new Error();
            const iter: IterableIterator<Disposable> = {
                next() {
                    return { value: undefined!, get done(): boolean { throw e; } };
                },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorValue not wrapped if no errors during dispose [spec]", () => {
            const e = new Error();
            const iter: IterableIterator<Disposable> = {
                next() {
                    return { get value(): Disposable { throw e; }, done: false };
                },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBe(e);
        });
        it("error from iteration during IteratorNext wrapped if errors during dispose [spec]", () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<Disposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as Disposable, done: false };
                        case 1: throw eCause;
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("error from iteration during IteratorComplete wrapped if errors during dispose [spec]", () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<Disposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as Disposable, done: false };
                        case 1: return { value: undefined!, get done(): boolean { throw eCause; } };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("error from iteration during IteratorValue wrapped if errors during dispose [spec]", () => {
            const eCause = new Error();
            let i = 0;
            const iter: IterableIterator<Disposable> = {
                next() {
                    switch (i++) {
                        case 0: return { value: {} as Disposable, done: false };
                        case 1: return { get value(): Disposable { throw eCause; }, done: false };
                        default: return { value: undefined, done: true };
                    }
                },
                [Symbol.iterator]() { return this; }
            };
            let throwCompletion!: { cause: unknown };
            try {
                Disposable.from(iter);
            }
            catch (e) {
                throwCompletion = { cause: e };
            }
            expect(throwCompletion.cause).toBeInstanceOf(AggregateError);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).cause).toBe(eCause);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors.length).toBe(1);
            expect((throwCompletion.cause as AggregateError & { cause: unknown }).errors[0]).toBeInstanceOf(TypeError);
        });
        it("treat non-disposable function as disposable [non-spec]", () => {
            const fn = jest.fn();
            const disposable = Disposable.from([fn]);
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalled();
        });
    });
    describe("Disposable.scope() [non-spec]", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("scope"));
        it("disposes single resource", () => {
            const fn = jest.fn();
            const disposable = new Disposable(fn);
            for (const { using, fail } of Disposable.scope()) try {
                using(disposable);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes multiple resources", () => {
            const fn1 = jest.fn();
            const disposable1 = new Disposable(fn1);
            const fn2 = jest.fn();
            const disposable2 = new Disposable(fn2);
            for (const { using, fail } of Disposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes resources in reverse order", () => {
            const steps: string[] = [];
            const disposable1 = new Disposable(() => { steps.push("disposable1"); });
            const disposable2 = new Disposable(() => { steps.push("disposable2"); });

            for (const { using, fail } of Disposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }

            expect(steps).toEqual(["disposable2", "disposable1"]);
        });
        it("allows null or undefined", () => {
            for (const { using, fail } of Disposable.scope()) try {
                using(null);
                using(undefined);
            } catch (e) { fail(e); }
        });
        it("treat non-disposable function as disposable", () => {
            const fn = jest.fn();
            for (const { using, fail } of Disposable.scope()) try {
                using(fn);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("error from invalid disposable not wrapped if no errors during dispose", () => {
            const disposable1 = new Disposable(() => { });

            let throwCompletion!: { cause: unknown };
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    using({} as Disposable);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { cause: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.cause).toBeInstanceOf(TypeError);
        });
        it("error from invalid disposable wrapped if errors during dispose", () => {
            const e1 = new Error();
            const disposable1 = new Disposable(() => { throw e1; });

            let throwCompletion!: { cause: unknown };
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    using({} as Disposable);
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
        it("error from body not wrapped if no errors during dispose", () => {
            const e = new Error();
            const disposable1 = new Disposable(() => { });

            let throwCompletion!: { cause: unknown };
            try {
                for (const { using, fail } of Disposable.scope()) try {
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
        it("single error from dispose wrapped in AggregateError", () => {
            const e = new Error();
            const disposable1 = new Disposable(() => { throw e; });

            let throwCompletion!: { cause: unknown };
            try {
                for (const { using, fail } of Disposable.scope()) try {
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
        it("multiple errors from dispose wrapped in AggregateError", () => {
            const e1 = new Error();
            const disposable1 = new Disposable(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = new Disposable(() => { throw e2; });

            let throwCompletion!: { cause: unknown };
            try {
                for (const { using, fail } of Disposable.scope()) try {
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
        it("throws if scope.using is called late", () => {
            let scope!: DisposableScope;
            for (scope of Disposable.scope());
            expect(() => scope.using(null)).toThrow();
        });
        it("throws if scope.fail is called late", () => {
            let scope!: DisposableScope;
            for (scope of Disposable.scope());
            expect(() => scope.fail(null)).toThrow();
        });
    });
    describe("Disposable.usingEach(iterable) [non-spec]", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("usingEach"));
        it("disposes each", () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            for (const _ of Disposable.usingEach([fn1, fn2]));
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("does not dispose later if earlier throws", () => {
            const fn1 = () => { throw new Error(); };
            const fn2 = jest.fn();
            expect(() => {
                for (const _ of Disposable.usingEach([fn1, fn2]));
            }).toThrow();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("is not eager", () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            function* g() {
                yield fn1;
                yield fn2;
            }
            for (const _ of Disposable.usingEach(g())) {
                break;
            }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        })
    });
    describe("Disposable.use(resource, callback) [non-spec]", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("use"));
        it("disposes", () => {
            const fn = jest.fn();
            Disposable.use(fn, () => {});
            expect(fn).toHaveBeenCalled();
        });
        it("returns result", () => {
            const sentinel = {};
            const fn = jest.fn<void, []>();
            const result = Disposable.use(fn, () => sentinel);
            expect(result).toBe(sentinel);
        });
        it("passes resource", () => {
            const fn = jest.fn<void, []>();
            const cb = jest.fn();
            Disposable.use(fn, cb);
            expect(cb).toHaveBeenCalledWith(fn);
        });
    });
    describe("Disposable.hasInstance(value) [non-spec]", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("hasInstance"));
        it("returns true if value is disposable", () => expect(Disposable.hasInstance({ [Disposable.dispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(Disposable.hasInstance({ })).toBe(false));
    });
    describe("Disposable[Symbol.hasInstance](value) [non-spec]", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod(Symbol.hasInstance));
        it("returns true if value is disposable", () => expect(Disposable[Symbol.hasInstance]({ [Disposable.dispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(Disposable[Symbol.hasInstance]({ })).toBe(false));
    });
});

describe("Properties of the Disposable.prototype object", () => {
    it("is an object [spec]", () => expect(Disposable.prototype).toBeTypeof("object"));
    describe("Disposable.prototype[Disposable.dispose]()", () => {
        it("is an own method [spec]", () => expect(Disposable.prototype).toHaveOwnMethod(Disposable.dispose));
        it("is writable [spec]", () => expect(Disposable.prototype).toHaveWritableProperty(Disposable.dispose));
        it("is non-enumerable [spec]", () => expect(Disposable.prototype).toHaveNonEnumerableProperty(Disposable.dispose));
        it("is configurable [spec]", () => expect(Disposable.prototype).toHaveConfigurableProperty(Disposable.dispose));
        it("disposes resource stack [spec]", () => {
            const fn = jest.fn();
            const disposable = new Disposable(fn);
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes resource only once [spec]", () => {
            const fn = jest.fn();
            const disposable = new Disposable(fn);
            disposable[Disposable.dispose]();
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it("throws on non instance [spec]", () => expect(() => Disposable.prototype[Disposable.dispose].call({})).toThrow());
    });
    describe("Disposable.prototype[Symbol.toStringTag]", () => {
        it("is an own property [spec]", () => expect(Disposable.prototype).toHaveOwnProperty(Symbol.toStringTag));
        it("is non-writable [spec]", () => expect(Disposable.prototype).toHaveNonWritableProperty(Symbol.toStringTag));
        it("is non-enumerable [spec]", () => expect(Disposable.prototype).toHaveNonEnumerableProperty(Symbol.toStringTag));
        it("is configurable [spec]", () => expect(Disposable.prototype).toHaveConfigurableProperty(Symbol.toStringTag));
        it("is 'Disposable' [spec]", () => expect((Disposable.prototype as any)[Symbol.toStringTag]).toBe("Disposable"));
    });
});

describe("Properties of Disposable instances", () => {
    it("Inherits from %Disposable.prototype%", () => expect(Object.getPrototypeOf(new Disposable(() => {}))).toBe(Disposable.prototype));
});
