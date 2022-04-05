const { WaitQueue } = require("@esfx/async-waitqueue");

async function main() {
    const queue = new WaitQueue();

    // Create two pending "waiters" in the queue
    const p1 = queue.wait();
    const p2 = queue.wait();

    // Resolve the two pending "waiters" in the queue
    queue.resolveOne(1);
    queue.resolveOne(Promise.resolve(2));

    await p1; // 1
    await p2; // 2
}
