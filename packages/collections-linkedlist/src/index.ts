/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   THIRD PARTY LICENSE NOTICE:

   LinkedList is derived from the implementation of LinkedList in
   Promise Extensions for Javascript: https://github.com/rbuckton/prex

   Promise Extensions is licensed under the Apache 2.0 License:

   Promise Extensions for JavaScript
   Copyright (c) Microsoft Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { isIterable, isFunction, isMissing, isInstance } from "@esfx/internal-guards";
import { Collection, ReadonlyCollection } from "@esfx/collection-core";
import { Equaler, EqualityComparison } from "@esfx/equatable";

const kList = Symbol("LinkedListNode.list");
const kPrevious = Symbol("LinkedListNode.previous");
const kNext = Symbol("LinkedListNode.next");

export class LinkedListNode<T> {
    [kList]: LinkedList<T> | undefined = undefined;
    [kPrevious]: LinkedListNode<T> | undefined = undefined;
    [kNext]: LinkedListNode<T> | undefined = undefined;

    value: T;

    constructor(value: T) {
        this.value = value;
    }

    get list(): LinkedList<T> | undefined {
        return this[kList];
    }

    get previous(): LinkedListNode<T> | undefined {
        if (this[kPrevious] && this.list && this !== this.list.first) {
            return this[kPrevious];
        }

        return undefined;
    }

    get next(): LinkedListNode<T> | undefined {
        if (this[kNext] && this.list && this[kNext] !== this.list.first) {
            return this[kNext];
        }

        return undefined;
    }

    detachSelf() {
        return this.list ? this.list.deleteNode(this) : false;
    }

    [Symbol.toStringTag]!: string;
}

Object.defineProperty(LinkedListNode.prototype, Symbol.toStringTag, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "LinkedListNode"
});

const enum Position {
    before,
    after
}

export class LinkedList<T> implements Collection<T> {
    private _size: number = 0;
    private _head: LinkedListNode<T> | undefined = undefined;
    private _equaler: Equaler<T>;

    constructor(equaler?: EqualityComparison<T> | Equaler<T>);
    constructor(iterable?: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>);
    constructor(...args: [(EqualityComparison<T> | Equaler<T>)?] | [Iterable<T>?, (EqualityComparison<T> | Equaler<T>)?]) {
        let iterable: Iterable<T> | undefined;
        let equaler: EqualityComparison<T> | Equaler<T> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (isIterable(arg0) || isMissing(arg0)) {
                iterable = arg0;
                if (args.length > 1) equaler = args[1];
            }
            else {
                equaler = arg0;
            }
        }
        if (isMissing(equaler)) equaler = Equaler.defaultEqualer;
        this._equaler = typeof equaler === "function" ? Equaler.create(equaler) : equaler;

        if (iterable) {
            for (const value of iterable) {
                this.push(value);
            }
        }
    }

    get equaler(): Equaler<T> {
        return this._equaler;
    }

    get first(): LinkedListNode<T> | undefined {
        return this._head;
    }

    get last(): LinkedListNode<T> | undefined {
        if (this._head) {
            return this._head[kPrevious];
        }

        return undefined;
    }

    get size(): number {
        return this._size;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    * values() {
        for (const node of this.nodes()) {
            yield node.value;
        }
    }

    * nodes() {
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            yield node;
        }
    }

    * drain() {
        for (const node of this.nodes()) {
            this.deleteNode(node);
            yield node.value;
        }
    }

    nodeOf(value: T, fromNode?: LinkedListNode<T>): LinkedListNode<T> | undefined {
        if (!isMissing(fromNode) && !isInstance(fromNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: fromNode");
        if (!isMissing(fromNode) && fromNode.list !== this) throw new TypeError("Wrong list.");
        for (let node = fromNode || this.first; node; node = node.next) {
            if (this._equaler.equals(node.value, value)) {
                return node;
            }
        }

        return undefined;
    }

    lastNodeOf(value: T, fromNode?: LinkedListNode<T>): LinkedListNode<T> | undefined {
        if (!isMissing(fromNode) && !isInstance(fromNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: fromNode");
        if (!isMissing(fromNode) && fromNode.list !== this) throw new TypeError("Wrong list.");
        for (let node = fromNode || this.last; node; node = node.previous) {
            if (this._equaler.equals(node.value, value)) {
                return node;
            }
        }

        return undefined;
    }

    find<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    find(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined;
    find(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            const value = node.value;
            if (callback.call(thisArg, value, node, this)) return value;
        }
        return undefined;
    }

    findLast<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    findLast(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined;
    findLast(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let prev = this.last;
        while (prev !== undefined) {
            node = prev;
            prev = node.previous;
            const value = node.value;
            if (callback.call(thisArg, value, node, this)) return value;
        }
        return undefined;
    }

    findNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    findNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined;
    findNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            if (callback.call(thisArg, node.value, node, this)) return node;
        }
        return undefined;
    }

    findLastNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    findLastNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined;
    findLastNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let prev = this.last;
        while (prev !== undefined) {
            node = prev;
            prev = node.previous;
            if (callback.call(thisArg, node.value, node, this)) return node;
        }
        return undefined;
    }

    has(value: T): boolean {
        return this.nodeOf(value) !== undefined;
    }

    insertBefore(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T> {
        if (!isMissing(node) && !isInstance(node, LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new Error("Wrong list.");
        return this._insertNode(node || undefined, new LinkedListNode(value), Position.before);
    }

    insertNodeBefore(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void {
        if (!isMissing(node) && !isInstance(node, LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isInstance(newNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (!isMissing(node) && node.list !== this) throw new Error("Wrong list.");
        if (!isMissing(newNode.list)) throw new Error("Node is already attached to a list.");
        this._insertNode(node || undefined, newNode, Position.before);
    }

    insertAfter(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T> {
        if (!isMissing(node) && !isInstance(node, LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new Error("Wrong list.");
        return this._insertNode(node || undefined, new LinkedListNode(value), Position.after);
    }

    insertNodeAfter(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void {
        if (!isMissing(node) && !isInstance(node, LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isInstance(newNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (!isMissing(node) && node.list !== this) throw new Error("Wrong list.");
        if (!isMissing(newNode.list)) throw new Error("Node is already attached to a list.");
        this._insertNode(node || undefined, newNode, Position.after);
    }

    push(value: T): LinkedListNode<T> {
        return this._insertNode(undefined, new LinkedListNode(value), Position.after);
    }

    pushNode(newNode: LinkedListNode<T>): void {
        if (!isInstance(newNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (!isMissing(newNode.list)) throw new Error("Node is already attached to a list.");
        this._insertNode(undefined, newNode, Position.after);
    }

    pop(): T | undefined {
        const node = this.popNode();
        return node ? node.value : undefined;
    }

    popNode(): LinkedListNode<T> | undefined {
        const node = this.last;
        if (this.deleteNode(node)) {
            return node;
        }
    }

    shift(): T | undefined {
        const node = this.shiftNode();
        return node ? node.value : undefined;
    }

    shiftNode(): LinkedListNode<T> | undefined {
        const node = this.first;
        if (this.deleteNode(node)) {
            return node;
        }
    }

    unshift(value: T): LinkedListNode<T> {
        return this._insertNode(undefined, new LinkedListNode(value), Position.before);
    }

    unshiftNode(newNode: LinkedListNode<T>): void {
        if (!isInstance(newNode, LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (!isMissing(newNode.list)) throw new Error("Node is already attached to a list.");
        this._insertNode(undefined, newNode, Position.before);
    }

    delete(value: T): LinkedListNode<T> | undefined {
        const node = this.nodeOf(value);
        if (node && this.deleteNode(node)) {
            return node;
        }
        return undefined;
    }

    deleteNode(node: LinkedListNode<T> | null | undefined): boolean {
        if (!isMissing(node) && !isInstance(node, LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && !isMissing(node.list) && node.list !== this) throw new TypeError("Wrong list.");
        if (isMissing(node) || isMissing(node.list)) return false;
        return this._deleteNode(node);
    }

    deleteAll(predicate: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any) {
        if (!isFunction(predicate)) throw new TypeError("Function expected: predicate");
        let count = 0;
        let node = this.first;
        while (node) {
            const next = node.next;
            if (predicate.call(thisArg, node.value, node, this) && node.list === this) {
                this._deleteNode(node);
                ++count;
            }

            node = next;
        }

        return count;
    }

    clear(): void {
        while (this.size > 0) {
            this.deleteNode(this.last);
        }
    }

    forEach(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => void, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            callback.call(thisArg, node.value, node, this);
        }
    }

    map<U>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        const mappedList = new LinkedList<U>();
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            const mappedValue = callback.call(thisArg, node.value, node, this);
            mappedList.push(mappedValue);
        }
        return mappedList;
    }

    filter<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedList<S>;
    filter(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedList<T>;
    filter(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        const mappedList = new LinkedList<T>(this.equaler);
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            const value = node.value;
            if (callback.call(thisArg, value, node, this)) {
                mappedList.push(value);
            }
        }
        return mappedList;
    }

    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    reduce<U>(callback: (previousValue: U, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, initialValue: U): U;
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue?: T) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let hasInitialValue = arguments.length > 1;
        let result = initialValue;
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            const value = node.value;
            if (!hasInitialValue) {
                result = value;
                hasInitialValue = true;
            }
            else {
                result = callback(result!, value, node, this);
            }
        }
        return result;
    }

    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    reduceRight<U>(callback: (previousValue: U, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, initialValue: U): U;
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue?: T) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let hasInitialValue = arguments.length > 1;
        let result = initialValue;
        let node: LinkedListNode<T>;
        let prev = this.last;
        while (prev !== undefined) {
            node = prev;
            const value = node.value;
            if (!hasInitialValue) {
                result = value;
                hasInitialValue = true;
            }
            else {
                result = callback(result!, value, node, this);
            }
            prev = node.previous;
        }
        return result;
    }

    some(callback?: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any) {
        if (!isMissing(callback) && !isFunction(callback)) throw new TypeError("Function expected: callback");
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            if (!callback || callback.call(thisArg, node.value, node, this)) return true;
        }
        return false;
    }

    every(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any) {
        if (!isFunction(callback)) throw new TypeError("Function expected: callback");
        let hasMatch = false;
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            if (!callback.call(thisArg, node.value, node, this)) return false;
            hasMatch = true;
        }
        return hasMatch;
    }

    private _deleteNode(node: LinkedListNode<T>): boolean {
        if (node[kNext] === node) {
            this._head = undefined;
        }
        else {
            node[kNext]![kPrevious] = node[kPrevious];
            node[kPrevious]![kNext] = node[kNext];
            if (this._head === node) {
                this._head = node[kNext];
            }
        }

        node[kList] = undefined;
        node[kNext] = undefined;
        node[kPrevious] = undefined;
        this._size--;
        return true;
    }

    private _insertNode(adjacentNode: LinkedListNode<T> | undefined, newNode: LinkedListNode<T>, position: Position) {
        newNode[kList] = this;
        if (this._head === undefined) {
            newNode[kNext] = newNode;
            newNode[kPrevious] = newNode;
            this._head = newNode;
        }
        else {
            switch (position) {
                case Position.before:
                    if (adjacentNode === undefined) {
                        adjacentNode = this._head;
                        this._head = newNode;
                    }
                    else if (adjacentNode === this._head) {
                        this._head = newNode;
                    }

                    newNode[kNext] = adjacentNode;
                    newNode[kPrevious] = adjacentNode[kPrevious];
                    adjacentNode[kPrevious]![kNext] = newNode;
                    adjacentNode[kPrevious] = newNode;
                    break;

                case Position.after:
                    if (adjacentNode === undefined) {
                        adjacentNode = this._head[kPrevious]!;
                    }

                    newNode[kPrevious] = adjacentNode;
                    newNode[kNext] = adjacentNode[kNext];
                    adjacentNode[kNext]![kPrevious] = newNode;
                    adjacentNode[kNext] = newNode;
                    break;
            }
        }

        this._size++;
        return newNode;
    }

    [Symbol.toStringTag]!: string;

    // ReadonlyCollection<T>
    get [ReadonlyCollection.size]() { return this.size; }
    [ReadonlyCollection.has](value: T) { return this.has(value); }

    // Collection<T>
    [Collection.add](value: T) { this.push(value); }
    [Collection.delete](value: T) { return !!this.delete(value); }
    [Collection.clear]() { this.clear(); }
}

Object.defineProperty(LinkedList.prototype, Symbol.toStringTag, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: "LinkedList"
});
