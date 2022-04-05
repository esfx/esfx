const { OrderedIterable } = require("@esfx/iter-ordered");
const { Comparer } = require("@esfx/equatable");

class BooksOrderedIterable {
    #books;
    #orderBy;

    constructor(books, orderBy) {
        this.#books = books;
        this.#orderBy = orderBy;
    }

    static orderBy(books, keySelector, keyComparer, descending) {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksOrderedIterable(books, [{ keySelector, keyComparer, descending }]);
    }

    [OrderedIterable.thenBy](keySelector, keyComparer, descending) {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksOrderedIterable(this.#books, [...this.#orderBy, { keySelector, keyComparer, descending }]);
    }

    * [Symbol.iterator]() {
        const books = [...this.#books];
        books.sort((a, b) => {
            for (const { keySelector, keyComparer, descending } of this.#orderBy) {
                const aKey = keySelector(a);
                const bKey = keySelector(b);
                const result = descending ? keyComparer.compare(bKey, aKey) : keyComparer.compare(aKey, bKey);
                if (result !== 0) return result;
            }
            return 0;
        });
        yield * books.values();
    }
}