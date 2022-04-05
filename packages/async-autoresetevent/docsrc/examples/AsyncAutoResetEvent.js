const { AsyncAutoResetEvent } = require("@esfx/async-autoresetevent");
const { delay } = require("@esfx/async-delay");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(resolve => rl.question(text, resolve));

const first = new AsyncAutoResetEvent(/*initialState*/ true);
const second = new AsyncAutoResetEvent(/*initialState*/ false);

async function main() {
    await question(`Press Enter to start three asynchronous operations.`);

    const promises = [];
    for (let i = 0; i < 3; i++) {
        promises.push(asyncOperation(`operation #${i + 1}`));
    }

    await delay(250);

    for (let i = 0; i < 2; i++) {
        await question(`Press Enter to release an operation.`);
        first.set();
        await delay(250);
    }

    console.log("All operations are now waiting on the second event.");

    for (let i = 0; i < 3; i++) {
        await question(`Press Enter to release an operation.`);
        second.set();
        await delay(250);
    }

    await Promise.all(promises);
}

async function asyncOperation(name) {
    console.log(`${name} is waiting on the first event.`);
    await first.wait();
    console.log(`${name} was released from the first event.`);

    console.log(`${name} is waiting on the second event.`);
    await second.wait();
    console.log(`${name} was released from the second event.`);

    console.log(`${name} is complete.`);
}

main().catch(e => {
    console.error(e);
    process.exit(-1);
});