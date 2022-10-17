import { jest } from "@jest/globals";
import { randomInt } from "crypto";
import { SAMPLE_SIZE, generateRandomSymbols } from "./data/randomSymbols";
import { hashSymbolUsingHashUnknown } from "./scenarios/hashSymbol/hashSymbolUsingHashUnknown";
import { hashSymbolUsingNativeHashSymbol } from "./scenarios/hashSymbol/hashSymbolUsingNative";
import { hashSymbolWithXXHash32UsingJs } from "./scenarios/hashSymbol/hashSymbolWithXXHash32UsingJs";
import { hashSymbolWithXXHash64UsingWasm } from "./scenarios/hashSymbol/hashSymbolWithXXHash64UsingWasm";

describe('hashSymbol', () => {
    jest.setTimeout(10_000_000);

    let randomSymbols: symbol[];
    let randomSymbol: symbol;

    beforeAll(async () => {
        randomSymbols = generateRandomSymbols();
        randomSymbol = randomSymbols[randomInt(randomSymbols.length - 1)];

        // prime each
        hashSymbolUsingHashUnknown(Symbol());
        hashSymbolUsingNativeHashSymbol(Symbol());
        hashSymbolWithXXHash32UsingJs(Symbol());
        hashSymbolWithXXHash64UsingWasm(Symbol());
    });

    afterAll(() => {
        randomSymbols = undefined!;
        randomSymbol = undefined!;
    });

    it(hashSymbolUsingNativeHashSymbol.name, () => {
        expect(() => hashSymbolUsingNativeHashSymbol(randomSymbol)).not.toThrow();
    });

    it(hashSymbolWithXXHash64UsingWasm.name, () => {
        expect(() => hashSymbolWithXXHash64UsingWasm(randomSymbol)).not.toThrow();
    });

    it(hashSymbolWithXXHash32UsingJs.name, () => {
        expect(() => hashSymbolWithXXHash32UsingJs(randomSymbol)).not.toThrow();
    });

    it(`hash ${SAMPLE_SIZE} strings`, async () => {
        await expect(null).benchmark({
            [hashSymbolWithXXHash64UsingWasm.name]() {
                const f = hashSymbolWithXXHash64UsingWasm;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomSymbols[i]);
                }
            },
            [hashSymbolWithXXHash32UsingJs.name]() {
                const f = hashSymbolWithXXHash32UsingJs;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomSymbols[i]);
                }
            },
            [hashSymbolUsingNativeHashSymbol.name]() {
                const f = hashSymbolUsingNativeHashSymbol;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomSymbols[i]);
                }
            },
            [hashSymbolUsingHashUnknown.name]() {
                const f = hashSymbolUsingHashUnknown;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomSymbols[i]);
                }
            },
        });
    });
});