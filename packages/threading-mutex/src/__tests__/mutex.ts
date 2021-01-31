import { Worker } from "@esfx/internal-ts-worker";
import { Mutex } from '..';

it("lock/unlock", () => new Promise<void>((resolve, reject) => {
    // NOTE: We need to give adequate time here for ts-node to parse/evaulate the dependency
    // graph.
    jest.setTimeout(20000);
    const mutex = new Mutex(true);
    const data = new Int32Array(new SharedArrayBuffer(4));
    const workerScript = `
        import { parentPort, workerData } from "worker_threads";
        import { Mutex } from "..";
        const mutex = new Mutex(workerData[0]);
        const data = new Int32Array(workerData[1]);
        parentPort!.postMessage(["beforeLock", Atomics.load(data, 0)]);
        mutex.lock();
        parentPort!.postMessage(["afterLock", Atomics.load(data, 0)]);
        Atomics.store(data, 0, 200);
        mutex.unlock();
    `;
    const worker = new Worker(workerScript, { eval: "typescript", workerData: [mutex.buffer, data.buffer] });
    const onError = (e: any) => {
        try {
            worker.removeAllListeners();
            worker.terminate();
        }
        finally {
            reject(e);
        }
    };
    const onMessage = ([state, value]: [string, number]) => {
        try {
            switch (state) {
                case "beforeLock":
                    expect(value).toBe(0);
                    Atomics.store(data, 0, 100);
                    mutex.unlock();
                    break;
                case "afterLock":
                    expect(value).toBe(100);
                    mutex.lock();
                    expect(Atomics.load(data, 0)).toBe(200);
                    mutex.unlock();
                    resolve();
                    break;
            }
        }
        catch (e) {
            onError(e);
        }
    };
    worker.on("message", onMessage);
    worker.on("error", onError);
}));

describe("ctor", () => {
    describe("with SharedArrayBuffer", () => {
        it("throws if buffer too small", () => {
            const buffer = new SharedArrayBuffer(0);
            expect(() => new Mutex(buffer)).toThrow(/Out of range/);
        });
        it("throws if offset too large", () => {
            const buffer = new SharedArrayBuffer(4);
            expect(() => new Mutex(buffer, 4)).toThrow(/Out of range/);
        });
        it("throws if offset not aligned", () => {
            const buffer = new SharedArrayBuffer(5);
            expect(() => new Mutex(buffer, 1)).toThrow(/Not aligned/);
        });
        it("throws if bad handle", () => {
            const buffer = new SharedArrayBuffer(4);
            new DataView(buffer).setUint32(0, 1);
            expect(() => new Mutex(buffer)).toThrow(/Invalid handle/);
        });
    });
});