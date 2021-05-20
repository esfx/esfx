import { createHashUnknown } from "../hashCode";

const { hashUnknown, getState, setState } = createHashUnknown();

beforeEach(() => {
    const state = getState();
    setState({
        objectSeed: 0x1dc8529e,
        stringSeed: [0x6744b005, 0x6C7012BF],
        bigIntSeed: [0x6c9503bc, 0x4BBD0E53],
        localSymbolSeed: [0x78819b01, 0x2CC3EAD9],
        globalSymbolSeed: [0x1875c170, 0x4C838A1C]
    });
    afterEach(() => {
        setState(state);
    });
});


it("null", () => expect(hashUnknown(null)).toBe(0));
it("undefined", () => expect(hashUnknown(undefined)).toBe(0));
it("true", () => expect(hashUnknown(true)).toBe(1));
it("false", () => expect(hashUnknown(false)).toBe(0));
it("0", () => expect(hashUnknown(0)).toBe(0));
it("1", () => expect(hashUnknown(1)).toBe(1));
it("1.2", () => expect(hashUnknown(1.2)).toBe(213909504));
it('""', () => expect(hashUnknown("")).toBe(-1011255459));
it('"abc"', () => expect(hashUnknown("abc")).toBe(1524695520));
it("123n", () => expect(hashUnknown(BigInt(123))).toBe(123));
it("{}", () => expect(hashUnknown({})).toBe(499667486));
it("same {}", () => (obj => expect(hashUnknown(obj)).toBe(hashUnknown(obj)))({}));
it("different {}", () => expect(hashUnknown({})).not.toBe(hashUnknown({})));
it("symbol", () => expect(hashUnknown(Symbol())).toBe(-829620105));
it("same symbol", () => (sym => expect(hashUnknown(sym)).toBe(hashUnknown(sym)))(Symbol()));
it("different symbols", () => expect(hashUnknown(Symbol())).not.toBe(hashUnknown(Symbol())));
it("built-in symbol", () => expect(hashUnknown(Symbol.iterator)).toBe(-1674029499));
it("symbol.for", () => expect(hashUnknown(Symbol.for("foo"))).toBe(248530634));