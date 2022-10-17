import { jest } from "@jest/globals";
import { generateRandomBigInts, SAMPLE_SIZE } from "./data/randomBigInts.js";
import { hashBigIntUsingBigUint64Array, hashBigIntUsingBigUint64ArrayUnlessSmall } from "./scenarios/hashBigInt/hashBigIntUsingBigUint64Array.js";
import { hashBigIntUsingNumberConstructor, hashBigIntUsingNumberConstructorAndAsUintN } from "./scenarios/hashBigInt/hashBigIntUsingNumberConstructor.js";
import { hashBigIntUsingWasm, hashBigIntUsingWasmUnlessSmall } from "./scenarios/hashBigInt/hashBigIntUsingWasm.js";
import { hashBigIntUsingNativeHashBigInt } from "./scenarios/hashBigInt/hashBigIntUsingNative.js";
import { hashBigIntUsingHashUnknown } from "./scenarios/hashBigInt/hashBigIntUsingHashUnknown.js";

jest.setTimeout(10_000_000);

describe("hashBigInt", () => {

    let randomNumbers: bigint[];
    beforeAll(() => {
        randomNumbers = generateRandomBigInts();
        // prime each
        hashBigIntUsingHashUnknown(BigInt(0));
        hashBigIntUsingNumberConstructor(BigInt(0));
        hashBigIntUsingNumberConstructorAndAsUintN(BigInt(0));
        hashBigIntUsingBigUint64ArrayUnlessSmall(BigInt(0));
        hashBigIntUsingBigUint64Array(BigInt(0));
        hashBigIntUsingWasm(BigInt(0));
        hashBigIntUsingWasmUnlessSmall(BigInt(0));
        hashBigIntUsingNativeHashBigInt(BigInt(0));
    });

    afterAll(() => {
        randomNumbers = undefined!;
    });

    it(`same hash`, () => {
        const value = randomNumbers[Math.floor(Math.random() * SAMPLE_SIZE)];
        const expected = hashBigIntUsingNumberConstructor(value);
        expect(hashBigIntUsingNumberConstructorAndAsUintN(value)).toBe(expected);
        expect(hashBigIntUsingBigUint64ArrayUnlessSmall(value)).toBe(expected);
    });

    it(`hash ${SAMPLE_SIZE} bigints`, async () => {
        await expect(null).benchmark({
            [hashBigIntUsingNumberConstructor.name]() {
                const f = hashBigIntUsingNumberConstructor;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingNumberConstructorAndAsUintN.name]() {
                const f = hashBigIntUsingNumberConstructorAndAsUintN;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingBigUint64ArrayUnlessSmall.name]() {
                const f = hashBigIntUsingBigUint64ArrayUnlessSmall;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingWasm.name]() {
                const f = hashBigIntUsingWasm;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingWasmUnlessSmall.name]() {
                const f = hashBigIntUsingWasmUnlessSmall;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingNativeHashBigInt.name]() {
                const f = hashBigIntUsingNativeHashBigInt;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingHashUnknown.name]() {
                const f = hashBigIntUsingHashUnknown;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            }
        });
    });
});
