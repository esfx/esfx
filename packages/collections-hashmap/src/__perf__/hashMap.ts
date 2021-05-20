import { HashMap } from "..";

jest.setTimeout(10_000_000);

const SAMPLE_SIZE = 10_000;
const SAMPLE_SCALE = 10_000_000;
const PERCENT_NEGATIVE = 0.10;
const PERCENT_UINT32 = [0, 0.15] as const;
const PERCENT_INT32 = [0.15, 0.30] as const;

let randomNumbers: Float64Array;
beforeAll(() => {
    randomNumbers = new Float64Array(SAMPLE_SIZE);
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        let value = Math.random() * SAMPLE_SCALE;
        const pType = Math.random();
        if (pType >= PERCENT_UINT32[0] && pType < PERCENT_UINT32[1]) {
            value >>>= 0;
        }
        else {
            const pNegative = Math.random();
            if (pNegative < PERCENT_NEGATIVE) {
                value = -value;
            }
            if (pType >= PERCENT_INT32[0] && pType < PERCENT_INT32[1]) {
                value >>= 0;
            }
        }
        randomNumbers[i] = value;
    }
    afterAll(() => {
        randomNumbers = undefined!;
    });
});

it(`add ${SAMPLE_SIZE} numbers`, async () => {
    await expect(null).benchmark({
        "HashMap"() {
            const map = new HashMap();
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                map.set(randomNumbers[i], i);
            }
        },
        "Map"() {
            const map = new Map();
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                map.set(randomNumbers[i], i);
            }
        }
    });
});