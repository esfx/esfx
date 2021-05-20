import { SAMPLE_SIZE, generateRandomNumbers } from "./data/randomNumbers";
import { hashNumberByTypeUsingDataView } from "./scenarios/hashNumber/hashNumberByTypeUsingDataView";
import { hashNumberByTypeUsingTypedArray } from "./scenarios/hashNumber/hashNumberByTypeUsingTypedArray";
import { hashNumberByFloat64DataViewOnly } from "./scenarios/hashNumber/hashNumberByFloat64DataViewOnly";
import { hashNumberByFloat64TypedArrayOnly } from "./scenarios/hashNumber/hashNumberByFloat64TypedArrayOnly";
import { hashNumberByTypeExperiment1, hashNumberByTypeExperiment2, hashNumberByTypeExperiment3 } from "./scenarios/hashNumber/hashNumberByTypeExperiments";

jest.setTimeout(10_000_000);

let randomNumbers: Float64Array;
beforeAll(() => {
    randomNumbers = generateRandomNumbers();
    // prime each
    hashNumberByTypeUsingDataView(0);
    hashNumberByTypeUsingTypedArray(0);
    hashNumberByFloat64DataViewOnly(0);
    hashNumberByFloat64TypedArrayOnly(0);
    hashNumberByTypeExperiment1(0);
    hashNumberByTypeExperiment2(0);
    hashNumberByTypeExperiment3(0);
    afterAll(() => { randomNumbers = undefined!; });
});

it(`hash ${SAMPLE_SIZE} numbers`, async () => {
    await expect(null).benchmark({
        [hashNumberByTypeUsingDataView.name]() {
            const f = hashNumberByTypeUsingDataView;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByTypeUsingTypedArray.name]() {
            const f = hashNumberByTypeUsingTypedArray;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByFloat64DataViewOnly.name]() {
            const f = hashNumberByFloat64DataViewOnly;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByFloat64TypedArrayOnly.name]() {
            const f = hashNumberByFloat64TypedArrayOnly;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByTypeExperiment1.name]() {
            const f = hashNumberByTypeExperiment1;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByTypeExperiment2.name]() {
            const f = hashNumberByTypeExperiment2;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
        [hashNumberByTypeExperiment3.name]() {
            const f = hashNumberByTypeExperiment3;
            for (let i = 0; i < SAMPLE_SIZE; i++) {
                f(randomNumbers[i]);
            }
        },
    });
});