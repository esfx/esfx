import { Semaphore } from "..";
import { Cancelable, CancelError } from '@esfx/cancelable';

describe("semaphore", () => {
    describe("ctor", () => {
        it("throws when initialCount not number", () => expect(() => new Semaphore(<any>{})).toThrow(TypeError));
        it("throws when maxCount not number", () => expect(() => new Semaphore(0, <any>{})).toThrow(TypeError));
        it("throws when initialCount is less than zero", () => expect(() => new Semaphore(-1)).toThrow(RangeError));
        it("throws when maxCount is less than or equal to zero", () => expect(() => new Semaphore(0, 0)).toThrow(RangeError));
        it("throws when initialCount is greater than maxCount", () => expect(() => new Semaphore(2, 1)).toThrow(RangeError));
        it("sets initial count", () => expect(new Semaphore(1).count).toBe(1));
    });

    describe("wait", () => {
        it("throws when token is not Cancelable", async () => {
            await expect(new Semaphore(1).wait({} as any)).rejects.toThrow(TypeError);
        });
        it("throws when token is canceled", async () => {
            await expect(new Semaphore(1).wait(Cancelable.canceled)).rejects.toThrow(CancelError);
        });
    });

    describe("release", () => {
        it("throws when count not number", () => {
            expect(() => new Semaphore(1).release(<any>{})).toThrow(TypeError);
        });
        it("throws when count is less than or equal to zero", () => {
            expect(() => new Semaphore(1).release(0)).toThrow(RangeError);
        });
        it("throws when count greater than available count", () => {
            expect(() => new Semaphore(2, 2).release(1)).toThrow(RangeError);
        });
    });

    it("semaphore(1)", async () => {
        const steps: string[] = [];
        const semaphore = new Semaphore(1);

        async function operation1() {
            steps.push("operation1.1");
            await semaphore.wait();
            steps.push("operation1.2");
            semaphore.release();
        }

        async function operation2() {
            steps.push("operation2.1");
            await semaphore.wait();
            steps.push("operation2.2");
            semaphore.release();
        }

        await Promise.all([operation1(), operation2()]);
        expect(steps).toEqual(["operation1.1", "operation2.1", "operation1.2", "operation2.2"]);
    });

    // it("semaphore(2)", async () => {
    //     const steps: string[] = [];
    //     const semaphore = new Semaphore(2);
    //     const barrier = new Barrier(2, () => {
    //         steps.push("barrier");
    //         semaphore.release(2);
    //     });

    //     async function operation1() {
    //         steps.push("operation1.1");
    //         await semaphore.wait();
    //         steps.push("operation1.2");
    //         await barrier.signalAndWait();
    //     }

    //     async function operation2() {
    //         steps.push("operation2.1");
    //         await semaphore.wait();
    //         steps.push("operation2.2");
    //         await barrier.signalAndWait();
    //     }

    //     async function operation3() {
    //         steps.push("operation3.1");
    //         await semaphore.wait();
    //         steps.push("operation3.2");
    //         semaphore.release();
    //     }

    //     await Promise.all([operation1(), operation2(), operation3()]);
    //     assert.deepEqual([
    //         "operation1.1",
    //         "operation2.1",
    //         "operation3.1",
    //         "operation1.2",
    //         "operation2.2",
    //         "barrier",
    //         "operation3.2"
    //     ], steps);
    // });
});