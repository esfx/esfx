const { Mutex } = require("@esfx/threading-mutex");
const { ConditionVariable } = require("@esfx/threading-conditionvariable");
const { StructType, int32 } = require("@esfx/struct-type");
const { Worker, isMainThread, workerData } = require("worker_threads");

const SharedData = StructType([
    { name: "ready", type: int32 },
    { name: "processed", type: int32 },
]);

function worker_thread() {
    const m = new Mutex(workerData[0]);
    const cv = new ConditionVariable(workerData[1]);
    const data = new SharedData(workerData[2]);

    m.lock();
    try {
        // release the lock and wait until main() sends data
        cv.wait(m, () => data.ready === 1);

        // after waiting we once again own the lock
        console.log("worker thread is processing data");

        // send data back to main()
        data.processed = 1;
        console.log("worker thread is done");
    }
    finally {
        m.unlock();
    }

    cv.notifyOne();
}

function main() {
    const m = new Mutex();
    const cv = new ConditionVariable();
    const data = new SharedData(/*shared*/ true);

    // start the Worker, passing the buffers of the shared objects
    const worker = new Worker(__filename, {
        workerData: [m.buffer, cv.buffer, data.buffer],
        stdout: true,
    });

    // pipe stdout for console.log in worker
    worker.stdout.pipe(process.stdout);

    // send data to the worker
    m.lock();
    try {
        data.ready = 1;
        console.log("main is ready");
    }
    finally {
        m.unlock();
    }

    // notify the waiting worker
    cv.notifyOne();

    m.lock();
    try {
        // release the lock and wait for the worker to finish processing
        cv.wait(m, () => data.processed === 1);
    }
    finally {
        m.unlock();
    }
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}