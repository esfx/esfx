import { hashUnknown as hashUnknownNative } from "#hashCodeNative";
import { randomInt } from "crypto";
import { generateRandomStrings, SAMPLE_SIZE } from "./data/randomStrings";
import { hashStringUsingMarvin32WithDataView } from "./scenarios/hashString/hashStringUsingMarvin32WithDataView";
import { hashStringUsingMarvin32WithDataViewReuseBuffer } from "./scenarios/hashString/hashStringUsingMarvin32WithDataViewReuseBuffer";
import { hashStringUsingMarvin32WithTypedArray } from "./scenarios/hashString/hashStringUsingMarvin32WithTypedArray";
import { hashStringUsingMarvin32WithTypedArrayReuseBuffer } from "./scenarios/hashString/hashStringUsingMarvin32WithTypedArrayReuseBuffer";
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
    hashStringUsingMarvin32WithTypedArray("");
    hashStringUsingMarvin32WithTypedArrayReuseBuffer("");
    hashStringUsingMarvin32WithDataView("");
    hashStringUsingMarvin32WithDataViewReuseBuffer("");
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

it(hashStringUsingMarvin32WithTypedArray.name, () => {
    expect(() => hashStringUsingMarvin32WithTypedArray(randomString)).not.toThrow();
});

it(hashStringUsingMarvin32WithTypedArrayReuseBuffer.name, () => {
    expect(() => hashStringUsingMarvin32WithTypedArrayReuseBuffer(randomString)).not.toThrow();
});

it(hashStringUsingMarvin32WithDataView.name, () => {
    expect(() => hashStringUsingMarvin32WithDataView(randomString)).not.toThrow();
});

it(hashStringUsingMarvin32WithDataViewReuseBuffer.name, () => {
    expect(() => hashStringUsingMarvin32WithDataViewReuseBuffer(randomString)).not.toThrow();
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
        [hashStringUsingMarvin32WithTypedArray.name]() {
            const f = hashStringUsingMarvin32WithTypedArray;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMarvin32WithTypedArrayReuseBuffer.name]() {
            const f = hashStringUsingMarvin32WithTypedArrayReuseBuffer;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMarvin32WithDataView.name]() {
            const f = hashStringUsingMarvin32WithDataView;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomStrings[i]);
            }
        },
        [hashStringUsingMarvin32WithDataViewReuseBuffer.name]() {
            const f = hashStringUsingMarvin32WithDataViewReuseBuffer;
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