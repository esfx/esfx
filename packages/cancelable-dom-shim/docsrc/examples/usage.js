require("@esfx/cancelable-dom-shim"); // triggers global-scope side effects
const { Cancelable } = require("@esfx/cancelable");

const abortController = new AbortController();
const signal = abortController[Cancelable.cancelSignal]();
