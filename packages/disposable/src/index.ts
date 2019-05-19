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
*/

import { isMissing, isObject } from "@esfx/internal-guards";
import { defineTag } from "@esfx/internal-tag";

/**
 * Indicates an object that has resources that can be explicitly disposed.
 */
export interface Disposable {
    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose](): void;
}

export namespace Disposable {
    /**
     * A well-known symbol used to define an explicit resource disposal method on an object.
     */
    export const dispose = Symbol.for("@esfx/disposable:Disposable.dispose");

    /**
     * Determines whether a value is [[Disposable]].
     */
    export function isDisposable(value: unknown): value is Disposable {
        return typeof value === "object"
            && value !== null
            && dispose in value;
    }

    const disposablePrototype: object = defineTag({ }, "Disposable");
    
    /**
     * Creates a `Disposable` wrapper around a callback used to dispose of a resource.
     */
    export function create(dispose: () => void): Disposable {
        return Object.setPrototypeOf({
            [Disposable.dispose]() {
                dispose();
            }
        }, disposablePrototype);
    }

    /**
     * Creates a `Disposable` wrapper around a set of other disposables.
     * @param disposables An `Iterable` of `Disposable` objects.
     */
    export function from(disposables: Iterable<Disposable | null | undefined>) {
        const disposablesArray: Disposable[] = [];
        for (const disposable of disposables) {
            if (isMissing(disposable)) continue;
            if (!isDisposable(disposable)) throw new TypeError("Disposable element expected: disposables");
            disposablesArray.push(disposable);
        }
        return create(() => {
            for (const disposable of disposablesArray) {
                disposable[dispose]();
            }
        });
    }

    /**
     * Executes a callback with the provided `Disposable` resource, disposing the resource when the callback completes.
     */
    export function use<T extends Disposable | null | undefined, U>(resource: T, callback: (resource: T) => U) {
        if (!isMissing(resource) && !isDisposable(resource)) throw new TypeError("Disposable expected: resource");
        try {
            return callback(resource);
        }
        finally {
            if (!isMissing(resource)) {
                resource[Disposable.dispose]();
            }
        }
    }
}

/**
 * Indicates an object that has resources that can be explicitly disposed asynchronously.
 */
export interface AsyncDisposable {
    /**
     * Dispose this object's resources.
     */
    [AsyncDisposable.asyncDispose](): Promise<void>;
}

export namespace AsyncDisposable {
    /**
     * A well-known symbol used to define an async explicit resource disposal method on an object.
     */
    export const asyncDispose = Symbol.for("@esfx/disposable:AsyncDisposable.asyncDispose");

    /**
     * Determines whether a value is [[AsyncDisposable]].
     */
    export function isAsyncDisposable(value: unknown): value is AsyncDisposable {
        return isObject(value)
            && AsyncDisposable.asyncDispose in value;
    }

    const asyncDisposablePrototype: object = defineTag({ }, "AsyncDisposable");

    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     */
    export function create(dispose: () => void | PromiseLike<void>): AsyncDisposable {
        return Object.setPrototypeOf({
            async [AsyncDisposable.asyncDispose]() {
                await dispose();
            }
        }, asyncDisposablePrototype);
    }

    function asyncFromSyncDisposable(disposable: Disposable) {
        return create(() => disposable[Disposable.dispose]());
    }

    function toAsyncDisposable(resource: AsyncDisposable | Disposable): AsyncDisposable;
    function toAsyncDisposable(resource: AsyncDisposable | Disposable | null | undefined): AsyncDisposable | undefined;
    function toAsyncDisposable(resource: AsyncDisposable | Disposable | null | undefined) {
        return AsyncDisposable.isAsyncDisposable(resource) ? resource :
            Disposable.isDisposable(resource) ? asyncFromSyncDisposable(resource) :
            undefined;
    }

    /**
     * Creates an `AsyncDisposable` wrapper around a set of other disposables.
     * @param resources An `Iterable` of `AsyncDisposable` or `Disposable` objects.
     */
    export function from(resources: Iterable<AsyncDisposable | Disposable | null | undefined>) {
        const disposablesArray: AsyncDisposable[] = [];
        for (const resource of resources) {
            if (!isMissing(resource) && !AsyncDisposable.isAsyncDisposable(resource) && !Disposable.isDisposable(resource)) {
                throw new TypeError("AsyncDisposable element expected: resources");
            }
            if (isMissing(resource)) continue;
            disposablesArray.push(toAsyncDisposable(resource));
        }
        return create(async () => {
            for (const disposable of disposablesArray) {
                await disposable[AsyncDisposable.asyncDispose]();
            }
        });
    }

    /**
     * Executes a callback with the provided `AsyncDisposable` resource, disposing the resource when the callback completes asynchronously.
     */
    export async function use<T extends AsyncDisposable | Disposable | null | undefined, U>(resource: T, callback: (resource: T) => U | PromiseLike<U>) {
        if (!isMissing(resource) && !Disposable.isDisposable(resource) && !AsyncDisposable.isAsyncDisposable(resource)) {
            throw new TypeError("AsyncDisposable expected: resource");
        }
        const disposable = toAsyncDisposable(resource);
        try {
            return await callback(resource);
        }
        finally {
            if (!isMissing(disposable)) {
                await disposable[AsyncDisposable.asyncDispose]();
            }
        }
    }
}
