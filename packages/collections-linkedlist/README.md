# `@esfx/collections-linkedlist`

The `@esfx/collections-linkedlist` package provides a linked-list implementation that utilizes `@esfx/collection-core` and `@esfx/equatable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/collections-linkedlist
```

# Usage

```ts
import { LinkedList } from "equatable/collections-linkedlist";

const list = new LinkedList();
const n1 = list.push("first");
const n2 = list.push("second");
n2.value = "second updated";
[...list]; // first,second updated
```

# API

```ts
import { Collection, ReadonlyCollection } from "@esfx/collection-core";
import { Equaler, EqualityComparison } from "@esfx/equatable";
declare const kList: unique symbol;
declare const kPrevious: unique symbol;
declare const kNext: unique symbol;
export declare class LinkedListNode<T> {
    [kList]: LinkedList<T> | undefined;
    [kPrevious]: LinkedListNode<T> | undefined;
    [kNext]: LinkedListNode<T> | undefined;
    value: T;
    constructor(value: T);
    readonly list: LinkedList<T> | undefined;
    readonly previous: LinkedListNode<T> | undefined;
    readonly next: LinkedListNode<T> | undefined;
    detachSelf(): boolean;
    [Symbol.toStringTag]: string;
}
export declare class LinkedList<T> implements Collection<T> {
    private _size;
    private _head;
    private _equaler;
    constructor(equaler?: EqualityComparison<T> | Equaler<T>);
    constructor(iterable?: Iterable<T>, equaler?: EqualityComparison<T> | Equaler<T>);
    readonly equaler: Equaler<T>;
    readonly first: LinkedListNode<T> | undefined;
    readonly last: LinkedListNode<T> | undefined;
    readonly size: number;
    [Symbol.iterator](): IterableIterator<T>;
    values(): IterableIterator<T>;
    nodes(): IterableIterator<LinkedListNode<T>>;
    drain(): IterableIterator<T>;
    nodeOf(value: T, fromNode?: LinkedListNode<T>): LinkedListNode<T> | undefined;
    lastNodeOf(value: T, fromNode?: LinkedListNode<T>): LinkedListNode<T> | undefined;
    find<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    find(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined;
    findLast<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): S | undefined;
    findLast(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): T | undefined;
    findNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    findNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined;
    findLastNode<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedListNode<S> | undefined;
    findLastNode(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedListNode<T> | undefined;
    has(value: T): boolean;
    insertBefore(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T>;
    insertNodeBefore(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void;
    insertAfter(node: LinkedListNode<T> | null | undefined, value: T): LinkedListNode<T>;
    insertNodeAfter(node: LinkedListNode<T> | null | undefined, newNode: LinkedListNode<T>): void;
    push(value: T): LinkedListNode<T>;
    pushNode(newNode: LinkedListNode<T>): void;
    pop(): T | undefined;
    popNode(): LinkedListNode<T> | undefined;
    shift(): T | undefined;
    shiftNode(): LinkedListNode<T> | undefined;
    unshift(value: T): LinkedListNode<T>;
    unshiftNode(newNode: LinkedListNode<T>): void;
    delete(value: T): LinkedListNode<T> | undefined;
    deleteNode(node: LinkedListNode<T> | null | undefined): boolean;
    deleteAll(predicate: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): number;
    clear(): void;
    forEach(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => void, thisArg?: any): void;
    map<U>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, thisArg?: any): LinkedList<U>;
    filter<S extends T>(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => value is S, thisArg?: any): LinkedList<S>;
    filter(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): LinkedList<T>;
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    reduce(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    reduce<U>(callback: (previousValue: U, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, initialValue: U): U;
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T): T;
    reduceRight(callback: (previousValue: T, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => T, initialValue: T): T;
    reduceRight<U>(callback: (previousValue: U, value: T, node: LinkedListNode<T>, list: LinkedList<T>) => U, initialValue: U): U;
    some(callback?: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): boolean;
    every(callback: (value: T, node: LinkedListNode<T>, list: LinkedList<T>) => boolean, thisArg?: any): boolean;
    private _deleteNode;
    private _insertNode;
    [Symbol.toStringTag]: string;
    readonly [ReadonlyCollection.size]: number;
    [ReadonlyCollection.has](value: T): boolean;
    [Collection.add](value: T): void;
    [Collection.delete](value: T): boolean;
    [Collection.clear](): void;
}
```
