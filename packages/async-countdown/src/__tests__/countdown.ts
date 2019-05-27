import { AsyncCountdownEvent } from "..";
import { AsyncManualResetEvent } from '@esfx/async-manualresetevent';

describe("ctor", () => {
    it("throws if initialCount not number", () => {
        expect(() => new AsyncCountdownEvent(<any>{})).toThrow(TypeError);
    });
    it("throws if initialCount less than zero", () => {
        expect(() => new AsyncCountdownEvent(-1)).toThrow(RangeError);
    });
});
describe("add", () => {
    it("throws if count not number", () => {
        expect(() => new AsyncCountdownEvent(1).add(<any>{})).toThrow(TypeError);
    });
    it("throws if count less than or equal to zero", () => {
        expect(() => new AsyncCountdownEvent(1).add(0)).toThrow(RangeError);
    });
    it("throws if already signaled", () => {
        expect(() => new AsyncCountdownEvent(0).add(1)).toThrow(Error);
    });
    it("for count = 1", async () => {
        const steps: string[] = [];
        const event = new AsyncManualResetEvent();
        const countdown = new AsyncCountdownEvent(2);
        async function waiter() {
            steps.push("before wait");
            await countdown.wait();
            steps.push("after wait");
        }
        async function operation1() {
            await event.wait();
            steps.push("operation1");
            countdown.signal();
        }
        async function operation2() {
            await event.wait();
            steps.push("operation2");
            countdown.add();
        }
        async function operation3() {
            await event.wait();
            await Promise.resolve();
            steps.push("operation3");
            countdown.signal();
        }
        async function operation4() {
            await event.wait();
            await Promise.resolve();
            steps.push("operation4");
            countdown.signal();
        }
        async function start() {
            event.set();
        }

        await Promise.all([waiter(), operation1(), operation2(), operation3(), operation4(), start()]);
        expect(steps).toEqual([
            "before wait",
            "operation1",
            "operation2",
            "operation3",
            "operation4",
            "after wait"
        ]);
    });
});
describe("reset", () => {
    it("throws if count not number", () => {
        expect(() => new AsyncCountdownEvent(1).reset(<any>{})).toThrow(TypeError);
    });
    it("throws if count less than zero", () => {
        expect(() => new AsyncCountdownEvent(1).reset(-1)).toThrow(RangeError);
    });
    it("changes initial count", () => {
        const countdown = new AsyncCountdownEvent(1);
        countdown.reset(3);
        expect(countdown.initialCount).toBe(3);
        expect(countdown.remainingCount).toBe(3);
    });
    it("restores initial count", () => {
        const countdown = new AsyncCountdownEvent(3);
        countdown.signal(1);
        countdown.reset();
        expect(countdown.initialCount).toBe(3);
        expect(countdown.remainingCount).toBe(3);
    });
});
describe("signal", () => {
    it("throws if count not number", () => {
        expect(() => new AsyncCountdownEvent(1).signal(<any>{})).toThrow(TypeError);
    });
    it("throws if count less than or equal to zero", () => {
        expect(() => new AsyncCountdownEvent(1).signal(0)).toThrow(RangeError);
    });
    it("throws if count greater than remaining count", () => {
        expect(() => new AsyncCountdownEvent(0).add(1)).toThrow(Error);
    });
    it("for count = 1", async () => {
        const steps: string[] = [];
        const event = new AsyncManualResetEvent();
        const countdown = new AsyncCountdownEvent(3);
        async function waiter() {
            steps.push("before wait");
            await countdown.wait();
            steps.push("after wait");
        }
        async function operation1() {
            await event.wait();
            steps.push("operation1");
            countdown.signal();
        }
        async function operation2() {
            await event.wait();
            steps.push("operation2");
            countdown.signal();
        }
        async function operation3() {
            await event.wait();
            steps.push("operation3");
            countdown.signal();
        }
        async function start() {
            event.set();
        }

        await Promise.all([waiter(), operation1(), operation2(), operation3(), start()]);
        expect(steps).toEqual([
            "before wait",
            "operation1",
            "operation2",
            "operation3",
            "after wait"
        ]);
    });
    it("for count = 2", async () => {
        const steps: string[] = [];
        const event = new AsyncManualResetEvent();
        const countdown = new AsyncCountdownEvent(3);
        async function waiter() {
            steps.push("before wait");
            await countdown.wait();
            steps.push("after wait");
        }
        async function operation1() {
            await event.wait();
            steps.push("operation1");
            countdown.signal(2);
        }
        async function operation2() {
            await event.wait();
            steps.push("operation2");
            countdown.signal();
        }
        async function start() {
            event.set();
        }

        await Promise.all([waiter(), operation1(), operation2(), start()]);
        expect(steps).toEqual([
            "before wait",
            "operation1",
            "operation2",
            "after wait"
        ]);
    });
});
