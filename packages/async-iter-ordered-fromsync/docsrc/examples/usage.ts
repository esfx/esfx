import { toAsyncOrderedIterable } from "@esfx/async-iter-ordered-fromsync";
import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { OrderedIterable } from "@esfx/iter-ordered";

async function f<T>(source: AsyncOrderedIterable<T> | OrderedIterable<T | PromiseLike<T>>) {
    const asyncIterable = toAsyncOrderedIterable(source);
    // ...
}
