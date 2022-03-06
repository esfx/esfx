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

import { Collection, ReadonlyCollection } from "@esfx/collection-core";
import { Equaler, EqualityComparison } from "@esfx/equatable";
import /*#__INLINE__*/ { isFunction, isIterable, isMissing, isUndefined } from "@esfx/internal-guards";

let setList: <T>(node: LinkedListNode<T>, list: LinkedList<T> | undefined) => void;
let getPrevious: <T>(node: LinkedListNode<T>) => LinkedListNode<T> | undefined;
let setPrevious: <T>(node: LinkedListNode<T>, previous: LinkedListNode<T> | undefined) => void;
let getNext: <T>(node: LinkedListNode<T>) => LinkedListNode<T> | undefined;
let setNext: <T>(node: LinkedListNode<T>, next: LinkedListNode<T> | undefined) => void;

/**
 * A node in a [doubly-linked list](https://en.wikipedia.org/wiki/Doubly_linked_list).
 */
export class LinkedListNode<T> {
    private _list: LinkedList<T> | undefined = undefined;
    private _previous: LinkedListNode<T> | undefined = undefined;
    private _next: LinkedListNode<T> | undefined = undefined;

    static {
        setList = (node, list) => { node._list = list; };
        getPrevious = node => node._previous;
        setPrevious = (node, previous) => { node._previous = previous };
        getNext = node => node._next;
        setNext = (node, next) => { node._next = next };
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "LinkedListNode" });
    }

    /**
     * The value for the node.
     */
    value: T;

    constructor(value: T) {
        this.value = value;
    }

    /**
     * Gets the list associated with this node. If the node is not attached to a {@link LinkedList}, then this returns
     * `undefined`.
     */
    get list(): LinkedList<T> | undefined {
        return this._list;
    }

    /**
     * Gets the {@link LinkedListNode} preceding this node in the list. If this is the first node in the list, or the
     * node is not attached to a {@link LinkedList}, then this returns `undefined`.
     */
    get previous(): LinkedListNode<T> | undefined {
        if (this._previous && this._list && this !== this._list.first) {
            return this._previous;
        }

        return undefined;
    }

    /**
     * Gets the {@link LinkedListNode} following this node in the list. If this is the last node in the list, or the
     * node is not attached to a {@link LinkedList}, then this returns `undefined`.
     */
    get next(): LinkedListNode<T> | undefined {
        if (this._next && this._list && this._next !== this._list.first) {
            return this._next;
        }

        return undefined;
    }

    /**
     * Removes this node from its associated list.
     * @returns `true` if the node was successfully removed from the list; otherwise, `false`.
     */
    detachSelf() {
        return this._list ? this._list.deleteNode(this) : false;
    }

    declare [Symbol.toStringTag]: string;
}

const enum Position {
    before,
    after
}

/**
 * A collection representing a [doubly-linked list](https://en.wikipedia.org/wiki/Doubly_linked_list).
 */
export class LinkedList<T> implements Collection<T> {
    private _size: number = 0;
    private _head: LinkedListNode<T> | undefined = undefined;
    private _equaler: Equaler<T>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, writable: true, value: "LinkedList" });
    }

    constructor(equaler?: EqualityComparison<T> | Equaler<T>);
    constructor(iterable?: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>);
    constructor(...args: [(EqualityComparison<T> | Equaler<T>)?] | [Iterable<T>?, (EqualityComparison<T> | Equaler<T>)?]) {
        let iterable: Iterable<T> | undefined;
        let equaler: EqualityComparison<T> | Equaler<T> | undefined;
        if (args.length > 0) {
            const arg0 = args[0];
            if (isUndefined(arg0) || isIterable(arg0)) {
                iterable = arg0;
                if (args.length > 1) equaler = args[1];
            }
            else {
                equaler = arg0;
            }
        }

        equaler ??= Equaler.defaultEqualer;
        this._equaler = typeof equaler === "function" ? Equaler.create(equaler) : equaler;

        if (iterable) {
            for (const value of iterable) {
                this.push(value);
            }
        }
    }

    /**
     * Gets the {@link @esfx/equatable!Equaler} used for equality comparisons in this list.
     */
    get equaler(): Equaler<T> {
        return this._equaler;
    }

    /**
     * Gets the first node in the list. If the list is empty, this returns `undefined`.
     */
    get first(): LinkedListNode<T> | undefined {
        return this._head;
    }

    /**
     * Gets the last node in the list. If the list is empty, this returns `undefined`.
     */
    get last(): LinkedListNode<T> | undefined {
        if (this._head) {
            return getPrevious(this._head);
        }

        return undefined;
    }

    /**
     * Gets the number of elements in the list.
     */
    get size(): number {
        return this._size;
    }

    [Symbol.iterator]() {
        return this.values();
    }

    * values(): IterableIterator<T> {
        for (const node of this.nodes()) {
            yield node.value;
        }
    }

    * nodes(): IterableIterator<LinkedListNode<T>> {
        let node: LinkedListNode<T>;
        let next = this.first;
        while (next !== undefined) {
            node = next;
            next = node.next;
            yield node;
        }
    }

    /**
     * Returns an iterator that removes each node from the list before yielding the node's value.
     */
    * drain(): IterableIterator<T> {
        for (const node of this.nodes()) {
            this.deleteNode(node);
            yield node.value;
        }
    }

    /**
     * Finds the first node in the list with the provided value.
     * @param value The value to find.
     * @param fromNode When provided, starts looking for `value` starting at this node.
     */
    nodeOf(value: T, fromNode?: LinkedListNode<T> | null): LinkedListNode<T> | undefined {
        if (!isMissing(fromNode) && !(fromNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: fromNode");
        if (!isMissing(fromNode) && fromNode.list !== this) throw new TypeError("Wrong list.");
        for (let node = fromNode ?? this.first; node; node = node.next) {
            if (this._equaler.equals(node.value, value)) {
                return node;
            }
        }

        return undefined;
    }

    /**
     * Finds the last node in the list with the provided value, starting from the end of the list.
     * @param value The value to find.
     * @param fromNode When provided, starts looking for `value` starting at this node and working backwards towards the front of the list.
     */
    lastNodeOf(value: T, fromNode?: LinkedListNode<T> | null): LinkedListNode<T> | undefined {
        if (!isMissing(fromNode) && !(fromNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: fromNode");
        if (!isMissing(fromNode) && fromNode.list !== this) throw new TypeError("Wrong list.");
        for (let node = fromNode ?? this.last; node; node = node.previous) {
            if (this._equaler.equals(node.value, value)) {
                return node;
            }
        }

        return undefined;
    }

    /**
     * Finds the first value in the list that matches the provided callback.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
    find<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    /**
     * Finds the first value in the list that matches the provided callback.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Finds the last value in the list that matches the provided callback, starting from the end of the list.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
    findLast<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    /**
     * Finds the last value in the list that matches the provided callback, starting from the end of the list.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Finds the first {@link LinkedListNode} in the list that matches the provided callback.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
    findNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    /**
     * Finds the first {@link LinkedListNode} in the list that matches the provided callback.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Finds the last {@link LinkedListNode} in the list that matches the provided callback, starting from the end of the list.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
    findLastNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    /**
     * Finds the last {@link LinkedListNode} in the list that matches the provided callback, starting from the end of the list.
     * @param callback The callback used to test each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Returns a value indicating whether `value` exists within the list.
     */
    has(value: T): boolean {
        return this.nodeOf(value) !== undefined;
    }

    /**
     * Inserts a new {@link LinkedListNode} containing `value` into the list before the provided `node`.
     * If `node` is either `null` or `undefined`, the new node is inserted at the beginning of the list.
     * @param node The node before which `value` will be inserted.
     * @param value The value to insert.
     * @returns The new {@link LinkedListNode} for `value`.
     */
    insertBefore(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T> {
        if (!isMissing(node) && !(node instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new TypeError("Wrong list.");
        return this._insertNode(node ?? undefined, new LinkedListNode(value), Position.before);
    }

    /**
     * Inserts `newNode` into the list before the provided `node`. If `node` is either `null` or `undefined`, `newNode`
     * is inserted at the beginning of the list.
     * @param node The node before which `newNode` will be inserted.
     * @param newNode The new node to insert.
     */
    insertNodeBefore(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void {
        if (!isMissing(node) && !(node instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new TypeError("Wrong list.");
        if (!(newNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (newNode.list) throw new Error("Node is already attached to a list.");
        this._insertNode(node || undefined, newNode, Position.before);
    }

    /**
     * Inserts a new {@link LinkedListNode} containing `value` into the list after the provided `node`.
     * If `node` is either `null` or `undefined`, the new node is inserted at the end of the list.
     * @param node The node after which `value` will be inserted.
     * @param value The value to insert.
     * @returns The new {@link LinkedListNode} for `value`.
     */
    insertAfter(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T> {
        if (!isMissing(node) && !(node instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new TypeError("Wrong list.");
        return this._insertNode(node || undefined, new LinkedListNode(value), Position.after);
    }

    /**
     * Inserts `newNode` into the list after the provided `node`. If `node` is either `null` or `undefined`, `newNode`
     * is inserted at the end of the list.
     * @param node The node after which `newNode` will be inserted.
     * @param newNode The new node to insert.
     */
    insertNodeAfter(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void {
        if (!isMissing(node) && !(node instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new TypeError("Wrong list.");
        if (!(newNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (newNode.list) throw new Error("Node is already attached to a list.");
        this._insertNode(node || undefined, newNode, Position.after);
    }

    /**
     * Inserts a new {@link LinkedListNode} containing `value` at the end of the list.
     * @param value The value to insert.
     * @returns The new {@link LinkedListNode} for `value`.
     */
    push(value: T): LinkedListNode<T> {
        return this._insertNode(undefined, new LinkedListNode(value), Position.after);
    }

    /**
     * Inserts `newNode` at the end of the list.
     * @param newNode The node to insert.
     */
    pushNode(newNode: LinkedListNode<T>): void {
        if (!(newNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (newNode.list) throw new Error("Node is already attached to a list.");
        this._insertNode(undefined, newNode, Position.after);
    }

    /**
     * Removes the last node from the list and returns its value. If the list is empty, `undefined` is returned instead.
     */
    pop(): T | undefined {
        const node = this.popNode();
        return node ? node.value : undefined;
    }

    /**
     * Removes the last node from the list and returns it. If the lsit is empty, `undefined` is returned instead.
     */
    popNode(): LinkedListNode<T> | undefined {
        const node = this.last;
        if (this.deleteNode(node)) {
            return node;
        }
    }

    /**
     * Removes the first node from the list and returns its value. If the list is empty, `undefined` is returned instead.
     */
    shift(): T | undefined {
        const node = this.shiftNode();
        return node ? node.value : undefined;
    }

    /**
     * Removes the first node from the list and returns it. If the list is empty, `undefined` is returned instead.
     */
    shiftNode(): LinkedListNode<T> | undefined {
        const node = this.first;
        if (this.deleteNode(node)) {
            return node;
        }
    }

    /**
     * Inserts a new {@link LinkedListNode} containing `value` at the beginning of the list.
     * @param value The value to insert.
     * @returns The new {@link LinkedListNode} for `value`.
     */
    unshift(value: T): LinkedListNode<T> {
        return this._insertNode(undefined, new LinkedListNode(value), Position.before);
    }

    /**
     * Inserts `newNode` at the beginning of the list.
     * @param newNode The node to insert.
     */
    unshiftNode(newNode: LinkedListNode<T>): void {
        if (!(newNode instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: newNode");
        if (newNode.list) throw new Error("Node is already attached to a list.");
        this._insertNode(undefined, newNode, Position.before);
    }

    /**
     * Finds the first node in the list containing `value`, removes it from the list, and returns it. If a node
     * containing `value` could not be found, `undefined` is returned instead.
     */
    delete(value: T): LinkedListNode<T> | undefined {
        const node = this.nodeOf(value);
        if (node && this.deleteNode(node)) {
            return node;
        }
        return undefined;
    }

    /**
     * Removes the provided node from the list.
     * @returns `true` if the node was successfully removed from the list; otherwise, `false`.
     */
    deleteNode(node: LinkedListNode<T> | null | undefined): boolean {
        if (!isMissing(node) && !(node instanceof LinkedListNode)) throw new TypeError("LinkedListNode expected: node");
        if (!isMissing(node) && node.list !== this) throw new TypeError("Wrong list.");
        if (isMissing(node) || !node.list) return false;
        return this._deleteNode(node);
    }

    /**
     * Removes all nodes from the list matching the supplied `predicate`.
     * @param predicate A callback function used to test each value and node in the list.
     * @param thisArg The `this` value to use when executing `predicate`.
     */
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

    /**
     * Removes all nodes from the list.
     */
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

    /**
     * Calls the provided `callback` function on each element of the list, and returns a new {@link LinkedList} that contains the results.
     * @param callback The callback to call for each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Returns the elements of a the list that meet the condition specified in the provided `callback` function.
     * @param callback The `callback` to call for each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
    filter<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedList<S>;
    /**
     * Returns the elements of a the list that meet the condition specified in the provided `callback` function.
     * @param callback The `callback` to call for each value and node.
     * @param thisArg The `this` value to use when executing `callback`.
     */
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

    /**
     * Calls the specified `callback` function for all the nodes in the list. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     */
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    /**
     * Calls the specified `callback` function for all the nodes in the list. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     * @param initialValue  If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the `callback` function provides this value as an argument instead of a list value.
     */
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    /**
     * Calls the specified `callback` function for all the nodes in the list. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the `callback` function provides this value as an argument instead of a list value.
     */
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

    /**
     * Calls the specified `callback` function for all the nodes in the list, in reverse. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     */
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    /**
     * Calls the specified `callback` function for all the nodes in the list, in reverse. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     * @param initialValue  If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the `callback` function provides this value as an argument instead of a list value.
     */
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    /**
     * Calls the specified `callback` function for all the nodes in the list, in reverse. The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     * @param callback A function that accepts up to four arguments. The reduce method calls the callback function one time for each element in the list.
     * @param initialValue  If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the `callback` function provides this value as an argument instead of a list value.
     */
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
        if (!isUndefined(callback) && !isFunction(callback)) throw new TypeError("Function expected: callback");
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
        if (getNext(node) === node) {
            this._head = undefined;
        }
        else {
            setPrevious(getNext(node)!, getPrevious(node));
            setNext(getPrevious(node)!, getNext(node));
            if (this._head === node) {
                this._head = getNext(node);
            }
        }

        setList(node, undefined);
        setPrevious(node, undefined);
        setNext(node, undefined);
        this._size--;
        return true;
    }

    private _insertNode(adjacentNode: LinkedListNode<T> | undefined, newNode: LinkedListNode<T>, position: Position) {
        setList(newNode, this);
        if (this._head === undefined) {
            setNext(newNode, newNode);
            setPrevious(newNode, newNode);
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

                    setNext(newNode, adjacentNode);
                    setPrevious(newNode, getPrevious(adjacentNode));
                    setNext(getPrevious(adjacentNode)!, newNode);
                    setPrevious(adjacentNode, newNode);
                    break;

                case Position.after:
                    if (adjacentNode === undefined) {
                        adjacentNode = getPrevious(this._head)!;
                    }

                    setPrevious(newNode, adjacentNode);
                    setNext(newNode, getNext(adjacentNode));
                    setPrevious(getNext(adjacentNode)!, newNode);
                    setNext(adjacentNode, newNode);
                    break;
            }
        }

        this._size++;
        return newNode;
    }

    declare [Symbol.toStringTag]: string;

    // ReadonlyCollection<T>
    get [ReadonlyCollection.size]() { return this.size; }
    [ReadonlyCollection.has](value: T) { return this.has(value); }

    // Collection<T>
    [Collection.add](value: T) { this.push(value); }
    [Collection.delete](value: T) { return !!this.delete(value); }
    [Collection.clear]() { this.clear(); }
}
