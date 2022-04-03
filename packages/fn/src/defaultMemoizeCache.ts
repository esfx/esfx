/*!
   Copyright 2020 Ron Buckton

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

import /*#__INLINE__*/ { isObject } from "@esfx/internal-guards";
import type { MemoizeCache, MemoizeCacheEntry, MemoizeCacheSettledResult } from "./memoize.js";

/**
 * The default implementation of a {@link MemoizeCache}, as used by {@link memoize}.
 *
 * Non-primitive keys have a lifetime scoped to both the life of the key (using a `WeakMap`) and
 * the life of the cache. Results associated with a non-primitive key can be garbage collected if
 * the key is garbage collected.
 *
 * Primitive keys have a lifetime scoped to the life of the cache, so results associated with a
 * primitive key can only be garbage collected if the cache is garbage collected.
 */
export class DefaultMemoizeCache<A extends unknown[], T> implements MemoizeCache<A, T> {
    #handle = new MemoizeCacheHandle();
    #root = new MemoizeNode<T>(this.#handle);

    /**
     * Tests whether the cache has a result for the provided sequence of arguments.
     */
    has(args: Readonly<A>) {
        const node = this.#walk(args, /*ensure*/ false);
        return !!node?.result;
    }

    /**
     * Gets or creates a cache entry for the provided sequence of arguments.
     */
    get(args: Readonly<A>) {
        const node = this.#walk(args, /*ensure*/ true);
        return node.entry;
    }

    /**
     * Clears the cache.
     */
    clear() {
        // invalidate existing cache entries.
        this.#handle.clear();

        // create a new cache handle and root node.
        this.#handle = new MemoizeCacheHandle();
        this.#root = new MemoizeNode<T>(this.#handle);
    }

    #walk(keys: Readonly<A>, ensure: true): MemoizeNode<T>;
    #walk(keys: Readonly<A>, ensure: boolean): MemoizeNode<T> | undefined;
    #walk(keys: Readonly<A>, ensure: boolean) {
        let node: MemoizeNode<T> | undefined = this.#root;
        for (const key of keys) {
            node = node.next(key, ensure);
            if (!node) return;
        }
        return node;
    }
}

class MemoizeCacheHandle {
    #value: object | null = {};

    read() {
        if (this.#value === null) throw new ReferenceError("Object is disposed.");
        return this.#value;
    }

    clear() {
        this.#value = null;
    }
}

interface MemoizeNodeMap<T> {
    get(key: unknown): MemoizeNode<T> | undefined;
    set(key: unknown, node: MemoizeNode<T>): void;
}

class MemoizeNode<T> {
    #handle: MemoizeCacheHandle;
    #result: MemoizeCacheSettledResult<T> | undefined;
    #entry: WeakRef<MemoizeCacheEntry<T>> | undefined;
    #nonprimitives?: WeakMap<object, MemoizeNode<T>>;
    #primitives?: Map<unknown, MemoizeNode<T>>;

    constructor(handle: MemoizeCacheHandle) {
        handle.read();
        this.#handle = handle;
    }

    get entry(): MemoizeCacheEntry<T> {
        // We hold onto the entry weakly so that it can be GC'd if unused, but we
        // don't need to reallocate it while it's still alive (i.e., it will always
        // be observably the same entry).
        //
        // We also want to tie the lifetime of the node (and its associated result) to
        // the cache that created it, even if a user-accessible entry is still held
        // after the cache is cleared. To do this, we create a ConditionalWeakRef for
        // the node, tied to the value of the handle.
        //
        // When the cache is cleared the cache handle will be invalidated and the
        // cache root node will be reset. As a result, there will be no remaining
        // reachable references to the node, allowing it to be GC'd.

        let entry = this.#entry?.deref();
        if (!entry) {
            entry = MemoizeNode.#createEntry(new ConditionalWeakRef(this.#handle.read(), new WeakRef(this)));
            this.#entry = new WeakRef(entry);
        }
        return entry;
    }

    get result() {
        return this.#result;
    }

    next(key: unknown, ensure: true): MemoizeNode<T>;
    next(key: unknown, ensure: boolean): MemoizeNode<T> | undefined;
    next(key: unknown, ensure: boolean) {
        const cache: MemoizeNodeMap<T> | undefined = isObject(key) ?
            ensure ? this.#nonprimitives ??= new WeakMap() : this.#nonprimitives :
            ensure ? this.#primitives ??= new Map() : this.#primitives;
        let node = cache?.get(key);
        if (!node && cache) cache.set(key, node = new MemoizeNode(this.#handle));
        return node;
    }

    static #createEntry<T>(ref: ConditionalWeakRef<WeakRef<MemoizeNode<T>>>): MemoizeCacheEntry<T> {
        return Object.freeze(Object.create(Object.prototype, {
            result: {
                configurable: true,
                get() {
                    const node = ref.deref()?.deref();
                    if (!node) throw new ReferenceError("Object is disposed.");
                    const result = node.#result;
                    return result && { ...result };
                },
                set(result) {
                    const node = ref.deref()?.deref();
                    if (!node) throw new ReferenceError("Object is disposed.");
                    node.#result =
                        result?.status === "fulfilled" ? { status: "fulfilled", value: result.value } :
                        result?.status === "rejected" ? { status: "rejected", reason: result.reason } :
                        undefined;
                }
            }
        }));
    }
}

/**
 * Holds a value via a weakly referenced condition. If the condition is garbage collected,
 * the value becomes unreachable (and can thus also be garbage collected).
 */
class ConditionalWeakRef<T> {
    #ref: WeakRef<object>;
    #holder: WeakMap<object, T>;

    constructor(condition: object, value: T) {
        if (!isObject(condition)) throw new TypeError("Object expected: condition");
        this.#ref = new WeakRef(condition);
        this.#holder = new WeakMap([[condition, value]]);
    }

    get valid() {
        const condition = this.#ref.deref();
        return !!condition && this.#holder.has(condition);
    }

    deref() {
        const condition = this.#ref.deref();
        return condition && this.#holder.get(condition);
    }
}
