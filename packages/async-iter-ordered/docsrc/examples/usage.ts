import { AsyncOrderedIterable } from "@esfx/async-iter-ordered";
import { Comparer, Comparison } from "@esfx/equatable";
import { toArrayAsync } from "@esfx/async-iter-fn";

interface Book {
    title: string;
    isbn: string;
    // ...
}

class BooksAsyncOrderedIterable implements AsyncOrderedIterable<Book> {
    private _books: AsyncIterable<Book>;
    private _orderBy: readonly { keySelector: (element: Book) => unknown, keyComparer: Comparer<unknown>, descending: boolean }[];

    private constructor(books: AsyncIterable<Book>, orderBy: readonly { keySelector: (element: Book) => unknown, keyComparer: Comparer<unknown>, descending: boolean }[]) {
        this._books = books;
        this._orderBy = orderBy;
    }

    static orderBy<K>(books: AsyncIterable<Book>, keySelector: (element: Book) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedIterable<Book> {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksAsyncOrderedIterable(books, [{ keySelector, keyComparer, descending }]);
    }

    [AsyncOrderedIterable.thenByAsync]<K>(keySelector: (element: Book) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): AsyncOrderedIterable<Book> {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksAsyncOrderedIterable(this._books, [...this._orderBy, { keySelector, keyComparer, descending }]);
    }

    async * [Symbol.asyncIterator]() {
        const books = await toArrayAsync(this._books);
        books.sort((a, b) => {
            for (const { keySelector, keyComparer, descending } of this._orderBy) {
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