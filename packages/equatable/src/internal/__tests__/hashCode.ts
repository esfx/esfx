import { hashUnknown } from "../hashCode";

const state = hashUnknown.getState();

beforeEach(() => {
    hashUnknown.setState({
        objectSeed: 0x1dc8529e,
        stringSeed: 0x6744b005,
        bigIntSeed: 0x6c9503bc,
        localSymbolSeed: 0x78819b01,
        globalSymbolSeed: 0x1875c170
    });
});

afterEach(() => {
    hashUnknown.setState(state);
});

it("null", () => expect(hashUnknown(null)).toBe(0));
it("undefined", () => expect(hashUnknown(undefined)).toBe(0));
it("true", () => expect(hashUnknown(true)).toBe(1));
it("false", () => expect(hashUnknown(false)).toBe(0));
it("0", () => expect(hashUnknown(0)).toBe(0));
it("1", () => expect(hashUnknown(1)).toBe(1));
it("1.2", () => expect(hashUnknown(1.2)).toBe(49164));
it('""', () => expect(hashUnknown("")).toBe(-293397629));
it('"abc"', () => expect(hashUnknown("abc")).toBe(38704718));
// @ts-ignore
it("123n", () => expect(hashUnknown(123n)).toBe(251));
it("{}", () => expect(hashUnknown({})).toBe(-467054833));
it("same {}", () => (obj => expect(hashUnknown(obj)).toBe(hashUnknown(obj)))({}));
it("different {}", () => expect(hashUnknown({})).not.toBe(hashUnknown({})));
it("symbol", () => expect(hashUnknown(Symbol())).toBe(1087209661));
it("same symbol", () => (sym => expect(hashUnknown(sym)).toBe(hashUnknown(sym)))(Symbol()));
it("different symbols", () => expect(hashUnknown(Symbol())).not.toBe(hashUnknown(Symbol())));
it("built-in symbol", () => expect(hashUnknown(Symbol.iterator)).toBe(-925861680));
it("symbol.for", () => expect(hashUnknown(Symbol.for("foo"))).toBe(-1197376351));