import { Worker } from "@esfx/internal-ts-worker";
import { Mutex } from "@esfx/threading-mutex";
import { ConditionVariable } from "..";

import { Record, pushStep } from "./workers/utils";

it("test", async () => {
    // NOTE: We need to give adequate time here for ts-node to parse/evaulate the dependency
    // graph.
    jest.setTimeout(20000);
    const m = new Mutex();
    const cv = new ConditionVariable();
    const data = new Record(/*shared*/ true);
    const steps = new Uint8Array(new SharedArrayBuffer(9));
    const stepID = {
        main1: 1,
        main2: 2,
        main3: 3,
        main4: 4,
        main5: 5,
        worker1: 6,
        worker2: 7,
        worker3: 8,
    } as const;
    const workerScript = `
        import { parentPort, workerData } from "worker_threads";
        import { Record, pushStep } from "./workers/utils";
        import { Mutex } from "@esfx/threading-mutex";
        import { ConditionVariable } from "..";

        const m = new Mutex(workerData[0]);
        const cv = new ConditionVariable(workerData[1]);
        const data = new Record(workerData[2]);
        const steps = new Uint8Array(workerData[3]);

        pushStep(steps, ${stepID.worker1});

        // wait until 'main' sends data
        m.lock();
        try {
            pushStep(steps, ${stepID.worker2});

            // release the lock and wait to reacquire it
            cv.wait(m, () => data.ready === 1);

            // after the 'wait', we own the lock
            pushStep(steps, ${stepID.worker3});
            data.processed = 1;
        }
        finally {
            m.unlock();
        }
        cv.notifyOne();
        
        parentPort!.postMessage(undefined);
    `;

    const worker = new Worker(workerScript, { eval: "typescript", workerData: [m.buffer, cv.buffer, data.buffer, steps.buffer] });
    
    // send data to the worker
    pushStep(steps, stepID.main1);
    m.lock();
    try {
        pushStep(steps, stepID.main2);
        data.ready = 1;
    }
    finally {
        m.unlock();
    }
    cv.notifyOne();

    // wait for the worker
    m.lock();
    try {
        pushStep(steps, stepID.main3);
        cv.wait(m, () => data.processed === 1);
        pushStep(steps, stepID.main4);
    }
    finally {
        m.unlock();
    }

    pushStep(steps, stepID.main5);

    // join the worker
    await new Promise((resolve, reject) => {
        worker.on("error", reject);
        worker.on("message", resolve);
    });

    expect([...steps.slice(1, steps[0] + 1)]).toEqual([
        stepID.main1,
        stepID.main2,
        stepID.main3,
        stepID.worker1,
        stepID.worker2,
        stepID.worker3,
        stepID.main4,
        stepID.main5,
    ]);
});