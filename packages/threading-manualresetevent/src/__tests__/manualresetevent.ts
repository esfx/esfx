import { jest } from "@jest/globals";
import { ManualResetEvent } from "..";
import { Worker } from "@esfx/internal-ts-worker";

const itCjsOnly = typeof __dirname === "string" ? it : it.skip;

itCjsOnly("test", () => new Promise<void>((resolve, reject) => {
    // NOTE: We need to give adequate time here for ts-node to parse/evaulate the dependency
    // graph.
    jest.setTimeout(30000);
    const event = new ManualResetEvent();
    const data = new Int32Array(new SharedArrayBuffer(4));
    const workerScript = `
        import { parentPort, workerData } from "worker_threads";
        import { ManualResetEvent } from "..";
        const event = new ManualResetEvent(workerData[0]);
        const data = new Int32Array(workerData[1]);
        const id = workerData[2];
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
                    expect(value).toBe(100);
                    beforeCount++;
                    if (beforeCount === 2) {
                        Atomics.store(data, 0, 200);
                        event.set();
                    }
                    break;
                case "after":
                    expect(value).toBe(200);
                    afterCount++;
                    if (afterCount === 2) {
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
        const worker = new Worker(workerScript, { eval: "typescript", workerData: [event.buffer, data.buffer, i] });
        worker.on("message", onMessage);
        worker.on("error", onError);
    }
}));

describe("ctor", () => {
    describe("with SharedArrayBuffer", () => {
        it("throws if buffer too small", () => {
            const buffer = new SharedArrayBuffer(0);
            expect(() => new ManualResetEvent(buffer)).toThrow(/Out of range/);
        });
        it("throws if offset too large", () => {
            const buffer = new SharedArrayBuffer(4);
            expect(() => new ManualResetEvent(buffer, 4)).toThrow(/Out of range/);
        });
        it("throws if offset not aligned", () => {
            const buffer = new SharedArrayBuffer(5);
            expect(() => new ManualResetEvent(buffer, 1)).toThrow(/Not aligned/);
        });
        it("throws if bad handle", () => {
            const buffer = new SharedArrayBuffer(4);
            new DataView(buffer).setUint32(0, 1);
            expect(() => new ManualResetEvent(buffer)).toThrow(/Invalid handle/);
        });
    });
});