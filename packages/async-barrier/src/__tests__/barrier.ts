import { CancelToken } from '@esfx/async-canceltoken';
import { CancelError, Cancelable } from '@esfx/cancelable';
import { AsyncBarrier } from "..";

describe("ctor", () => {
    it("correct", () => {
        const barrier = new AsyncBarrier(1);
        expect(barrier.currentPhaseNumber).toBe(0);
        expect(barrier.participantCount).toBe(1);
        expect(barrier.remainingParticipants).toBe(1);
    });
    it("throws if participantCount not number", () => {
        expect(() => new AsyncBarrier(<any>{})).toThrow(TypeError);
    });
    it("throws if participantCount less than zero", () => {
        expect(() => new AsyncBarrier(-1)).toThrow(RangeError);
    });
    it("throws if postPhaseAction not function", () => {
        expect(() => new AsyncBarrier(1, <any>{})).toThrow(TypeError);
    });
});
describe("add", () => {
    it("one", () => {
        const barrier = new AsyncBarrier(1);
        barrier.add();
        expect(barrier.participantCount).toBe(2);
        expect(barrier.remainingParticipants).toBe(2);
    });
    it("multiple", () => {
        const barrier = new AsyncBarrier(1);
        barrier.add(3);
        expect(barrier.participantCount).toBe(4);
        expect(barrier.remainingParticipants).toBe(4);
    });
    it("throws if participantCount not number", () => {
        expect(() => new AsyncBarrier(1).add(<any>{})).toThrow(TypeError);
    });
    it("throws if participantCount less than or equal to zero", () => {
        expect(() => new AsyncBarrier(1).add(0)).toThrow(RangeError);
    });
    // it("throws if executing post phase action", async () => {
    //     const queue = new AsyncQueue<void>();
    //     const barrier = new Barrier(1, barrier => {
    //         queue.put(assert.throwsAsync(() => barrier.add(1)));
    //     });
    //     await barrier.signalAndWait();
    //     await queue.get();
    // });
});
describe("remove", () => {
    it("one", () => {
        const barrier = new AsyncBarrier(1);
        barrier.remove();
        expect(barrier.participantCount).toBe(0);
        expect(barrier.remainingParticipants).toBe(0);
    });
    it("multiple", () => {
        const barrier = new AsyncBarrier(4);
        barrier.remove(3);
        expect(barrier.participantCount).toBe(1);
        expect(barrier.remainingParticipants).toBe(1);
    });
    it("throws if participantCount not number", () => {
        expect(() => new AsyncBarrier(1).remove(<any>{})).toThrow(TypeError);
    });
    it("throws if participantCount less than or equal to zero", () => {
        expect(() => new AsyncBarrier(1).remove(0)).toThrow(RangeError);
    });
    it("throws if participantCount greater than initial participants", () => {
        expect(() => new AsyncBarrier(1).remove(2)).toThrow(RangeError);
    });
    // it("throws if executing post phase action", async () => {
    //     const queue = new AsyncQueue<void>();
    //     const barrier = new Barrier(1, barrier => {
    //         queue.put(assert.throwsAsync(() => barrier.remove(1)));
    //     });
    //     await barrier.signalAndWait();
    //     await queue.get();
    // });
});
describe("signalAndWait", () => {
    it("throws if token is not CancellationToken", async () => {
        await expect(new AsyncBarrier(1).signalAndWait(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws if token is canceled", async () => {
        await expect(new AsyncBarrier(1).signalAndWait(Cancelable.canceled)).rejects.toThrow(CancelError);
    });
    it("throws if token is later", async () => {
        const barrier = new AsyncBarrier(2);
        const source = CancelToken.source();
        const waitPromise = barrier.signalAndWait(source.token);
        source.cancel();
        await barrier.signalAndWait();
        await expect(waitPromise).rejects.toThrow(CancelError);
    });
    // it("throws if executing post phase action", async () => {
    //     const queue = new AsyncQueue<void>();
    //     const barrier = new Barrier(1, barrier => {
    //         queue.put(assert.throwsAsync(() => barrier.signalAndWait(), Error));
    //     });
    //     await barrier.signalAndWait();
    //     await queue.get();
    // });
    it("throws if no registered participants", async () => {
        await expect(new AsyncBarrier(0).signalAndWait()).rejects.toThrow(Error);
    });
    it("throws if no remaining participants", async () => {
        const barrier = new AsyncBarrier(1);
        barrier.signalAndWait();
        await expect(barrier.signalAndWait()).rejects.toThrow(Error);
    });
    it("with 3 participants", async () => {
        const steps: string[] = [];
        const barrier = new AsyncBarrier(3);

        async function operation1() {
            steps.push("begin1");
            await barrier.signalAndWait();
            steps.push("end1");
        }

        async function operation2() {
            steps.push("begin2");
            await barrier.signalAndWait();
            steps.push("end2");
        }

        async function operation3() {
            steps.push("begin3");
            await barrier.signalAndWait();
            steps.push("end3");
        }

        await Promise.all([operation1(), operation2(), operation3()]);
        expect(steps).toEqual(["begin1", "begin2", "begin3", "end1", "end2", "end3"]);
    });
    it("error in postPhaseAction raised to participant", async () => {
        const barrier = new AsyncBarrier(1, () => { throw new Error(); });
        await expect(barrier.signalAndWait()).rejects.toThrow();
    });
});

it("postPhaseAction", async () => {
    const steps: string[] = [];
    const barrier = new AsyncBarrier(1, () => {
        steps.push("post-phase");
    });

    async function phases() {
        steps.push("phase1");
        await barrier.signalAndWait();
        steps.push("phase2");
        await barrier.signalAndWait();
        steps.push("phase3");
    }

    await phases();
    expect(steps).toEqual(["phase1", "post-phase", "phase2", "post-phase", "phase3"]);
});
it("participants", async () => {
    const steps: string[] = [];
    const barrier = new AsyncBarrier(1);
    async function one() {
        steps.push("one.1");
        await barrier.signalAndWait();
        steps.push("one.2");
        barrier.add(1);
        await Promise.all([twoa(), twob()]);
        steps.push("one.3");
        barrier.remove(1);
        await barrier.signalAndWait();
        steps.push("one.4");
    }
    async function twoa() {
        steps.push("two.a.1");
        await barrier.signalAndWait();
        steps.push("two.a.2");
    }
    async function twob() {
        steps.push("two.b.1");
        await barrier.signalAndWait();
        steps.push("two.b.2");
    }
    await one();
    expect(steps).toEqual([
        "one.1",
        "one.2",
        "two.a.1",
        "two.b.1",
        "two.a.2",
        "two.b.2",
        "one.3",
        "one.4"
    ]);
});