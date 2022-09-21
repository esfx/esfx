import { jest } from "@jest/globals";
import { hashUnknown as hashUnknownNative } from "#hashCodeNative";
import { randomInt } from "crypto";
import { generateRandomStrings, SAMPLE_SIZE } from "./data/randomStrings";
import { hashStringUsingMurmur3WithDataView } from "./scenarios/hashString/hashStringUsingMurmur3WithDataView";
import { hashStringUsingMurmur3WithDataViewReuseBuffer } from "./scenarios/hashString/hashStringUsingMurmur3WithDataViewReuseBuffer";
import { hashStringUsingMurmur3WithTypedArray } from "./scenarios/hashString/hashStringUsingMurmur3WithTypedArray";
import { hashStringUsingMurmur3WithTypedArrayReuseBuffer } from "./scenarios/hashString/hashStringUsingMurmur3WithTypedArrayReuseBuffer";

jest.setTimeout(10_000_000);

let randomStrings: string[];
let randomString: string;
beforeAll(() => {
    randomStrings = generateRandomStrings();
    randomString = randomStrings[randomInt(randomStrings.length - 1)];
    // prime each
    hashStringUsingMurmur3WithDataView("");
    hashStringUsingMurmur3WithDataViewReuseBuffer("");
    hashStringUsingMurmur3WithTypedArray("");
    hashStringUsingMurmur3WithTypedArrayReuseBuffer("");
    hashUnknownNative("");
    afterAll(() => { randomStrings = undefined!; });
});

it(hashStringUsingMurmur3WithDataView.name, () => {
    expect(() => hashStringUsingMurmur3WithDataView(randomString)).not.toThrow();
});

it(hashStringUsingMurmur3WithDataViewReuseBuffer.name, () => {
    expect(() => hashStringUsingMurmur3WithDataViewReuseBuffer(randomString)).not.toThrow();
});

it(hashStringUsingMurmur3WithTypedArray.name, () => {
    expect(() => hashStringUsingMurmur3WithTypedArray(randomString)).not.toThrow();
});

it(hashStringUsingMurmur3WithTypedArrayReuseBuffer.name, () => {
    expect(() => hashStringUsingMurmur3WithTypedArrayReuseBuffer(randomString)).not.toThrow();
});

it("hashUnknownNative", () => {
    expect(() => hashUnknownNative(randomString)).not.toThrow();
});

it(`hash ${SAMPLE_SIZE} numbers`, async () => {
    await expect(null).benchmark({
        [hashStringUsingMurmur3WithDataView.name]() {
            const f = hashStringUsingMurmur3WithDataView;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMurmur3WithDataViewReuseBuffer.name]() {
            const f = hashStringUsingMurmur3WithDataViewReuseBuffer;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMurmur3WithTypedArray.name]() {
            const f = hashStringUsingMurmur3WithTypedArray;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMurmur3WithTypedArrayReuseBuffer.name]() {
            const f = hashStringUsingMurmur3WithTypedArrayReuseBuffer;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        hashUnknownNative() {
            const f = hashUnknownNative;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
    });
});