/*
   Copyright 2022 Ron Buckton

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

export interface LinkedList<T> {
    size: number;
    head: LinkedListNode<T> | null;
}

export interface LinkedListNode<T> {
    value: T;
    prev: LinkedListNode<T> | null;
    next: LinkedListNode<T> | null;
}

export function listCreate<T>(): LinkedList<T> {
    return { size: 0, head: null };
}

export function listAdd<T>(list: LinkedList<T>, value: T) {
    const node: LinkedListNode<T> = { value, next: null, prev: null };
    if (list.head === null) {
        list.head = node.next = node.prev = node;
    }
    else {
        const tail = list.head.prev;
        if (!tail?.next) throw new Error("Illegal state");
        node.prev = tail;
        node.next = tail.next;
        tail.next = tail.next.prev = node;
    }
    list.size++;
    return node;
}

export function listRemove<T>(list: LinkedList<T>, node: LinkedListNode<T>) {
    if (node.next === null || node.prev === null) return false;
    if (node.next === node) {
        list.head = null;
    }
    else {
        node.next.prev = node.prev;
        node.prev.next = node.next;
        if (list.head === node) {
            list.head = node.next;
        }
    }
    node.next = node.prev = null;
    list.size--;
    return true;
}
