import { CancelToken } from "@esfx/canceltoken";
import { CancelError, Cancelable } from "@esfx/cancelable";
import { AsyncAutoResetEvent } from "..";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("ctor", () => {
    it("start signaled", async () => {
        const event = new AsyncAutoResetEvent(true);
        async function waitForEvent() {
            await event.wait();
            return 1;
        }
        async function waitForDelay() {
            await delay(10);
            return 2;
        }
        const result = await Promise.race([waitForEvent(), waitForDelay()]);
        expect(result).toBe(1);
    });
    it("start signaled and reset", async () => {
        const event = new AsyncAutoResetEvent(true);
        event.reset();

        async function waitForEvent() {
            await event.wait();
            return 1;
        }
        async function waitForDelay() {
            await delay(10);
            return 2;
        }

        const result = await Promise.race([waitForEvent(), waitForDelay()]);
        expect(result).toBe(2);
    });
    it("throws if initialState not boolean", () => {
        expect(() => new AsyncAutoResetEvent(<any>{})).toThrow(TypeError);
    });
});

describe("wait", () => {
    it("when canceled later", async () => {
        const event = new AsyncAutoResetEvent();
        const source = CancelToken.source();
        const waitPromise = event.wait(source.token);
        source.cancel();
        await expect(waitPromise).rejects.toThrow(CancelError);
    });
    it("when canceled after set", async () => {
        const event = new AsyncAutoResetEvent();
        const source = CancelToken.source();
        const waitPromise = event.wait(source.token);
        event.set();
        source.cancel();
        await waitPromise;
    });
    it("throws if token not CancellationToken", async () => {
        await expect(new AsyncAutoResetEvent().wait(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws if token is canceled.", async () => {
        await expect(new AsyncAutoResetEvent().wait(Cancelable.canceled)).rejects.toThrow(CancelError);
    });
});

describe("set", () => {
    it("before waiters", async () => {
        const steps: string[] = [];
        const event = new AsyncAutoResetEvent();

        async function setEvent() {
            steps.push("set1");
            event.set();
        }

        async function waitForEvent() {
            steps.push("before wait1");
            await event.wait();
            steps.push("after wait1");
        }

        await Promise.all([setEvent(), waitForEvent()]);
        expect(steps).toEqual([
            "set1",
            "before wait1",
            "after wait1",
        ]);
    });

    it("general", async () => {
        const steps: string[] = [];
        const event = new AsyncAutoResetEvent();

        async function waitForEvent() {
            steps.push("before wait1");
            await event.wait();
            steps.push("after wait1");

            steps.push("before wait2");
            await event.wait();
            steps.push("after wait2");
        }

        async function setEvent() {
            steps.push("set1");
            event.set();

            await delay(10);

            steps.push("set2");
            event.set();
        }

        await Promise.all([waitForEvent(), setEvent()]);
        expect(steps).toEqual([
            "before wait1",
            "set1",
            "after wait1",
            "before wait2",
            "set2",
            "after wait2"]);
    });

    it("before waiters when already signaled", async () => {
        const steps: string[] = [];
        const event = new AsyncAutoResetEvent(true);

        async function setEvent() {
            steps.push("set1");
            event.set();
        }

        async function waitForEvent() {
            steps.push("before wait1");
            await event.wait();
            steps.push("after wait1");
        }

        await Promise.all([setEvent(), waitForEvent()]);
        expect(steps).toEqual([
            "set1",
            "before wait1",
            "after wait1",
        ]);
    });
});
