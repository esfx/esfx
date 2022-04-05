// <usage>
const { AsyncMutex } = require("@esfx/async-mutex");

const m = new AsyncMutex();
let counter = 0;

async function worker() {
    for (let i = 0; i < 3; i++) {
        // get exclusive access to 'm', which protects 'counter'.
        const lk = await m.lock();
        try {
            const current = counter;

            await doSomethingElse();

            // we still have exclusive access to 'm', which protects 'counter'.
            counter = current + 1;
        }
        finally {
            // release the lock
            lk.unlock();
        }
    }
}

async function doSomethingElse() { /*...*/ }

async function main() {
    // start two workers that share a resource
    await Promise.all([worker(), worker()]);

    counter; // 6
}

// </usage>

main().catch(e => console.error(e));