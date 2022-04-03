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

import /*#__INLINE__*/ { isMissing, isObject } from "@esfx/internal-guards";
import { DefaultMemoizeCache } from "./defaultMemoizeCache.js";

export interface MemoizeOptions<A extends unknown[], T> {
    /**
     * Specifies the cache to use for {@link memoize}.
     */
    cache?: MemoizeCache<A, T>;
}

/**
 * Describes the minimum implementation of a cache for {@link memoize}.
 */
export interface MemoizeCache<A extends unknown[], T> {
    /**
     * Gets (or creates) a {@link MemoizeCacheEntry} unique to the provided arguments.
     * @param args The arguments provided to {@link memoize}.
     */
    get(args: Readonly<A>): MemoizeCacheEntry<T>;
}

/**
 * Describes the minimum implementation of a cache entry for a {@link MemoizeCache}.
 */
export interface MemoizeCacheEntry<T> {
    /**
     * Gets or sets the result for the entry.
     */
    result: MemoizeCacheSettledResult<T> | undefined;
}

/**
 * Describes a cache result that has a value.
 */
export interface MemoizeCacheFulfilledResult<T> {
    status: "fulfilled";
    value: T;
}

/**
 * Describes a cache result that has an exception.
 */
export interface MemoizeCacheRejectedResult {
    status: "rejected";
    reason: any;
}

/**
 * Describes a cache result.
 */
export type MemoizeCacheSettledResult<T> =
    | MemoizeCacheFulfilledResult<T>
    | MemoizeCacheRejectedResult;

/**
 * Memoize a callback. An invocation for a memoized function will only evaluate once for the
 * same argument list. You can control caching behavior for `memoize` by passing a custom `cache`
 * object.
 *
 * The default cache behavior is provided by {@link DefaultMemoizeCache}.
 *
 * @param factory The callback function to evaluate.
 * @param options Options that control caching behavior.
 * @returns The memoized function.
 */
export function memoize<A extends unknown[], T>(factory: (...args: A) => T, options?: MemoizeOptions<A, T>) {
    const cache = options?.cache ?? new DefaultMemoizeCache<A, T>();
    return (...args: A): T => evaluate(factory, args, cache);
}

function evaluate<A extends unknown[], T>(factory: (...args: A) => T, args: A, cache: MemoizeCache<A, T>): T {
    const entry = cache.get(args);
    if (!isObject(entry)) throw new TypeError("Expected cache to return a valid MemoizeCacheEntry");

    let result = entry.result;
    if (isMissing(result)) {
        entry.result = circularResult;
        try {
            const value = factory(...args);
            result = { status: "fulfilled", value };
        }
        catch (reason) {
            result = { status: "rejected", reason };
        }
        entry.result = result;
    }
    else {
        if (!isObject(result)) throw new TypeError("Expected MemoizeCacheEntry.result to return a valid MemoizeCacheSettledResult");
    }

    switch (result.status) {
        case "fulfilled": return result.value;
        case "rejected": throw result.reason;
        default: throw new TypeError("Expected MemoizeCacheEntry.result to return a valid MemoizeCacheSettledResult");
    }
}

const circularResult: MemoizeCacheRejectedResult = Object.freeze({
    status: "rejected",
    get reason() {
        return new Error("Memoized function recursively invokes itself with the same arguments during its own evaluation.");
    }
});
