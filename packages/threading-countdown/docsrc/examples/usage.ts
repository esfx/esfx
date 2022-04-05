import { CountdownEvent } from "@esfx/threading-countdown";
import { Worker, isMainThread, workerData } from "worker_threads";

function worker_thread() {
    const countdown = new CountdownEvent(workerData);

    // do work in background...

    // signal worker is finished
    countdown.signal();
}

function main() {
    const countdown = new CountdownEvent(5);

    // start 5 workers
    for (let i = 0; i < 5; i++) {
        new Worker(__filename, { workerData: countdown.buffer });
    }

    // wait for the workers to finish
    countdown.wait();
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}