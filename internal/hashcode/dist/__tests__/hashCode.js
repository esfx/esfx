"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const state = index_1.hashUnknown.getState();
beforeEach(() => {
    index_1.hashUnknown.setState({
        objectSeed: 0x1dc8529e,
        stringSeed: 0x6744b005,
        bigIntSeed: 0x6c9503bc,
        localSymbolSeed: 0x78819b01,
        globalSymbolSeed: 0x1875c170
    });
});
afterEach(() => {
    index_1.hashUnknown.setState(state);
});
it("null", () => expect(index_1.hashUnknown(null)).toBe(0));
it("undefined", () => expect(index_1.hashUnknown(undefined)).toBe(0));
it("true", () => expect(index_1.hashUnknown(true)).toBe(1));
it("false", () => expect(index_1.hashUnknown(false)).toBe(0));
it("0", () => expect(index_1.hashUnknown(0)).toBe(0));
it("1", () => expect(index_1.hashUnknown(1)).toBe(1));
it("1.2", () => expect(index_1.hashUnknown(1.2)).toBe(49164));
it('""', () => expect(index_1.hashUnknown("")).toBe(-293397629));
it('"abc"', () => expect(index_1.hashUnknown("abc")).toBe(38704718));
it("123n", () => expect(index_1.hashUnknown(123n)).toBe(251));
it("{}", () => expect(index_1.hashUnknown({})).toBe(-467054833));
it("same {}", () => (obj => expect(index_1.hashUnknown(obj)).toBe(index_1.hashUnknown(obj)))({}));
it("different {}", () => expect(index_1.hashUnknown({})).not.toBe(index_1.hashUnknown({})));
it("symbol", () => expect(index_1.hashUnknown(Symbol())).toBe(1087209661));
it("same symbol", () => (sym => expect(index_1.hashUnknown(sym)).toBe(index_1.hashUnknown(sym)))(Symbol()));
it("different symbols", () => expect(index_1.hashUnknown(Symbol())).not.toBe(index_1.hashUnknown(Symbol())));
it("built-in symbol", () => expect(index_1.hashUnknown(Symbol.iterator)).toBe(-925861680));
it("symbol.for", () => expect(index_1.hashUnknown(Symbol.for("foo"))).toBe(-1197376351));
//# sourceMappingURL=hashCode.js.map