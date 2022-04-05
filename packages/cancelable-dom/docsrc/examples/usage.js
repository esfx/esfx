const { toAbortSignal } = require("@esfx/cancelable-dom");

async function doSomeWork(cancelable) {
    await fetch("some/uri", { signal: toAbortSignal(cancelable) });
}
