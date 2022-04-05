const { toAsyncOrderedIterable } = require("@esfx/async-iter-ordered-fromsync");

async function f(source) {
    const asyncIterable = toAsyncOrderedIterable(source);
    // ...
}
