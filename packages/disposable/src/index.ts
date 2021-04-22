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
    const disposablePrototype: object = Object.defineProperty({ }, Symbol.toStringTag, { configurable: true, value: "Disposable" });
    const reportIsDisposableDeprecation = createDeprecation("Use 'Disposable.hasInstance' instead.");

    /**
     * A well-known symbol used to define an explicit resource disposal method on an object.
     */
    export const dispose = Symbol.for("@esfx/disposable:Disposable.dispose");

    /**
     * Creates a `Disposable` wrapper around a callback used to dispose of a resource.
     */
    export function create(dispose: () => void): Disposable {
        return Object.setPrototypeOf({ [Disposable.dispose]() { dispose(); } }, disposablePrototype);
    }

    /**
     * Creates a `Disposable` wrapper around a set of other disposables.
     * @param disposables An `Iterable` of `Disposable` objects.
     */
    export function from(disposables: Iterable<Disposable | null | undefined>) {
        const disposablesArray: DisposableRecord[] = [];
        let i = 0;
        for (const resource of disposables) {
            const record = ToDisposableRecord(resource);
            if (record === "not-disposable") throw new TypeError("Disposable element expected: disposables");
            if (record === undefined) continue;
            disposablesArray[i++] = record;
        }
        return create(() => Dispose(disposablesArray, undefined));
    }

    /**
     * Executes a callback with the provided `Disposable` resource, disposing the resource when the callback completes.
     */
    export function use<T extends Disposable | null | undefined, U>(resource: T, callback: (resource: T) => U) {
        const record = ToDisposableRecord(resource);
        if (record === "not-disposable") throw new TypeError("Disposable expected: resource");
        let completion: ErrorCompletion | undefined;
        try {
            return callback(resource);
        }
        catch (e) {
            completion = { value: e };
        }
        finally {
            Dispose(record && [record], completion);
        }
    }

    export const name = "Disposable";

    /**
     * Determines whether a value is Disposable.
     */
    export function hasInstance(value: unknown): value is Disposable {
        return typeof value === "object"
            && value != null
            && dispose in value;
    }

    Object.defineProperty(Disposable, Symbol.hasInstance, { writable: true, configurable: true, value: hasInstance });

    /**
     * Determines whether a value is Disposable.
     * @deprecated Use `Disposable.hasInstance` instead.
     */
    export function isDisposable(value: unknown): value is Disposable {
        reportIsDisposableDeprecation();
        return hasInstance(value);
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
    const asyncDisposablePrototype: object = Object.defineProperty({ }, Symbol.toStringTag, { configurable: true, value: "AsyncDisposable" });
    const reportIsAsyncDisposableDeprecation = createDeprecation("Use 'AsyncDisposable.hasInstance' instead.");

    /**
     * A well-known symbol used to define an async explicit resource disposal method on an object.
     */
    export const asyncDispose = Symbol.for("@esfx/disposable:AsyncDisposable.asyncDispose");

    /**
     * Creates an `AsyncDisposable` wrapper around a callback used to dispose resources.
     */
    export function create(dispose: () => void | PromiseLike<void>): AsyncDisposable {
        return Object.setPrototypeOf({ async [AsyncDisposable.asyncDispose]() { await dispose(); } }, asyncDisposablePrototype);
    }

    /**
     * Creates an `AsyncDisposable` wrapper around a set of other disposables.
     * @param resources An `Iterable` of `AsyncDisposable` or `Disposable` objects.
     */
    export function from(resources: Iterable<AsyncDisposable | Disposable | null | undefined>) {
        const disposablesArray: (AsyncDisposableRecord | DisposableRecord)[] = [];
        let i = 0;
        for (const resource of resources) {
            const record = ToAsyncDisposableRecord(resource);
            if (record === undefined) continue;
            if (record === "not-disposable") throw new TypeError("AsyncDisposable element expected: resources");
            disposablesArray[i++] = record;
        }
        return create(() => AsyncDispose(disposablesArray, undefined));
    }

    /**
     * Executes a callback with the provided `AsyncDisposable` resource, disposing the resource when the callback completes asynchronously.
     */
    export async function use<T extends AsyncDisposable | Disposable | null | undefined, U>(resource: T, callback: (resource: T) => U | PromiseLike<U>) {
        const record = ToAsyncDisposableRecord(resource);
        if (record === "not-disposable") throw new TypeError("AsyncDisposable expected: resource");
        let completion: ErrorCompletion | undefined;
        try {
            return await callback(resource);
        }
        catch (e) {
            completion = { value: e };
        }
        finally {
            await AsyncDispose(record && [record], completion);
        }
    }

    export const name = "AsyncDisposable";

    /**
     * Determines whether a value is [[AsyncDisposable]].
     */
    export function hasInstance(value: unknown): value is AsyncDisposable {
        return typeof value === "object"
            && value !== null
            && asyncDispose in value;
    }

    Object.defineProperty(AsyncDisposable, Symbol.hasInstance, { writable: true, configurable: true, value: hasInstance });

    /**
     * Determines whether a value is [[AsyncDisposable]].
     * @deprecated Use `AsyncDisposable.hasInstance` instead.
     */
    export function isAsyncDisposable(value: unknown): value is AsyncDisposable {
        reportIsAsyncDisposableDeprecation();
        return hasInstance(value);
    }
}

const Call: <T, A extends any[], R>(f: (this: T, ...args: A) => R, thisArg: T, ...args: A ) => R = Function.prototype.call.bind(Function.prototype.call);

interface DisposableRecord {
    hint: "sync";
    resource: object;
    disposeFn: (this: object) => void;
}

interface AsyncDisposableRecord {
    hint: "async";
    resource: object;
    asyncDisposeFn: (this: object) => Promise<void>;
}

interface ErrorCompletion {
    value: Error;
}

function ToDisposableRecord(resource: Disposable | null | undefined): DisposableRecord | "not-disposable" | undefined {
    if (resource !== null && resource !== undefined) {
        const disposeFn = typeof resource === "object" ? resource[Disposable.dispose] : undefined;
        if (typeof disposeFn !== "function") return "not-disposable";
        return { hint: "sync", resource, disposeFn };
    }
    return undefined;
}

function ToAsyncDisposableRecord(resource: AsyncDisposable | Disposable | null | undefined): AsyncDisposableRecord | DisposableRecord | "not-disposable" | undefined {
    if (resource !== null && resource !== undefined) {
        if (typeof resource === "object") {
            const asyncDisposeFn = (resource as AsyncDisposable)[AsyncDisposable.asyncDispose];
            if (asyncDisposeFn === undefined) {
                const disposeFn = (resource as Disposable)[Disposable.dispose];
                if (typeof disposeFn === "function") {
                    return { hint: "sync", resource, disposeFn };
                }
            }
            else if (typeof asyncDisposeFn === "function") {
                return { hint: "async", resource, asyncDisposeFn };
            }
            return "not-disposable";
        }
    }
    return undefined;
}

function Dispose(records: (DisposableRecord | undefined)[] | undefined, completion: ErrorCompletion | undefined) {
    let errors: any[] | undefined = completion ? [completion.value] : undefined;
    let i = completion ? 1 : 0;
    if (records) {
        for (const record of records) {
            try {
                if (record) Call(record.disposeFn, record.resource);
            }
            catch (e) {
                errors ||= [];
                errors[i++]
            }
        }
    }
    if (errors) {
        if (errors.length === 1) throw errors[0];
        ThrowAggregateError(errors, Dispose);
    }
}

async function AsyncDispose(records: (AsyncDisposableRecord | DisposableRecord | undefined)[] | undefined, completion: ErrorCompletion | undefined) {
    let errors: any[] | undefined = completion ? [completion.value] : undefined;
    let i = completion ? 1 : 0;
    if (records) {
        for (const record of records) {
            try {
                if (record) {
                    await Call(record.hint === "async" ? record.asyncDisposeFn : record.disposeFn, record.resource);
                }
            }
            catch (e) {
                errors ||= [];
                errors[i++] = e;
            }
        }
    }
    if (errors) {
        if (errors.length === 1) throw errors[0];
        ThrowAggregateError(errors, AsyncDispose);
    }
}

function ThrowAggregateError(errors: any[], stackCrawlMark: Function = ThrowAggregateError) {
    let error: AggregateError;
    if (typeof AggregateError === "function") {
        error = new AggregateError(errors);
    }
    else {
        error = new Error("One or more errors occurred") as AggregateError;
        error.name = "AggregateError";
        error.errors = errors;
    }
    if (Error.captureStackTrace) {
        Error.captureStackTrace(error, stackCrawlMark);
    }
    throw error;
}

function createDeprecation(message: string) {
    let hasReportedWarning = false;
    return () => {
        if (!hasReportedWarning) {
            hasReportedWarning = true;
            if (typeof process === "object" && process.emitWarning) {
                process.emitWarning(message, "Deprecation");
            }
            else if (typeof console === "object") {
                console.warn(`Deprecation: ${message}`)
            }
        }
    }
}
