const { AsyncOrderedIterable } = require("@esfx/async-iter-ordered");
const { Comparer } = require("@esfx/equatable");
const { toArrayAsync } = require("@esfx/async-iter-fn");

class BooksAsyncOrderedIterable {
    #books;
    #orderBy;

    /** @private */
    constructor(books, orderBy) {
        this.#books = books;
        this.#orderBy = orderBy;
    }

    static orderBy(books, keySelector, descending) {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksAsyncOrderedIterable(books, [{ keySelector, keyComparer, descending }]);
    }

    [AsyncOrderedIterable.thenByAsync](keySelector, keyComparer, descending) {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksAsyncOrderedIterable(this.#books, [...this.#orderBy, { keySelector, keyComparer, descending }]);
    }

    async * [Symbol.asyncIterator]() {
        const books = await toArrayAsync(this.#books);
        books.sort((a, b) => {
            for (const { keySelector, keyComparer, descending } of this.#orderBy) {
                const aKey = keySelector(a);
                const bKey = keySelector(b);
                const result = descending ? keyComparer.compare(bKey, aKey) : keyComparer.compare(aKey, bKey);
                if (result !== 0) return result;
            }
            return 0;
        });
        yield* books.values();
    }
}