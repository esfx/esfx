import { jest } from "@jest/globals";
import { Comparer, Equaler, rawHash } from "@esfx/equatable";
import { allocator, always, alwaysFail, alwaysFalse, alwaysTrue, both, caller, clamp, compare, complement, compose, decrementer, either, equate, F, factory, fail, fallback, flip, hash, identity, incrementer, invoker, lazy, nAry, noop, pipe, property, propertyWriter, T, tuple, uncurryThis } from "../common"

class TestError extends Error {}

describe("fail", () => {
    it("throws the provided value", () => expect(() => fail(new TestError())).toThrow(TestError));
});

describe("noop", () => {
    it("does not throw", () => expect(() => noop()).not.toThrow());
    it("returns undefined", () => expect(noop()).toBeUndefined());
});

describe("identity", () => {
    it("returns the provided value", () => expect(identity(1)).toBe(1));
});

describe("alwaysTrue", () => {
    it("returns true", () => expect(alwaysTrue()).toBe(true));
    it("is aliased as T", () => expect(T).toBe(alwaysTrue));
    it("is aliased as always.true", () => expect(always.true).toBe(alwaysTrue));
});

describe("alwaysFalse", () => {
    it("returns false", () => expect(alwaysFalse()).toBe(false));
    it("is aliased as F", () => expect(F).toBe(alwaysFalse));
    it("is aliased as always.false", () => expect(always.false).toBe(alwaysFalse));
});

describe("alwaysFail", () => {
    it("returns function", () => expect(typeof alwaysFail(new TestError())).toBe("function"));
    it("returned function always throws when called", () => {
        const e = new TestError();
        const f = alwaysFail(e);
        expect(() => f()).toThrow(e);
        expect(() => f()).toThrow(e);
    })
    it("is aliased as always.fail", () => expect(always.fail).toBe(alwaysFail));
});

describe("always", () => {
    it("returns function", () => expect(typeof always(1)).toBe("function"));
    it("returned function always returns when called", () => {
        const obj = {};
        const f = always(obj);
        expect(f()).toBe(obj);
        expect(f()).toBe(obj);
    });
});

describe("incrementer", () => {
    it("returns function", () => expect(typeof incrementer()).toBe("function"));
    it("returns monotonically increasing values", () => {
        const f = incrementer();
        expect(f()).toBe(0);
        expect(f()).toBe(1);
        expect(f()).toBe(2);
        expect(f()).toBe(3);
    });
    it("can supply custom start", () => {
        const f = incrementer(1);
        expect(f()).toBe(1);
        expect(f()).toBe(2);
    });
    describe("step", () => {
        it("can supply custom step", () => {
            const f = incrementer.step(2);
            expect(f()).toBe(0);
            expect(f()).toBe(2);
            expect(f()).toBe(4);
        });
        it("can supply custom step and start", () => {
            const f = incrementer.step(2, 1);
            expect(f()).toBe(1);
            expect(f()).toBe(3);
            expect(f()).toBe(5);
        });
        it("step must be positive", () => {
            expect(() => incrementer.step(0)).toThrow();
            expect(() => incrementer.step(-1)).toThrow();
        });
    });
});

describe("decrementer", () => {
    it("returns function", () => expect(typeof decrementer()).toBe("function"));
    it("returns monotonically decreasing values", () => {
        const f = decrementer();
        expect(f()).toBe(0);
        expect(f()).toBe(-1);
        expect(f()).toBe(-2);
        expect(f()).toBe(-3);
    });
    it("can supply custom start", () => {
        const f = decrementer(-1);
        expect(f()).toBe(-1);
        expect(f()).toBe(-2);
    });
    describe("step", () => {
        it("can supply custom step", () => {
            const f = decrementer.step(2);
            expect(f()).toBe(0);
            expect(f()).toBe(-2);
            expect(f()).toBe(-4);
        });
        it("can supply custom step and start", () => {
            const f = decrementer.step(2, -1);
            expect(f()).toBe(-1);
            expect(f()).toBe(-3);
            expect(f()).toBe(-5);
        });
        it("step must be positive", () => {
            expect(() => decrementer.step(0)).toThrow();
            expect(() => decrementer.step(-1)).toThrow();
        });
    });
});

describe("tuple", () => {
    it("0 args returns array with 0 elements", () => expect(tuple()).toEqual([]));
    it("1 arg returns array with 1 element", () => expect(tuple(1)).toEqual([1]));
    it("type system test", () => {
        const x: [] = tuple();
        const y: [number] = tuple(1);
    });
});

describe("nAry", () => {
    it("returns function", () => expect(typeof nAry((_?: any) => {}, 0)).toBe("function"));
    it("returned function has supplied length", () => expect(nAry((_?: any) => {}, 0).length).toBe(0));
    it("returned function truncates arguments", () => {
        const f = (...args: any[]) => args;
        const g: typeof f = nAry(f, 1);
        expect(g(1, 2)).toEqual([1]);
    });
    it("returned function does not fill arguments", () => {
        const f = (...args: any[]) => args;
        const g: typeof f = nAry(f, 2);
        expect(g(1)).toEqual([1]);
    });
});

describe("compose", () => {
    it("compose(g, f)(x) is g(f(x))", () => {
        const f = (x: string) => `f(${x})`;
        const g = (x: string) => `g(${x})`;
        expect(compose(g, f)("x")).toBe("g(f(x))");
    });
});

describe("pipe", () => {
    it("pipe(g, f)(x) is f(g(x))", () => {
        const f = (x: string) => `f(${x})`;
        const g = (x: string) => `g(${x})`;
        expect(pipe(g, f)("x")).toBe("f(g(x))");
    });
});

describe("property", () => {
    it("gets property", () => {
        const f = property("x");
        expect(f({ x: 1 })).toBe(1);
    });
});

describe("propertyWriter", () => {
    it("sets property", () => {
        const f = propertyWriter("x");
        const obj = { x: 1 };
        f(obj, 2);
        expect(obj.x).toBe(2);
    });
});

describe("invoker", () => {
    it("invokes method", () => {
        const f = invoker("x");
        const obj = { x(...args: any[]) { return args; } };
        expect(f(obj)).toEqual([]);
        expect(f(obj, 1)).toEqual([1]);
    });
    it("binds leading arguments", () => {
        const f = invoker("x", 1);
        const obj = { x(...args: any[]) { return args; } };
        expect(f(obj)).toEqual([1]);
        expect(f(obj, 2)).toEqual([1, 2]);
    });
});

describe("caller", () => {
    it("calls method", () => {
        const f = caller();
        const g = (...args: any[]) => args;
        expect(f(g)).toEqual([]);
        expect(f(g, 1)).toEqual([1]);
    });
    it("binds leading arguments", () => {
        const f = caller(1);
        const g = (...args: any[]) => args;
        expect(f(g)).toEqual([1]);
        expect(f(g, 2)).toEqual([1, 2]);
    });
});

describe("allocator", () => {
    it("creates instance", () => {
        const f = allocator();
        class G {
            args: any[];
            constructor(...args: any[]) { this.args = args; }
        }
        expect(f(G)).toBeInstanceOf(G);
        expect(f(G).args).toEqual([]);
        expect(f(G, 1).args).toEqual([1]);
    });
    it("binds leading arguments", () => {
        const f = allocator(1);
        class G {
            args: any[];
            constructor(...args: any[]) { this.args = args; }
        }
        expect(f(G)).toBeInstanceOf(G);
        expect(f(G).args).toEqual([1]);
        expect(f(G, 2).args).toEqual([1, 2]);
    });
});

describe("factory", () => {
    it("creates instance", () => {
        class G {
            args: any[];
            constructor(...args: any[]) { this.args = args; }
        }
        const f = factory(G);
        expect(f()).toBeInstanceOf(G);
        expect(f().args).toEqual([]);
        expect(f(1).args).toEqual([1]);
    });
    it("binds leading arguments", () => {
        class G {
            args: any[];
            constructor(...args: any[]) { this.args = args; }
        }
        const f = factory(G, 1);
        expect(f()).toBeInstanceOf(G);
        expect(f().args).toEqual([1]);
        expect(f(2).args).toEqual([1, 2]);
    });
});

describe("flip", () => {
    it("flips first and second arguments", () => {
        const g = (...args: any[]) => args;
        const f = flip(g);
        expect(f(1, 2)).toEqual([2, 1]);
    });
    it("flips first and second arguments only", () => {
        const g = (...args: any[]) => args;
        const f = flip(g);
        expect(f(1, 2, 3)).toEqual([2, 1, 3]);
    });
});

describe("lazy", () => {
    it("calls factory only once", () => {
        const fn = jest.fn();
        const f = lazy(fn);
        f();
        f();
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it("returns same value each time", () => {
        const f = lazy(() => ({}));
        const obj = f();
        expect(f()).toBe(obj);
    });
    it("binds leading arguments", () => {
        const f = lazy((...args: any[]) => args, 1);
        expect(f()).toEqual([1]);
    });
    it("captures error", () => {
        const e = new Error();
        let count = 0;
        const f = lazy(() => { throw count++, e; });
        expect(() => f()).toThrow(e);
        expect(() => f()).toThrow(e);
        expect(count).toBe(1);
    });
    it("does not allow invoking self inside of factory", () => {
        const f = lazy(() => { f(); });
        expect(() => f()).toThrow();
    });
});

describe("uncurryThis", () => {
    it("uncurrys this", () => {
        function g(this: any, ...args: any[]) { return [this, ...args]; }
        const f = uncurryThis(g);
        expect(f(1, 2)).toEqual([1, 2]);
    });
});

describe("equate", () => {
    it("compares equality", () => {
        expect(equate(1, 1)).toBe(true);
        expect(equate(1, 2)).toBe(false);
    });
    describe("withEqualer", () => {
        it("uses custom equaler", () => {
            interface Point { x: number, y: number };
            const equaler = Equaler.create<Point>((a, b) => a.x === b.x && a.y === b.y);
            const f = equate.withEqualer(equaler);
            expect(f({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(true); 
            expect(f({ x: 1, y: 1 }, { x: 1, y: 2 })).toBe(false); 
        });
    });
});

describe("hash", () => {
    it("hashes", () => {
        expect(hash(1)).toBe(hash(1));
        expect(hash(1)).toBe(rawHash(1));
    });
    describe("withEqualer", () => {
        it("uses custom equaler", () => {
            interface Point { x: number, y: number };
            const equaler = Equaler.create<Point>((a, b) => a.x === b.x && a.y === b.y, a => a.x ^ a.y);
            const f = hash.withEqualer(equaler);
            expect(f({ x: 1, y: 2 })).toBe(1 ^ 2);
        });
    });
});

describe("compare", () => {
    it("compares", () => {
        expect(compare(1, 1)).toBe(0);
        expect(compare(1, 0)).toBeGreaterThan(0);
        expect(compare(0, 1)).toBeLessThan(0);
    });
    describe("withComparer", () => {
        it("uses custom comparer", () => {
            interface Holder { x: number };
            const comparer = Comparer.create<Holder>((a, b) => a.x - b.x);
            const f = compare.withComparer(comparer);
            expect(f({ x: 1 }, { x: 1 })).toBe(0);
            expect(f({ x: 1 }, { x: 0 })).toBeGreaterThan(0);
            expect(f({ x: 0 }, { x: 1 })).toBeLessThan(0);
        });
    });
});

describe("clamp", () => {
    it("clamps", () => {
        const f = clamp(0, 1);
        expect(f(.5)).toBe(.5);
        expect(f(2)).toBe(1);
        expect(f(-1)).toBe(0);
    });
    describe("withComparer", () => {
        it("uses custom comparer", () => {
            interface Holder { x: number };
            const comparer = Comparer.create<Holder>((a, b) => a.x - b.x);
            const f = clamp.withComparer(comparer)({ x: 0 }, { x: 1 });
            expect(f({ x: .5 })).toEqual({ x: .5 });
            expect(f({ x: 2 })).toEqual({ x: 1 });
            expect(f({ x: -1 })).toEqual({ x: 0 });
        });
    });
});

describe("complement", () => {
    it("returns complement", () => {
        const g = (x: boolean) => x;
        const f = complement(g);
        expect(f(true)).toBe(false);
        expect(f(false)).toBe(true);
    });
});

describe("both", () => {
    it("returns second if first is truthy", () => {
        const a = () => ({ x: 1 });
        const b = () => ({ x: 2 });
        const f = both(a, b);
        expect(f()).toEqual({ x: 2 });
    });
    it("returns first if first is falsy", () => {
        const a = () => 0;
        const b = () => true;
        const f = both(a, b);
        expect(f()).toBe(0);
    });
});

describe("either", () => {
    it("returns first if first is truthy", () => {
        const a = () => ({ x: 1 });
        const b = () => ({ x: 2 });
        const f = either(a, b);
        expect(f()).toEqual({ x: 1 });
    });
    it("returns second if first is falsy", () => {
        const a = () => 0;
        const b = () => true;
        const f = either(a, b);
        expect(f()).toBe(true);
    });
});

describe("fallback()", () => {
    it("does not execute fallback if result is non-nullish", () => {
        const a = () => 0;
        const b = jest.fn();
        const f = fallback(a, b);
        expect(f()).toBe(0);
        expect(b).not.toHaveBeenCalled();
    });
    it("executes fallback if result is nullish", () => {
        const a = () => null;
        const b = () => 1;
        const f = fallback(a, b);
        expect(f()).toBe(1);
    });
});
