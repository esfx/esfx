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

   CreateScope is derived from https://github.com/mhofman/disposator/ which
   is licensed under the Apache 2.0 License:

   Copyright 2021 Mathieu Hofman

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

/* @internal */
import type { Disposable } from "../disposable";
/* @internal */
import type { AsyncDisposable } from "../asyncDisposable";

export {};

/* @internal */
export const disposeSym: typeof Disposable.dispose = GetSymbol("dispose", "@esfx/disposable:Disposable.dispose") as typeof Disposable.dispose;

/* @internal */
export const asyncDisposeSym: typeof AsyncDisposable.asyncDispose = GetSymbol("asyncDispose", "@esfx/disposable:AsyncDisposable.asyncDispose") as typeof AsyncDisposable.asyncDispose;

/* @internal */
export const Call: <T, A extends any[], R>(f: (this: T, ...args: A) => R, thisArg: T, ...args: A ) => R = Function.prototype.call.bind(Function.prototype.call);

/* @internal */
export interface ThrowCompletion {
    cause: unknown;
}

/* @internal */
export function AddDisposableResource<Hint extends "sync" | "async">(disposableResourceStack: DisposableResourceRecord<Hint>[], V: unknown, hint: Hint) {
    if (V === null || V === undefined) return;
    if (typeof V !== "object" && typeof V !== "function") throw new TypeError("Object expected");
    const resource = CreateDisposableResource(V as object, hint);
    disposableResourceStack[disposableResourceStack.length] = resource;
}

/* @internal */
export function CreateDisposableResource<Hint extends "sync" | "async">(resource: object, hint: Hint): DisposableResourceRecord<Hint> {
    const dispose = GetDisposeMethod(resource, hint);
    if (dispose === undefined) {
        if (typeof resource === "function") {
            return { hint, resource: null, dispose: resource as DisposeMethod<Hint> };
        }
        throw new TypeError(hint === "async" ? "Object not async disposable" : "Object not disposable");
    }
    return { hint, resource, dispose } as DisposableResourceRecord<Hint>;
}

/* @internal */
export function GetDisposeMethod<Hint extends "sync" | "async">(resource: object, hint: Hint): DisposeMethod<Hint> | undefined {
    let method: DisposeMethod<Hint> | undefined;
    if (hint === "async") {
        method = GetMethod(resource as AsyncDisposable, asyncDisposeSym);
    }
    if (method === undefined) {
        method = GetMethod(resource as Disposable, disposeSym);
    }
    return method;
}

/* @internal */
export function GetMethod<T, K extends keyof T>(V: T, P: K) {
    const func = V[P];
    if (func === null || func === undefined) return undefined;
    if (typeof func !== "function") throw new TypeError(`Property ${typeof P === "symbol" ? P.toString() : JSON.stringify(P)} is not a function.`);
    return func;
}

/* @internal */
export function Dispose<Hint extends "sync" | "async">(V: object | null, hint: Hint, method: DisposeMethod<Hint>) {
    return hint === "async" ? execAsync() : execSync();

    function execSync() {
        Call(method, V);
    }

    async function execAsync() {
        const result = Call(method, V);
        if (result !== undefined) await result;
    }
}

/* @internal */
export function DisposeResources<Hint extends "sync" | "async">(hint: Hint, disposableResourceStack: DisposableResourceRecord<Hint>[] | undefined, suppress: boolean, throwCompletion: ThrowCompletion | undefined, errors: unknown[] = []): Hint extends "async" ? Promise<void> | void : void {
    return (hint === "async" ? execAsync() : execSync()) as Hint extends "async" ? Promise<void> | void : void;

    function execSync() {
        if (disposableResourceStack !== undefined) {
            for (let i = disposableResourceStack.length - 1; i >= 0; i--) {
                const resource = disposableResourceStack[i];
                try {
                    Dispose(resource.resource, resource.hint, resource.dispose);
                }
                catch (e) {
                    if (suppress) {
                        errors.length = 0;
                        throwCompletion = { cause: e };
                    }
                    else {
                        errors[errors.length] = e;
                    }
                }
            }
        }
        if (errors.length > 0) ThrowAggregateError(errors, throwCompletion, DisposeResources);
        if (throwCompletion) throw throwCompletion.cause;
    }

    async function execAsync() {
        if (disposableResourceStack !== undefined) {
            for (let i = disposableResourceStack.length - 1; i >= 0; i--) {
                const resource = disposableResourceStack[i];
                try {
                    const result = Dispose(resource.resource, resource.hint, resource.dispose);
                    if (result !== undefined) await result;
                }
                catch (e) {
                    if (suppress) {
                        errors.length = 0;
                        throwCompletion = { cause: e };
                    }
                    else {
                        errors[errors.length] = e;
                    }
                }
            }
        }
        if (errors.length > 0) ThrowAggregateError(errors, throwCompletion, DisposeResources);
        if (throwCompletion) throw throwCompletion.cause;
    }
}

type DisposeMethod<Hint extends "sync" | "async"> =
    Hint extends "async" ?
        ((this: object | null) => void | PromiseLike<void>) :
        ((this: object | null) => void);

type ScopeResource<Hint extends "sync" | "async"> =
    Hint extends "async" ?
        AsyncDisposable :
        Disposable;

/* @internal */
export interface DisposableResourceRecord<Hint extends "sync" | "async"> {
    hint: Hint;
    resource: object | null;
    dispose: DisposeMethod<Hint>;
}

interface ScopeContext<Hint extends "sync" | "async"> {
    scope: Scope<Hint>;
    state: "initialized" | "exiting" | "done";
    disposables: DisposableResourceRecord<Hint>[];
    throwCompletion: ThrowCompletion | undefined;
}

interface Scope<Hint extends "sync" | "async"> {
    using<T extends ScopeResource<Hint> | Disposable | DisposeMethod<Hint> | null | undefined>(value: T): T;
    fail(error: unknown): void;
}

/* @internal */
export function CreateScope<Hint extends "sync" | "async">(hint: Hint): ScopeContext<Hint> {
    // Credit to Mathieu Hofman for initial `for (const { using } of Disposable)` mechanism: https://github.com/mhofman/disposator/
    // See THIRD PARTY LICENSE NOTICE at the top of this file.
    // Modified to return a `fail` callback to emulate error suppression semantics of https://github.com/tc39/proposal-explicit-resource-management/
    const context: ScopeContext<Hint> = {
        scope: Object.freeze({
            using(resource) {
                if (context.state !== "initialized") throw new Error("Illegal state.");
                AddDisposableResource(context.disposables, resource, hint);
                return resource;
            },
            fail(error) {
                if (context.state !== "initialized") throw new Error("Illegal state.");
                context.throwCompletion = { cause: error };
            }
        }),
        state: "initialized",
        disposables: [],
        throwCompletion: undefined,
    };
    return context;
}

function ThrowAggregateError(errors: unknown[], throwCompletion: ThrowCompletion | undefined, stackCrawlMark: Function = ThrowAggregateError): never {
    let error: AggregateError;
    if (typeof AggregateError === "function") {
        error = new AggregateError(errors);
    }
    else {
        error = new Error("One or more errors occurred") as AggregateError;
        error.name = "AggregateError";
        error.errors = errors;
    }
    if (throwCompletion) {
        Object.defineProperty(error, "cause", { configurable: true, writable: true, value: throwCompletion.cause });
    }
    if (Error.captureStackTrace) {
        Error.captureStackTrace(error, stackCrawlMark);
    }
    throw error;
}

/* @internal */
function GetSymbol(builtInSymbolName: string, customSymbolName: string) {
    const builtInSymbol: symbol = (Symbol as any)[builtInSymbolName];
    return typeof builtInSymbol === "symbol" ? builtInSymbol : Symbol.for(customSymbolName);
}

/* @internal */
export interface Deprecation {
    (): void;
    reported?: boolean;
}

/* @internal */
export function createDeprecation(message: string) {
    const deprecation: Deprecation = () => {
        if (!deprecation.reported) {
            deprecation.reported = true;
            if (typeof process === "object" && process.emitWarning) {
                process.emitWarning(message, "DeprecationWarning", deprecation);
            }
            else if (typeof console === "object") {
                console.warn(`Deprecation: ${message}`)
            }
        }
    }
    return deprecation;
}
