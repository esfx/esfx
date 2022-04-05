import { StructType, int32 } from "@esfx/struct-type";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

const ThreadData = StructType([
    { name: "itemsRemaining", type: int32 },
] as const);

function worker_thread() {
    // this is running in a background worker...
    const data = new ThreadData(workerData); // allocate struct using the SharedArrayBuffer
    while (data.itemsRemaining) {
        // do some work...
        data.itemsRemaining--;
    }
    parentPort.postMessage("done");
}

function main() {
    // this is running on the main thread...
    const data = new ThreadData(/*shared*/ true); // allocate struct using a SharedArrayBuffer
    data.itemsRemaining = 5;

    const worker = new Worker(__filename, { workerData: data.buffer });
    worker.on("message", message => {
        if (message === "done") {
            console.log(data.itemsRemaining); // 0
        }
    });
}

if (isMainThread) {
    main();
}
else if (parentPort) {
    worker_thread();
}