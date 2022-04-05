const { AsyncCountdownEvent } = require("@esfx/async-countdown");

async function main() {
    // create an AsyncCountdownEvent with 4 participants
    const countdown = new AsyncCountdownEvent(4);
    
    const worker = async () => {
        // dome some work async...

        // signal completion
        countdown.signal();
    }

    // start 4 workers
    worker();
    worker();
    worker();
    worker();

    // wait for all 4 workers to signal completion...
    await countdown.wait();
}

main().catch(e => console.error(e));
