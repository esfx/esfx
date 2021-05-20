import { SAMPLE_SIZE, generateRandomBigInts } from "./data/randomBigInts";
import { hashBigIntUsingNumberConstructor, hashBigIntUsingNumberConstructorAndAsUintN } from "./scenarios/hashBigInt/hashBigIntUsingNumberConstructor";
import { hashBigIntUsingBigUint64Array, hashBigIntUsingBigUint64ArrayAndAsUintN } from "./scenarios/hashBigInt/hashBigIntUsingBigUint64Array";

jest.setTimeout(10_000_000);

describe("hashBigInt", () => {

    let randomNumbers: bigint[];
    beforeAll(() => {
        randomNumbers = generateRandomBigInts();
        // prime each
        hashBigIntUsingNumberConstructor(BigInt(0));
        hashBigIntUsingBigUint64Array(BigInt(0));
        afterAll(() => { randomNumbers = undefined!; });
    });

    it(`same hash`, () => {
        const value = randomNumbers[Math.floor(Math.random() * SAMPLE_SIZE)];
        const expected = hashBigIntUsingNumberConstructor(value);
        expect(hashBigIntUsingNumberConstructorAndAsUintN(value)).toBe(expected);
        expect(hashBigIntUsingBigUint64Array(value)).toBe(expected);
        expect(hashBigIntUsingBigUint64ArrayAndAsUintN(value)).toBe(expected);
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
            [hashBigIntUsingBigUint64Array.name]() {
                const f = hashBigIntUsingBigUint64Array;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
            [hashBigIntUsingBigUint64ArrayAndAsUintN.name]() {
                const f = hashBigIntUsingBigUint64ArrayAndAsUintN;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomNumbers[i]);
                }
            },
        });
    });
});
