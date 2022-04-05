import { OrderedIterable } from "@esfx/iter-ordered";
import { Comparer, Comparison } from "@esfx/equatable";

interface Book {
    title: string;
    isbn: string;
    // ...
}

class BooksOrderedIterable implements OrderedIterable<Book> {
    private _books: Iterable<Book>;
    private _orderBy: readonly { keySelector: (element: Book) => unknown, keyComparer: Comparer<unknown>, descending: boolean }[];

    private constructor(books: Iterable<Book>, orderBy: readonly { keySelector: (element: Book) => unknown, keyComparer: Comparer<unknown>, descending: boolean }[]) {
        this._books = books;
        this._orderBy = orderBy;
    }

    static orderBy<K>(books: Iterable<Book>, keySelector: (element: Book) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedIterable<Book> {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksOrderedIterable(books, [{ keySelector, keyComparer, descending }]);
    }

    [OrderedIterable.thenBy]<K>(keySelector: (element: Book) => K, keyComparer: Comparison<K> | Comparer<K>, descending: boolean): OrderedIterable<Book> {
        if (typeof keyComparer === "function") keyComparer = Comparer.create(keyComparer);
        return new BooksOrderedIterable(this._books, [...this._orderBy, { keySelector, keyComparer, descending }]);
    }

    * [Symbol.iterator]() {
        const books = [...this._books];
        books.sort((a, b) => {
            for (const { keySelector, keyComparer, descending } of this._orderBy) {
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