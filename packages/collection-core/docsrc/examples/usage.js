const { Collection } = require("@esfx/collection-core");

class MyCollection {
    constructor() {
        this._items = new Set();
    }

    // Your implementation
    get count() {
        return this._items.size;
    }

    contains(value) {
        return this._items.has(value);
    }

    add(value) {
        this._items.add(value);
    }

    remove(value) {
        return this._items.delete(value);
    }

    clear() {
        this._items.clear();
    }

    // Implement the `Collection` interface for cross-library consistency
    get [Collection.size]() { return this.count; }
    [Collection.has](value) { return this.contains(value); }
    [Collection.add](value) { this.add(value); }
    [Collection.delete](value) { return this.remove(value); }
    [Collection.clear]() { this.clear(); }
    [Symbol.iterator]() { return this._items.values(); }
}