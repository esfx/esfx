import { Mutex } from "@esfx/threading-mutex";
import { StructType, int32 } from "@esfx/struct-type";
import { sleep } from "@esfx/threading-sleep";
import { Worker, isMainThread, workerData } from "worker_threads";

const SharedData = StructType([
    { name: "x", type: int32 },
    { name: "y", type: int32 },
] as const);

function worker_thread() {
    const m = new Mutex(workerData[0]);
    const data = new SharedData(workerData[1]);

    while (true) {
        sleep(250);

        m.lock();
        try {
            // inside of the lock we can mutate 'data' without
            // main() seeing a partial update.
            data.x++;
            data.y--;
        }
        finally {
            m.unlock();
        }
    }
}

function main() {
    const m = new Mutex();
    const data = new SharedData(/*shared*/ true);
    const worker = new Worker(__filename, { workerData: [m.buffer, data.buffer] });

    while (true) {
        sleep(500);

        m.lock();
        try {
            // inside of the lock, we know that we can safely read
            // both 'x' and 'y' and the worker will not modify
            // either value until we unlock.
            console.log(`x: ${data.x}, y: ${data.y}`);
        }
        finally {
            m.unlock();
        }
    }
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}