import { toAsyncIterable } from "@esfx/async-iter-fromsync";

async function f<T>(source: AsyncIterable<T> | Iterable<T | PromiseLike<T>>) {
    const asyncIterable = toAsyncIterable(source);
    // ...
}
