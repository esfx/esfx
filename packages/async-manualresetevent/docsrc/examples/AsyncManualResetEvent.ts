import { AsyncManualResetEvent } from "@esfx/async-manualresetevent";
import { delay } from "@esfx/async-delay";
import * as readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text: string) => new Promise<string>(resolve => rl.question(text, resolve));

const evt = new AsyncManualResetEvent();

async function main() {
    console.log(`Starting three operations that will pause while waiting for the event.`);

    let promises: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
        promises.push(asyncOperation(`operation #${i + 1}`));
    }

    await delay(500);
    await question(`When all three operations have started, press Enter to release them.`);

    evt.set();

    await delay(500);
    await Promise.all(promises);

    console.log(`When the event is signaled, operations will not pause.`);
    await question(`Press Enter to demonstrate.`);

    promises = [];
    for (let i = 3; i < 4; i++) {
        promises.push(asyncOperation(`operation #${i + 1}`));
    }

    await delay(500);
    await Promise.all(promises);

    console.log(`When the event is reset, operations will again pause.`);
    await question(`Press Enter to demonstrate.`);

    evt.reset();

    promises = [];
    promises.push(asyncOperation("operation #5"));

    await delay(500);
    await question(`Press Enter to signal the event and conclude the demonstration.`);
    
    evt.set();

    await Promise.all(promises);
}

async function asyncOperation(name: string) {
    console.log(`${name} is waiting on the event.`);
    await evt.wait();
    console.log(`${name} was released from the event.`);
}

await main();