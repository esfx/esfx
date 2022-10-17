import { jest } from "@jest/globals";
import { generateRandomNumbers, SAMPLE_SIZE } from "./data/randomNumbers.js";
import { hashNumberUsingDataViewAlways, hashNumberUsingDataViewUnlessInt32OrUint32 } from "./scenarios/hashNumber/hashNumberUsingDataView.js";
import { hashNumberUsingFloat64ArrayAlways, hashNumberUsingFloat64ArrayUnlessInt32OrUint32 } from "./scenarios/hashNumber/hashNumberUsingFloat64Array.js";
import { hashNumberUsingHashUnknown } from "./scenarios/hashNumber/hashNumberUsingHashUnknown.js";
import { hashNumberUsingNativeHashNumber } from "./scenarios/hashNumber/hashNumberUsingNative.js";
import { hashNumberUsingWasm, hashNumberUsingWasmAsFloat, hashNumberUsingWasmUnlessInt32 } from "./scenarios/hashNumber/hashNumberUsingWasm.js";

describe('hashNumber', () => {
    jest.setTimeout(10_000_000);

    let randomNumbers: Float64Array;
    beforeAll(() => {
        randomNumbers = generateRandomNumbers();
        // prime each
        hashNumberUsingHashUnknown(0);
        hashNumberUsingDataViewAlways(0);
        hashNumberUsingDataViewUnlessInt32OrUint32(0);
        hashNumberUsingFloat64ArrayAlways(0);
        hashNumberUsingFloat64ArrayUnlessInt32OrUint32(0);
        hashNumberUsingWasm(0);
        hashNumberUsingWasmAsFloat(0);
        hashNumberUsingWasmUnlessInt32(0);
        hashNumberUsingNativeHashNumber(0);
    });

    afterAll(() => {
        randomNumbers = undefined!;
    });

    it(`hash ${SAMPLE_SIZE} numbers`, async () => {
        await expect(null).benchmark({
            [hashNumberUsingDataViewAlways.name]() {
                const f = hashNumberUsingDataViewAlways;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingDataViewUnlessInt32OrUint32.name]() {
                const f = hashNumberUsingDataViewUnlessInt32OrUint32;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingFloat64ArrayAlways.name]() {
                const f = hashNumberUsingFloat64ArrayAlways;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingFloat64ArrayUnlessInt32OrUint32.name]() {
                const f = hashNumberUsingFloat64ArrayUnlessInt32OrUint32;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingWasm.name]() {
                const f = hashNumberUsingWasm;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingWasmAsFloat.name]() {
                const f = hashNumberUsingWasmAsFloat;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingWasmUnlessInt32.name]() {
                const f = hashNumberUsingWasmUnlessInt32;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingNativeHashNumber.name]() {
                const f = hashNumberUsingNativeHashNumber;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashNumberUsingHashUnknown.name]() {
                const f = hashNumberUsingHashUnknown;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
        });
    });
});