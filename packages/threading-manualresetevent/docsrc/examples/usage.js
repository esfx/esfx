const { ManualResetEvent } = require("@esfx/threading-manualresetevent");
const { sleep } = require("@esfx/threading-sleep");
const { Worker, isMainThread, workerData } = require("worker_threads");
const { createInterface } = require("readline");

function worker_thread() {
    const mre = new ManualResetEvent(workerData);
    let count = 0;
    while (true) {
        mre.waitOne(); // wait until signaled
        console.log(`counter: ${count++}`);
        sleep(500);
    }
}

function main() {
    const mre = new ManualResetEvent();
    const worker = new Worker(__filename, { workerData: mre.buffer, stdout: true });
    worker.stdout.pipe(process.stdout);

    console.log("Press ENTER to start counter:");
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", () => {
        if (mre.isSet) {
            mre.reset();
            console.log("Press ENTER to start counter:");
        }
        else {
            console.log("Press ENTER to stop counter:");
            mre.set();
        }
    });
}

if (isMainThread) {
    main();
}
else {
    worker_thread();
}