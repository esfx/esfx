const { toAsyncIterable } = require("@esfx/async-iter-fromsync");

async function f(source) {
    const asyncIterable = toAsyncIterable(source);
    // ...
}
