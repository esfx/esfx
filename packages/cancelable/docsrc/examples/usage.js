const { Cancelable } = require("@esfx/cancelable");
const { fork } = require("child_process");

function doSomeWork(cancelable) {
    return new Promise((resolve, reject) => {
        const cancelSignal = cancelable[Cancelable.cancelSignal]();
        if (cancelSignal.signaled) throw new Error("Operation canceled.");

        const worker = fork("worker.js");
        const subscription = cancelSignal.subscribe(() => {
            // cancellation requested, abort worker
            worker.kill();
            reject(new Error("Operation canceled."));
        });

        worker.on("exit", () => {
            subscription.unsubscribe();
            resolve();
        });
    });
}