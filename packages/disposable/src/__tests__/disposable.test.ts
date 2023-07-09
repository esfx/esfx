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
import { Disposable, DisposableScope } from "../disposable";
import "../internal/testUtils";
import { ThrowCompletion } from "../internal/utils";

interface SuppressedError extends Error {
    error: any;
    suppressed: any;
}

describe("Properties of the Disposable object [non-spec]", () => {
    it("Disposable.dispose", () => expect(Disposable.dispose).toBeTypeof("symbol"));
    describe("Disposable.scope()", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("scope"));
        it("disposes single resource", () => {
            const fn = jest.fn();
            const disposable = Disposable.create(fn);
            for (const { using, fail } of Disposable.scope()) try {
                using(disposable);
            } catch (e) { fail(e); }
            expect(fn).toHaveBeenCalled();
        });
        it("disposes multiple resources", () => {
            const fn1 = jest.fn();
            const disposable1 = Disposable.create(fn1);
            const fn2 = jest.fn();
            const disposable2 = Disposable.create(fn2);
            for (const { using, fail } of Disposable.scope()) try {
                using(disposable1);
                using(disposable2);
            } catch (e) { fail(e); }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("disposes resources in reverse order", () => {
            const steps: string[] = [];
            const disposable1 = Disposable.create(() => { steps.push("disposable1"); });
            const disposable2 = Disposable.create(() => { steps.push("disposable2"); });

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
        it("error from invalid disposable not wrapped if no errors during dispose", () => {
            const disposable1 = Disposable.create(() => { });

            let throwCompletion!: ThrowCompletion;
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    using({} as Disposable);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { value: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.value).toBeInstanceOf(TypeError);
        });
        it("error from invalid disposable wrapped if errors during dispose", () => {
            const e1 = new Error();
            const disposable1 = Disposable.create(() => { throw e1; });

            let throwCompletion!: ThrowCompletion;
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    using({} as Disposable);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { value: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.value).toBeInstanceOf(Error);
            expect((throwCompletion.value as SuppressedError).name).toBe("SuppressedError");
            expect((throwCompletion.value as SuppressedError).suppressed).toBeInstanceOf(TypeError);
            expect((throwCompletion.value as SuppressedError).error).toBe(e1);
        });
        it("error from body not wrapped if no errors during dispose", () => {
            const e = new Error();
            const disposable1 = Disposable.create(() => { });

            let throwCompletion!: ThrowCompletion;
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    throw e;
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { value: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.value).toBe(e);
        });
        it("single error from dispose not wrapped", () => {
            const e = new Error();
            const disposable1 = Disposable.create(() => { throw e; });

            let throwCompletion!: ThrowCompletion;
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { value: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.value).toBe(e);
        });
        it("multiple errors from dispose wrapped in SuppressedError", () => {
            const e1 = new Error();
            const disposable1 = Disposable.create(() => { throw e1; });
            const e2 = new Error();
            const disposable2 = Disposable.create(() => { throw e2; });

            let throwCompletion!: ThrowCompletion;
            try {
                for (const { using, fail } of Disposable.scope()) try {
                    using(disposable1);
                    using(disposable2);
                } catch (e) { fail(e); }
            }
            catch (e) {
                throwCompletion = { value: e };
            }

            expect(throwCompletion).toBeDefined();
            expect(throwCompletion.value).toBeInstanceOf(Error);
            expect((throwCompletion.value as SuppressedError).name).toBe("SuppressedError");
            expect((throwCompletion.value as SuppressedError).suppressed).toBe(e2);
            expect((throwCompletion.value as SuppressedError).error).toBe(e1);
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
    describe("Disposable.usingEach(iterable)", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("usingEach"));
        it("disposes each", () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            for (const _ of Disposable.usingEach([Disposable.create(fn1), Disposable.create(fn2)]));
            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
        });
        it("does not dispose later if earlier throws", () => {
            const fn1 = () => { throw new Error(); };
            const fn2 = jest.fn();
            expect(() => {
                for (const _ of Disposable.usingEach([Disposable.create(fn1), Disposable.create(fn2)]));
            }).toThrow();
            expect(fn2).not.toHaveBeenCalled();
        });
        it("is not eager", () => {
            const fn1 = jest.fn();
            const fn2 = jest.fn();
            function* g() {
                yield Disposable.create(fn1);
                yield Disposable.create(fn2);
            }
            for (const _ of Disposable.usingEach(g())) {
                break;
            }
            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        })
    });
    describe("Disposable.create(dispose)", () => {
        it("disposes resource stack", () => {
            const fn = jest.fn();
            const disposable = Disposable.create(fn);
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalled();
        });
        it("disposes resource only once", () => {
            const fn = jest.fn();
            const disposable = Disposable.create(fn);
            disposable[Disposable.dispose]();
            disposable[Disposable.dispose]();
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
    describe("Disposable.hasInstance(value)", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod("hasInstance"));
        it("returns true if value is disposable", () => expect(Disposable.hasInstance({ [Disposable.dispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect(Disposable.hasInstance({ })).toBe(false));
    });
    describe("Disposable[Symbol.hasInstance](value)", () => {
        it("is an own method", () => expect(Disposable).toHaveOwnMethod(Symbol.hasInstance));
        it("returns true if value is disposable", () => expect((Disposable as any)[Symbol.hasInstance]({ [Disposable.dispose]() {} })).toBe(true));
        it("returns false if value is not disposable", () => expect((Disposable as any)[Symbol.hasInstance]({ })).toBe(false));
    });
});
