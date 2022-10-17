import { jest } from "@jest/globals";
import { randomInt } from "crypto";
import { generateRandomStrings, SAMPLE_SIZE } from "./data/randomStrings";
import { hashStringUsingHashUnknown } from "./scenarios/hashString/hashStringUsingHashUnknown";
import { hashStringUsingNativeHashString } from "./scenarios/hashString/hashStringUsingNative";
import { hashStringWithMurmur3UsingDataView, hashStringWithMurmur3UsingDataViewReuseBuffer } from "./scenarios/hashString/hashStringWithMurmur3UsingDataView";
import { hashStringWithMurmur3UsingTypedArray, hashStringWithMurmur3UsingTypedArrayReuseBuffer } from "./scenarios/hashString/hashStringWithMurmur3UsingTypedArray";
import { hashStringWithXXHash32UsingJs } from "./scenarios/hashString/hashStringWithXXHash32UsingJs";
import { hashStringWithXXHash64UsingJs } from "./scenarios/hashString/hashStringWithXXHash64UsingJs";
import { hashStringWithXXHash64UsingWasm } from "./scenarios/hashString/hashStringWithXXHash64UsingWasm";

describe('hashString', () => {
    jest.setTimeout(10_000_000);

    let randomStrings: string[];
    let randomString: string;

    beforeAll(async () => {
        randomStrings = generateRandomStrings();
        randomString = randomStrings[randomInt(randomStrings.length - 1)];

        // prime each
        hashStringUsingHashUnknown("");
        hashStringWithMurmur3UsingDataView("");
        hashStringWithMurmur3UsingDataViewReuseBuffer("");
        hashStringWithMurmur3UsingTypedArray("");
        hashStringWithMurmur3UsingTypedArrayReuseBuffer("");
        hashStringUsingNativeHashString("");
        hashStringWithXXHash64UsingJs("");
        hashStringWithXXHash32UsingJs("");
        hashStringWithXXHash64UsingWasm("");
    });

    afterAll(() => {
        randomStrings = undefined!;
        randomString = undefined!;
    });

    it(hashStringWithMurmur3UsingDataView.name, () => {
        expect(() => hashStringWithMurmur3UsingDataView(randomString)).not.toThrow();
    });

    it(hashStringWithMurmur3UsingDataViewReuseBuffer.name, () => {
        expect(() => hashStringWithMurmur3UsingDataViewReuseBuffer(randomString)).not.toThrow();
    });

    it(hashStringWithMurmur3UsingTypedArray.name, () => {
        expect(() => hashStringWithMurmur3UsingTypedArray(randomString)).not.toThrow();
    });

    it(hashStringWithMurmur3UsingTypedArrayReuseBuffer.name, () => {
        expect(() => hashStringWithMurmur3UsingTypedArrayReuseBuffer(randomString)).not.toThrow();
    });

    it(hashStringUsingNativeHashString.name, () => {
        expect(() => hashStringUsingNativeHashString(randomString)).not.toThrow();
    });

    it(hashStringWithXXHash64UsingJs.name, () => {
        expect(() => hashStringWithXXHash64UsingJs(randomString)).not.toThrow();
    });

    it(hashStringWithXXHash64UsingWasm.name, () => {
        expect(() => hashStringWithXXHash64UsingWasm(randomString)).not.toThrow();
    });

    it(hashStringWithXXHash32UsingJs.name, () => {
        expect(() => hashStringWithXXHash32UsingJs(randomString)).not.toThrow();
    });

    it("same hash", () => {
        const h1 = hashStringWithXXHash64UsingWasm(randomString);
        const h2 = hashStringWithXXHash64UsingJs(randomString);
        expect(h1).toBe(h2);
    });

    it(`hash ${SAMPLE_SIZE} strings`, async () => {
        await expect(null).benchmark({
            [hashStringWithMurmur3UsingDataView.name]() {
                const f = hashStringWithMurmur3UsingDataView;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithMurmur3UsingDataViewReuseBuffer.name]() {
                const f = hashStringWithMurmur3UsingDataViewReuseBuffer;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithMurmur3UsingTypedArray.name]() {
                const f = hashStringWithMurmur3UsingTypedArray;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithMurmur3UsingTypedArrayReuseBuffer.name]() {
                const f = hashStringWithMurmur3UsingTypedArrayReuseBuffer;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithXXHash64UsingWasm.name]() {
                const f = hashStringWithXXHash64UsingWasm;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithXXHash64UsingJs.name]() {
                const f = hashStringWithXXHash64UsingJs;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringWithXXHash32UsingJs.name]() {
                const f = hashStringWithXXHash32UsingJs;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringUsingNativeHashString.name]() {
                const f = hashStringUsingNativeHashString;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
            [hashStringUsingHashUnknown.name]() {
                const f = hashStringUsingHashUnknown;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    f(randomStrings[i]);
                }
            },
        });
    });
});