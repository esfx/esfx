import { SpinWait } from "@esfx/threading-spinwait";
import { StructType, int32 } from "@esfx/struct-type";
import { Worker, isMainThread, workerData } from "worker_threads";

const SharedData = StructType([
    { name: "ready", type: int32 },
] as const);

function worker_thread() {
    const data = new SharedData(workerData);

    // do some long running process...

    // signal that the work has completed.
    data.ready = 1;
}

function main() {
    const data = new SharedData(/*shared*/ true);
    const worker = new Worker(__filename, { workerData: data.buffer });

    // start spinning until the condition is met.
    // this results in the thread sleeping periodically
    // while it waits for the condition.
    const spinWait = new SpinWait();
    spinWait.spinUntil(() => data.ready === 1);
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}