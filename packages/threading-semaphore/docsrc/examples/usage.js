const { Semaphore } = require("@esfx/threading-semaphore");
const { Worker, isMainThread, workerData } = require("worker_threads");

function worker_thread() {
    const sem = new Semaphore(workerData[0]);

    while (true) {
        // wait until the thread can enter the semaphore
        sem.wait();

        // do work inside the semaphore...

        // release this worker's spot
        sem.release();

        // do work outside the semaphore...
    }
}

function main() {
    // create a semaphore that allows 5 workers to enter at once
    const sem = new Semaphore(5);

    // start 10 workers
    for (let i = 0; i < 10; i++) {
        new Worker(__filename, { workerData: [sem.buffer] });
    }
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}