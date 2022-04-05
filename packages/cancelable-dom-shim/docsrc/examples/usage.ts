import "@esfx/cancelable-dom-shim"; // triggers global-scope side effects
import { Cancelable } from "@esfx/cancelable";

const abortController = new AbortController();
const signal = abortController[Cancelable.cancelSignal]();
