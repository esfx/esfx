import { AutoResetEvent } from "..";
import { Worker } from "@esfx/internal-ts-worker";

it("test", () => new Promise((resolve, reject) => {
    jest.setTimeout(10000);
    const event = new AutoResetEvent();
    const data = new Int32Array(new SharedArrayBuffer(4));
    const workerScript = `
        import { parentPort, workerData } from "worker_threads";
        import { AutoResetEvent } from "..";
        const event = new AutoResetEvent(workerData[0]);
        const data = new Int32Array(workerData[1]);
        parentPort!.postMessage(["before", Atomics.load(data, 0)]);
        event.waitOne();
        parentPort!.postMessage(["after", Atomics.load(data, 0)]);
    `;

    Atomics.store(data, 0, 100);

    let beforeCount = 0;
    let afterCount = 0;
    const onError = (e: any) => {
        try {
            for (const worker of workers) {
                worker.removeAllListeners();
                worker.terminate();
            }
        }
        finally {
            reject(e);
        }
    };

    const onMessage = ([state, value]: [string, number]) => {
        try {
            switch (state) {
                case "before":
                    beforeCount++;
                    expect(value).toBe(100);
                    if (beforeCount === 2) {
                        Atomics.store(data, 0, 200);
                        event.set();
                    }
                    break;
                case "after":
                    afterCount++;
                    if (afterCount === 1) {
                        expect(value).toBe(200);
                        Atomics.store(data, 0, 300);
                        event.set();
                    }
                    else if (afterCount === 2) {
                        expect(value).toBe(300);
                        resolve();
                    }
                    break;
            }
        }
        catch (e) {
            onError(e);
        }
    };

    const workers: Worker[] = [];
    for (let i = 0; i < 2; i++) {
        const worker = new Worker(workerScript, { eval: "typescript", workerData: [event.buffer, data.buffer] });
        worker.on("message", onMessage);
        worker.on("error", onError);
    }
}));

describe("ctor", () => {
    describe("with SharedArrayBuffer", () => {
        it("throws if buffer too small", () => {
            const buffer = new SharedArrayBuffer(0);
            expect(() => new AutoResetEvent(buffer)).toThrow(/Out of range/);
        });
        it("throws if offset too large", () => {
            const buffer = new SharedArrayBuffer(4);
            expect(() => new AutoResetEvent(buffer, 4)).toThrow(/Out of range/);
        });
        it("throws if offset not aligned", () => {
            const buffer = new SharedArrayBuffer(5);
            expect(() => new AutoResetEvent(buffer, 1)).toThrow(/Not aligned/);
        });
        it("throws if bad handle", () => {
            const buffer = new SharedArrayBuffer(4);
            new DataView(buffer).setUint32(0, 1);
            expect(() => new AutoResetEvent(buffer)).toThrow(/Invalid handle/);
        });
    });
});