import { AsyncConditionVariable } from "..";
import { AsyncMutex } from "@esfx/async-mutex";

describe("wait", () => {
    it("wait one", async () => {
        const m = new AsyncMutex();
        const cv = new AsyncConditionVariable();
        let ready = false;
        let processed = false;
        const steps: string[] = [];

        const worker = async () => {
            steps.push("worker1");

            // Wait until 'main' sends data
            {
                const lk = await m.lock();
                try {
                    steps.push("worker2");

                    // release the lock and wait to reacquire it.
                    await cv.wait(lk, () => ready);

                    // After the 'wait', we own the lock
                    steps.push("worker3");
                    processed = true;
                }
                finally {
                    lk.unlock();
                }
            }
            cv.notifyOne();
        };

        const main = async () => {
            steps.push("main1");
            const p = worker();

            // send data to the worker
            {
                const lk = await m.lock();
                try {
                    steps.push("main2");
                    ready = true;
                }
                finally {
                    lk.unlock();
                }
            }
            cv.notifyOne();

            // wait for the worker
            {
                const lk = await m.lock();
                try {
                    steps.push("main3");
                    await cv.wait(lk, () => processed);
                    steps.push("main4");
                }
                finally {
                    lk.unlock();
                }
            }

            // join the worker
            await p;
            steps.push("main5");
        };

        await main();
        expect(steps).toEqual([
            "main1",
            "worker1",
            "worker2",
            "main2",
            "worker3",
            "main3",
            "main4",
            "main5"
        ]);
    });
});
