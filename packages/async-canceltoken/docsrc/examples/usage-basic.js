// <usage>
const { CancelToken, CancelError } = require("@esfx/async-canceltoken");

// consume a cancel token
async function doWork(token = CancelToken.none) {
    // do some work
    await doSomeOtherWork(token);

    // throw an error if cancellation has been signaled since awaiting.
    token.throwIfSignaled();
}

function doSomeOtherWork(token = CancelToken.none) {
    return new Promise((resolve, reject) => {
        token.throwIfSignaled(); // throw if cancellation has already been signaled.

        // setup some external async operation...
        const worker = createWorker();

        // listen for cancellation and abort the worker.
        const subscription = token.subscribe(() => {
            worker.abort();
            reject(new CancelError());
        });
        
        // start working, resolve when done
        worker.start(resolve);
    });
}

// call an async function that supports cancellation
const source = CancelToken.source();
doWork(source.token).then(
    () => {
        // operation completed...
        source.close();
    },
    err => {
        if (err instanceof CancelError) {
            // operation was canceled..
        }
    });

// cancel operation after 10 seconds
setTimeout(() => source.cancel(), 1000 * 10);
// </usage>
