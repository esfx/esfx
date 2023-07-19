import { Cancelable, CancelableCancelSignal, CancelError, CancelSubscription } from "@esfx/cancelable";
import { delay } from "..";

const waitOne = () => new Promise(res => jest.requireActual("timers").setImmediate(res));

jest.useFakeTimers();
describe("delay(msec)", () => {
    it("rejects if msec not number", async () => {
        expect.assertions(1);
        await expect(delay({} as any)).rejects.toThrow(TypeError);
    });
    it("rejects if msec is negative", async () => {
        expect.assertions(1);
        await expect(delay(-1)).rejects.toThrow(TypeError);
    });
    it("rejects if msec is Infinity", async () => {
        expect.assertions(1);
        await expect(delay(Infinity)).rejects.toThrow(TypeError);
    });
    it("rejects if msec is NaN", async () => {
        expect.assertions(1);
        await expect(delay(NaN)).rejects.toThrow(TypeError);
    });
    it("does not resolve synchronously when msec = 0", async () => {
        expect.assertions(2);

        let delayPromiseResolved = false;
        const delayPromise = delay(0).then(() => { delayPromiseResolved = true });
        expect(delayPromiseResolved).toBe(false); // not resolved synchronously

        jest.advanceTimersByTime(1);
        await waitOne();
        expect(delayPromiseResolved).toBe(true); // resolved immediately

        await delayPromise;
    });
    it("resolves after timeout", async () => {
        expect.assertions(3);

        let delayPromiseResolved = false;
        const delayPromise = delay(100).then(() => { delayPromiseResolved = true });
        expect(delayPromiseResolved).toBe(false); // not resolved synchronously

        await waitOne();
        expect(delayPromiseResolved).toBe(false); // not resolved immediately

        jest.advanceTimersByTime(100);

        await delayPromise;
        expect(delayPromiseResolved).toBe(true); // resolved after timeout
    });
    it("resolves to undefined", async () => {
        expect.assertions(1);
        const delayPromise = delay(100);
        jest.advanceTimersByTime(100);
        await expect(delayPromise).resolves.toBeUndefined();
    });
});
describe("delay(msec, value)", () => {
    it("rejects if value is Canceable", async () => {
        const cancelable: Cancelable = { [Cancelable.cancelSignal]: jest.fn() };
        expect.assertions(1);
        await expect(delay(0, cancelable as unknown)).rejects.toThrow(TypeError);
    });
    it("resolves to value when non-promise", async () => {
        expect.assertions(1);
        const delayPromise = delay(100, 1);
        jest.advanceTimersByTime(100);
        await expect(delayPromise).resolves.toBe(1);
    });
    it("resolves to awaited value when promise", async () => {
        expect.assertions(1);
        const delayPromise = delay(100, Promise.resolve(1));
        jest.advanceTimersByTime(100);
        await expect(delayPromise).resolves.toBe(1);
    });
    it("rejects if promise value rejects", async () => {
        expect.assertions(1);
        const delayPromise = delay(100, Promise.reject("rejected"));
        jest.advanceTimersByTime(100);
        await expect(delayPromise).rejects.toBe("rejected");
    });
});
describe("delay(cancelable, msec)", () => {
    it("rejects if cancelable is canceled", async () => {
        expect.assertions(1);
        const cancelable: CancelableCancelSignal = {
            [Cancelable.cancelSignal]() { return this; },
            signaled: true,
            reason: new CancelError(),
            subscribe: jest.fn()
        };
        const delayPromise = delay(cancelable, 0);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).rejects.toBe(cancelable.reason);
    });
    it("rejects if cancelable is non-null, non-undefined, non-cancelable", async () => {
        expect.assertions(1);
        const delayPromise = delay({} as any, 0);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).rejects.toThrow(TypeError);
    });
    it("cancelable can be null", async () => {
        expect.assertions(1);
        const delayPromise = delay(null, 0);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).resolves.toBeUndefined();
    });
    it("cancelable can be undefined", async () => {
        expect.assertions(1);
        const delayPromise = delay(undefined, 0);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).resolves.toBeUndefined();
    });
    it("cancelable can Cancelable", async () => {
        expect.assertions(1);
        const subscription = CancelSubscription.create(jest.fn());
        const cancelable: CancelableCancelSignal = {
            [Cancelable.cancelSignal]() { return this; },
            signaled: false,
            reason: undefined,
            subscribe: jest.fn().mockReturnValue(subscription)
        };
        const delayPromise = delay(cancelable, 0);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).resolves.toBeUndefined();
    });
    it("subscribes to Cancelable", async () => {
        expect.assertions(1);
        const subscription = CancelSubscription.create(jest.fn());
        const cancelable: CancelableCancelSignal = {
            [Cancelable.cancelSignal]() { return this; },
            signaled: false,
            reason: undefined,
            subscribe: jest.fn().mockReturnValue(subscription)
        };
        delay(cancelable, 0);
        expect(cancelable.subscribe).toHaveBeenCalled();
    });
    it("unsubscribes from Cancelable subscription on resolve", async () => {
        expect.assertions(1);
        const unsubscribe = jest.fn();
        const subscription = CancelSubscription.create(unsubscribe);
        const cancelable: CancelableCancelSignal = {
            [Cancelable.cancelSignal]() { return this; },
            signaled: false,
            reason: undefined,
            subscribe: jest.fn().mockReturnValue(subscription)
        };
        const delayPromise = delay(cancelable, 0);
        jest.advanceTimersByTime(0);
        await delayPromise;
        expect(unsubscribe).toHaveBeenCalled();
    });
    it("rejects if Cancelable is signaled after start", async () => {
        expect.assertions(1);
        let onSignaled!: () => void;
        let signaled = false;
        let reason: unknown = undefined;
        const unsubscribe = jest.fn();
        const subscription = CancelSubscription.create(unsubscribe);
        const cancelable: CancelableCancelSignal = {
            [Cancelable.cancelSignal]() { return this; },
            get signaled() { return signaled; },
            get reason() { return reason; },
            subscribe: (cb) => (onSignaled = cb, subscription),
        };
        const delayPromise = delay(cancelable, 0);
        signaled = true;
        reason = new CancelError();
        onSignaled();
        await expect(delayPromise).rejects.toThrow(CancelError);
    });
});
describe("delay(cancelable, msec, value)", () => {
    it("does not reject if value is Canceable", async () => {
        expect.assertions(1);
        const cancelable: Cancelable = { [Cancelable.cancelSignal]: jest.fn() };
        const delayPromise = delay(undefined, 0, cancelable);
        jest.advanceTimersByTime(0);
        await expect(delayPromise).resolves.toBe(cancelable);
    });
});
