import { Mutex } from "..";
import { Cancelable, CancelError } from "@esfx/cancelable";

describe("lock", () => {
    it("throws when token is not Cancelable", async () => {
        await expect(new Mutex().lock({} as any)).rejects.toThrow(TypeError);
    });
    it("throws when token is canceled", async () => {
        await expect(new Mutex().lock(Cancelable.canceled)).rejects.toThrow(CancelError);
    });
});

it("AsyncLock()", async () => {
    const steps: string[] = [];
    const lock = new Mutex();

    async function operation1() {
        steps.push("operation1.1");
        await lock.lock();
        steps.push("operation1.2");
        lock.unlock();
    }

    async function operation2() {
        steps.push("operation2.1");
        await lock.lock();
        steps.push("operation2.2");
        lock.unlock();
    }

    await Promise.all([operation1(), operation2()]);
    expect(steps).toEqual(["operation1.1", "operation2.1", "operation1.2", "operation2.2"]);
});
