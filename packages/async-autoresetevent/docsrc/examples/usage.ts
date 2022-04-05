import { AsyncAutoResetEvent } from "@esfx/async-autoresetevent";

const event = new AsyncAutoResetEvent();

async function doSomeActivity() {
    while (true) {
        // do some work asynchronously...

        // indicate 'waitForActivity' can resume. Event is immediately reset to
        // the signaled state.
        event.set();
    }
}

async function waitForActivity() {
    while (true) {
        // wait for 'doSomeActivity' to set the event...
        await event.wait();

        // do something asynchronous...
    }
}

doSomeActivity();
waitForActivity();