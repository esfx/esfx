import { IntegerIndexedObject } from "..";

describe("samples", () => {
    interface Person { id: number, name: string }

    const alice: Person = { id: 1, name: "Alice" };
    const bob: Person = { id: 2, name: "Bob" };
    const claire: Person = { id: 3, name: "Claire" };

    function isIndex(value: number) {
        return typeof value === "number"
            && !isNaN(value)
            && isFinite(value)
            && !Object.is(value, -0)
            && Math.floor(value) === value
            && value >= 0;
    }

    // example of a collection class
    class Collection<T> extends IntegerIndexedObject<T> {
        private _items: T[];

        constructor(items: T[] = []) {
            super();
            this._items = items;
        }

        get size() {
            return this._items.length;
        }

        has(value: T) {
            return this._items.includes(value);
        }

        indexOf(value: T) {
            return this._items.indexOf(value);
        }

        add(value: T) {
            this.insertIndex(this._items.length, value);
            return this;
        }

        insert(index: number, value: T) {
            this.insertIndex(index, value);
            return this;
        }

        delete(value: T) {
            const index = this._items.indexOf(value);
            return index >= 0 && this.deleteIndex(index);
        }

        deleteAt(index: number) {
            return this.deleteIndex(index);
        }

        clear() {
            if (Object.isFrozen(this)) throw new TypeError();
            this._items.length = 0;
        }

        protected getLength() {
            return this._items.length;
        }

        protected getIndex(index: number) {
            if (!isIndex(index)) throw new TypeError();
            if (index >= this._items.length) throw new RangeError();
            return this._items[index];
        }

        protected insertIndex(index: number, value: T) {
            if (!Object.isExtensible(this)) throw new TypeError();
            if (!isIndex(index)) throw new TypeError();
            if (index > this._items.length) throw new RangeError();
            if (index === this._items.length) this._items.push(value);
            else this._items.splice(index, 0, value);
            return true;
        }

        protected setIndex(index: number, value: T) {
            if (!Object.isExtensible(this)) throw new TypeError();
            if (!isIndex(index)) throw new TypeError();
            if (index >= this._items.length) throw new RangeError();
            this._items[index] = value;
            return true;
        }

        protected deleteIndex(index: number) {
            if (!Object.isExtensible(this)) throw new TypeError();
            if (!isIndex(index)) throw new TypeError();
            if (index >= this._items.length) return false;
            if (index === 0) this._items.shift();
            else if (index === this._items.length - 1) this._items.pop();
            else this._items.splice(index, 1);
            return true;
        }
    }

    describe("Collection", () => {
        it("constructor", () => {
            const items0: Person[] = [];
            const col0 = new Collection(items0);
            expect(col0.size).toBe(0);
            
            const items1: Person[] = [alice];
            const col1 = new Collection(items1);
            expect(col1.size).toBe(1);
        });
        it("add", () => {
            const items: Person[] = [];
            const col = new Collection(items);
            col.add(alice);
            expect(items.length).toBe(1);
            expect(items[0]).toBe(alice);
        });
        it("insert", () => {
            const items: Person[] = [alice, bob];
            const col = new Collection(items);
            col.insert(1, claire);
            expect(items.length).toBe(3);
            expect(items).toEqual([alice, claire, bob]);
        });
        it("set", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            col[0] = bob;
            expect(col.size).toBe(1);
            expect(items[0]).toBe(bob);
        });
        it("get", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            expect(col[0]).toBe(alice);
        });
        it("has", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            expect(col.has(alice)).toBe(true);
            expect(col.has(bob)).toBe(false);
        });
        it("indexOf", () => {
            const items: Person[] = [alice, bob];
            const col = new Collection(items);
            expect(col.indexOf(alice)).toBe(0);
            expect(col.indexOf(bob)).toBe(1);
            expect(col.indexOf(claire)).toBe(-1);
        });
        it("delete", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            expect(col.delete(alice)).toBe(true);
            expect(col.delete(bob)).toBe(false);
            expect(items.length).toBe(0);
        });
        it("deleteAt", () => {
            const items: Person[] = [alice, bob];
            const col = new Collection(items);
            expect(col.deleteAt(0)).toBe(true);
            expect(items.length).toBe(1);
            expect(items[0]).toBe(bob);
        });
        it("clear", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            expect(col.clear()).toBeUndefined();
            expect(items.length).toBe(0);
        });
        it("in (operator)", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            expect(0 in col).toBe(true);
            expect(1 in col).toBe(false);
        });
        it("delete (operator)", () => {
            const items: Person[] = [alice];
            const col = new Collection(items);
            delete col[0];
            expect(items.length).toBe(0);
        });
    })

    // Example of a keyed collection
    abstract class KeyedCollection<K, V> extends Collection<V> {
        private _map = new Map<K, V>();

        hasKey(key: K) {
            return this._map.has(key);
        }

        get(key: K) {
            return this._map.get(key);
        }

        deleteKey(key: K) {
            return this._map.has(key) && this.delete(this._map.get(key)!);
        }

        clear() {
            super.clear();
            this._map.clear();
        }

        protected insertIndex(index: number, value: V) {
            if (!Object.isExtensible(this)) throw new TypeError();
            const key = this.getKey(value);
            if (this._map.has(key)) throw new RangeError();
            if (super.insertIndex(index, value)) {
                this._map.set(key, value);
                return true;
            }
            return false;
        }

        protected setIndex(index: number, value: V) {
            if (!Object.isExtensible(this)) throw new TypeError();
            if (!isIndex(index)) throw new TypeError();
            const length = this.getLength();
            if (index >= length) throw new RangeError();

            const key = this.getKey(value);
            const existingKey = this.getKey(this.getIndex(index));
            if (Object.is(key, existingKey)) {
                if (super.setIndex(index, value)) {
                    this._map.set(key, value);
                    return true;
                }
            }
            else {
                if (this._map.has(key)) throw new RangeError();
                if (super.setIndex(index, value)) {
                    this._map.delete(existingKey);
                    this._map.set(key, value);
                    return true;
                }
            }

            return false;
        }

        protected deleteIndex(index: number) {
            if (!Object.isExtensible(this)) throw new TypeError();
            const existingValue = this.getIndex(index);
            const existingKey = this.getKey(existingValue);
            if (super.deleteIndex(index)) {
                this._map.delete(existingKey);
                return true;
            }
            return false;
        }

        abstract getKey(value: V): K;
    }

    describe("KeyedCollection", () => {
        class PersonCollection extends KeyedCollection<number, Person> {
            getKey(person: Person) { return person.id; }
        }
        it("constructor", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            expect(col.size).toBe(0);
            expect(map.size).toBe(0);
            expect(items.length).toBe(0);
        })
        it("add", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            col.add(alice);
            expect(col.size).toBe(1);
            expect(map.size).toBe(1);
            expect(map.get(alice.id)).toBe(alice);
            expect(items.length).toBe(1);
            expect(items[0]).toBe(alice);
        });
        it("insert", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            col.add(alice);
            col.add(bob);
            col.insert(1, claire);
            expect(col.size).toBe(3);
            expect(map.size).toBe(3);
            expect(map.get(alice.id)).toBe(alice);
            expect(map.get(bob.id)).toBe(bob);
            expect(map.get(claire.id)).toBe(claire);
            expect(items.length).toBe(3);
            expect(items[0]).toBe(alice);
            expect(items[1]).toBe(claire);
            expect(items[2]).toBe(bob);
        });
        it("set", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            col.add(alice);
            col[0] = bob;
            expect(col.size).toBe(1);
            expect(map.size).toBe(1);
            expect(map.has(alice.id)).toBe(false);
            expect(map.get(bob.id)).toBe(bob);
            expect(items.length).toBe(1);
            expect(items[0]).toBe(bob);
        });
        it("hasKey", () => {
            const col = new PersonCollection();
            col.add(alice);
            expect(col.hasKey(alice.id)).toBe(true);
            expect(col.hasKey(bob.id)).toBe(false);
        });
        it("delete", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            col.add(alice);
            expect(col.delete(alice)).toBe(true);
            expect(col.delete(bob)).toBe(false);
            expect(col.size).toBe(0);
            expect(map.size).toBe(0);
            expect(items.length).toBe(0);
        });
        it("deleteKey", () => {
            const col = new PersonCollection(), map = col["_map"], items = col["_items"];
            col.add(alice);
            expect(col.deleteKey(alice.id)).toBe(true);
            expect(col.deleteKey(bob.id)).toBe(false);
            expect(col.size).toBe(0);
            expect(map.size).toBe(0);
            expect(items.length).toBe(0);
        });
    });
});
