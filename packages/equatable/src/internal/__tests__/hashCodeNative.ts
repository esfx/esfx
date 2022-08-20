const { hashUnknown } = require("#hashCode");

it("null", () => expect(hashUnknown(null)).toBe(178506403));
it("undefined", () => expect(hashUnknown(undefined)).toBe(178506403));
it("true", () => expect(hashUnknown(true)).toBe(316017654));
it("false", () => expect(hashUnknown(false)).toBe(178506403));
it("0", () => expect(hashUnknown(0)).toBe(178506403));
it("1", () => expect(hashUnknown(1)).toBe(316017654));
it("1.2", () => expect(hashUnknown(1.2)).toBe(1052445930));

// v8's hashes for strings aren't predictable
//// it('""', () => expect(hashUnknown("")).toBe(255186929));
it('"abc"', () => {
    // v8's hashes for strings aren't predictable
    const a = "abc";
    const b = "abd";
    const ahc = hashUnknown(a);
    const ahc2 = hashUnknown(a);
    const bhc = hashUnknown(b);
    expect(ahc).toBe(ahc2);
    expect(ahc).not.toBe(bhc);
});
// @ts-ignore
it("123n", () => expect(hashUnknown(123n)).toBe(1375457711));
it("{}", () => {
    // v8's hashes for objects aren't predictable
    const a = {};
    const b = {};
    const ahc = hashUnknown(a);
    const ahc2 = hashUnknown(a);
    const bhc = hashUnknown(b);
    expect(ahc).toBe(ahc2);
    expect(ahc).not.toBe(bhc);
});
it("same {}", () => (obj => expect(hashUnknown(obj)).toBe(hashUnknown(obj)))({}));
it("different {}", () => expect(hashUnknown({})).not.toBe(hashUnknown({})));
it("symbol", () => {
    // v8's hashes for symbols aren't predictable
    const a = Symbol();
    const b = Symbol();
    const ahc = hashUnknown(a);
    const ahc2 = hashUnknown(a);
    const bhc = hashUnknown(b);
    expect(ahc).toBe(ahc2);
    expect(ahc).not.toBe(bhc);
});
it("same symbol", () => (sym => expect(hashUnknown(sym)).toBe(hashUnknown(sym)))(Symbol()));
it("different symbols", () => expect(hashUnknown(Symbol())).not.toBe(hashUnknown(Symbol())));
it("built-in symbol", () => expect(hashUnknown(Symbol.iterator)).toBe(262136922));
it("symbol.for", () => {
    // v8's hashes for symbols aren't predictable
    const a = Symbol.for("foo");
    const b = Symbol.for("foo");
    const c = Symbol();
    const ahc = hashUnknown(a);
    const ahc2 = hashUnknown(a);
    const bhc = hashUnknown(b);
    const chc = hashUnknown(c);
    expect(ahc).toBe(bhc);
    expect(ahc).toBe(ahc2);
    expect(ahc).not.toBe(chc);
});