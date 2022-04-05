import type { Cancelable } from "@esfx/cancelable";
import { toAbortSignal } from "@esfx/cancelable-dom";

async function doSomeWork(cancelable: Cancelable) {
    await fetch("some/uri", { signal: toAbortSignal(cancelable) });
}
