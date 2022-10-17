/// <reference path="../../../package.internal.d.ts" />

import { hashUnknown } from "../hashUnknown.js";

it("null", () => {
    expect(hashUnknown(null)).toBe(hashUnknown(null));
});
it("undefined", () => {
    expect(hashUnknown(undefined)).toBe(hashUnknown(undefined));
});
it("true", () => {
    expect(hashUnknown(true)).toBe(hashUnknown(true));
    expect(hashUnknown(true)).not.toBe(hashUnknown(false));
});
it("false", () => {
    expect(hashUnknown(false)).toBe(hashUnknown(false));
    expect(hashUnknown(false)).not.toBe(hashUnknown(true));
});

it("0", () => {
    expect(hashUnknown(0)).toBe(hashUnknown(0));
    expect(hashUnknown(0)).not.toBe(hashUnknown(1));
    expect(hashUnknown(0)).not.toBe(hashUnknown(-1));
});
it("1", () => {
    expect(hashUnknown(1)).toBe(hashUnknown(1));
    expect(hashUnknown(1)).not.toBe(hashUnknown(0));
    expect(hashUnknown(1)).not.toBe(hashUnknown(-0));
});
it("-1", () => {
    expect(hashUnknown(-1)).toBe(hashUnknown(-1));
    expect(hashUnknown(-1)).not.toBe(hashUnknown(0));
    expect(hashUnknown(-1)).not.toBe(hashUnknown(1));
});
it("1.2", () => {
    expect(hashUnknown(1.2)).toBe(hashUnknown(1.2));
    expect(hashUnknown(1.2)).not.toBe(hashUnknown(1.3));
});
it('""', () => {
    expect(hashUnknown("")).toBe(hashUnknown(""));
    expect(hashUnknown("")).not.toBe(hashUnknown("abc"));
});
it('"abc"', () => {
    expect(hashUnknown("abc")).toBe(hashUnknown("abc"));
});
it("123n", () => {
    expect(hashUnknown(BigInt(123))).toBe(hashUnknown(BigInt(123)));
});
it("-123n", () => {
    expect(hashUnknown(BigInt(-123))).toBe(hashUnknown(BigInt(-123)));
});
it("{}", () => {
    const obj1 = {};
    const obj2 = {};
    expect(hashUnknown(obj1)).toBe(hashUnknown(obj1));
    expect(hashUnknown(obj1)).not.toBe(hashUnknown(obj2));
});
it("symbol", () => {
    const sym1 = Symbol();
    const sym2 = Symbol();
    expect(hashUnknown(sym1)).toBe(hashUnknown(sym1));
    expect(hashUnknown(sym1)).not.toBe(hashUnknown(sym2));
});
it("built-in symbol", () => {
    expect(hashUnknown(Symbol.iterator)).toBe(hashUnknown(Symbol.iterator));
    expect(hashUnknown(Symbol.iterator)).not.toBe(hashUnknown(Symbol.toStringTag));
});
it("Symbol.for", () => {
    const sym1 = Symbol.for("foo");
    const sym2 = Symbol.for("foo");
    const sym3 = Symbol.for("bar");
    expect(hashUnknown(sym1)).toBe(hashUnknown(sym1));
    expect(hashUnknown(sym1)).toBe(hashUnknown(sym2));
    expect(hashUnknown(sym1)).not.toBe(hashUnknown(sym3));
});
