// <usage>
import { AsyncSemaphore } from "@esfx/async-semaphore";

// create a semaphore that allows one participant
const semaphore = new AsyncSemaphore(1);

async function updateResource(updates: UpdateObject) {
    // Wait for a lock on the semaphore
    await semaphore.wait();
    try {
        // Between the 'wait' above and the 'release' below,
        // this function has exclusive access to a resource...

        // Await something async, allowing other logic to 
        // execute. If some other event/timer/etc. calls
        // 'updateResource' before this async operation
        // finishes, they will be blocked at the 'wait' above.
        await doSomethingAsync();

        // We still have exclusive access even after resuming,
        // so we can continue to use our exclusive access.
    }
    finally {
        // Release the semaphore. The next waiter will
        // be unblocked and will have the lock instead.
        semaphore.release();
    }
}
// </usage>

declare class UpdateObject {}
declare var doSomethingAsync;