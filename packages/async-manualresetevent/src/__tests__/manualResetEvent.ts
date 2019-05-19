import { Cancelable, CancelError } from '@esfx/cancelable';
import { ManualResetEvent } from "..";

describe("ctor", () => {
    it("throws if initialState not boolean", () => {
        expect(() => new ManualResetEvent(<any>{})).toThrow(TypeError);
    });
});

describe("wait", () => {
    it("throws if token not CancellationToken", async () => {
        await expect(new ManualResetEvent().wait(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws if token is canceled.", async () => {
        await expect(new ManualResetEvent().wait(Cancelable.canceled)).rejects.toThrow(CancelError);
    });
});

it("set", async () => {
    const steps: string[] = [];
    const event = new ManualResetEvent();

    async function waitForEvent() {
        steps.push("before wait");
        await event.wait();
        steps.push("after wait");
    }

    async function setEvent() {
        steps.push("set");
        event.set();
    }

    await Promise.all([waitForEvent(), setEvent()]);
    expect(steps).toEqual(["before wait", "set", "after wait"]);
});

it("reset", async () => {
    const steps: string[] = [];
    const event1 = new ManualResetEvent();

    async function startWaiting() {
        steps.push("before wait1");
        await event1.wait();
        steps.push("after wait1");

        steps.push("reset");
        event1.reset();

        await Promise.all([waitAgain(), setEventAgain()]);
    }

    async function setEvent() {
        steps.push("set1");
        event1.set();
    }

    async function waitAgain() {
        steps.push("before wait2");
        await event1.wait();
        steps.push("after wait2");
    }

    async function setEventAgain() {
        steps.push("set2");
        event1.set();
    }

    await Promise.all([startWaiting(), setEvent()]);

    expect(steps).toEqual([
        "before wait1",
        "set1",
        "after wait1",
        "reset",
        "before wait2",
        "set2",
        "after wait2"
    ]);
});

it("signaled", async () => {
    const steps: string[] = [];
    const event = new ManualResetEvent(/*initialState*/ true);

    async function waitForEvent() {
        steps.push("before wait");
        await event.wait();
        steps.push("after wait");
    }

    async function skipAturn() {
        steps.push("before skip");
        await Promise.resolve();
        steps.push("after skip");
    }

    await Promise.all([waitForEvent(), skipAturn()]);
    expect(steps).toEqual(["before wait", "before skip", "after wait", "after skip"]);
});