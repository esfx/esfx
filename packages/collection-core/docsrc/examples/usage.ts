import { Collection } from "@esfx/collection-core";

class MyCollection<T> {
    private _items = new Set<T>();

    // Your implementation
    get count() {
        return this._items.size;
    }

    contains(value: T) {
        return this._items.has(value);
    }

    add(value: T) {
        this._items.add(value);
    }

    remove(value: T) {
        return this._items.delete(value);
    }

    clear() {
        this._items.clear();
    }

    // Implement the `Collection` interface for cross-library consistency
    get [Collection.size]() { return this.count; }
    [Collection.has](value: T) { return this.contains(value); }
    [Collection.add](value: T) { this.add(value); }
    [Collection.delete](value: T) { return this.remove(value); }
    [Collection.clear]() { this.clear(); }
    [Symbol.iterator]() { return this._items.values(); }
}
