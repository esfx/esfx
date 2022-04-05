import { createInterface } from "readline";
import { AutoResetEvent } from "@esfx/threading-autoresetevent";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

function worker_thread() {
    const workerReadyEvent = new AutoResetEvent(workerData[0]);
    const continueEvent = new AutoResetEvent(workerData[1]);

    // signal the main thread we are ready
    workerReadyEvent.set();

    let count = 0;
    while (true) {
        // wait for the main thread to set 'continueEvent'
        continueEvent.waitOne();
        parentPort.postMessage(`counter=${count++}`);
    }
}

function main() {
    // create two AutoResetEvents in the main thread
    const workerReadyEvent = new AutoResetEvent();
    const continueEvent = new AutoResetEvent();

    // create a Worker, passing the buffers of the two events
    const worker = new Worker(__filename, {
        workerData: [workerReadyEvent.buffer, continueEvent.buffer]
    });

    // wait for the worker to tell us it is ready
    workerReadyEvent.waitOne();

    console.log("worker is ready. Press ENTER to continue the worker...");
    worker.on("message", message => {
        console.log(`worker says: ${message}`);
    });

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", () => {
        // event is automatically reset as soon as a single waiter is signaled
        continueEvent.set();
    });
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}