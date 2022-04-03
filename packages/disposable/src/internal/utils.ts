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
import /*#__INLINE__*/ { isFunction, isMissing, isObject } from "@esfx/internal-guards";
/* @internal */
import { AsyncDisposable } from "../asyncDisposable.js";
/* @internal */
import { Disposable } from "../disposable.js";

export { };

/* @internal */
export function GetMethod<V, P extends keyof V>(V: V, P: P): V[P] extends ((...args: any[]) => any) ? V[P] : undefined;
export function GetMethod<V, P extends keyof V>(V: V, P: P) {
    // ECMA262 7.3.11 GetMethod ( _V_, _P_ )

    const func = V[P];
    if (isMissing(func)) return undefined;
    if (!isFunction(func)) throw new TypeError(`Property ${typeof P === "symbol" ? P.toString() : JSON.stringify(P)} is not a function.`);
    return func;
}

/* @internal */
export const Call: <T, A extends any[], R>(F: (this: T, ...args: A) => R, V: T, ...argumentsList: A ) => R =
    // ECMA262 7.3.14 Call ( _F_, _V_ [ , _argumentsList_ ] )
    Function.prototype.call.bind(Function.prototype.call);

/* @internal */
export function SpeciesConstructor<C extends new (...args: any) => any>(O: any, defaultConstructor: C): C {
    // ECMA262 7.3.23 SpeciesConstructor ( _O_, _defaultConstructor_ )

    const C = O.constructor;
    if (C === undefined) return defaultConstructor;
    if (!isObject(C)) throw new TypeError("Object expected");
    const S = O[Symbol.species];
    if (isMissing(S)) return defaultConstructor;
    if (isFunction(S)) return S;
    throw new TypeError("constructor not found");
}

/* @internal */
export interface ThrowCompletion {
    cause: unknown;
}

/* @internal */
export function AddDisposableResource<Hint extends "sync" | "async">(disposableResourceStack: DisposableResourceRecord<Hint>[], V: unknown, hint: Hint, method?: () => void) {
    // 3.1.2 AddDisposableResource ( _disposable_, _V_, _hint_ [ , _method_ ] )
    let resource: DisposableResourceRecord<Hint>;

    // 1. If _method_ is not present then,
    if (!method) {
        // a. If _V_ is *null* or *undefined*, return NormalCompletion(~empty~).
        if (V === null || V === undefined) return;

        // b. If Type(_V_) is not Object, throw a *TypeError* exception.
        if (!isObject(V)) throw new TypeError("Object expected");

        // c. Let _resource_ be ? CreateDisposableResource(_V_, _hint_)/
        resource = CreateDisposableResource(V, hint);
    }

    // 2. Else,
    else {
        // a. If _V_ is *null* or *undefined*, then
        if (V === null || V === undefined) {
            // i. Let _resource_ be CreateDisposableResource(*undefined*, _hint_, _method_).
            resource = CreateDisposableResource(undefined, hint, method);
        }

        // b. Else,
        else {
            // i. If Type(_V_) is not Object, throw a *TypeError* exception.
            if (!isObject(V)) throw new TypeError("Object expected");

            // ii. Let _resource_ be CreateDisposableResource(_V_, _hint_, _method_).
            resource = CreateDisposableResource(V, hint, method);
        }
    }

    // 3. Append _resource_ to _disposable_.[[DisposableResourceStack]].
    disposableResourceStack[disposableResourceStack.length] = resource;

    // 4. Return NormalCompletion(~empty~).
}

/* @internal */
export function CreateDisposableResource<Hint extends "sync" | "async">(V: object | undefined, hint: Hint, method?: DisposeMethod<Hint>): DisposableResourceRecord<Hint> {
    // 3.1.3 CreateDisposableResource ( _V_, _hint_ [, _method_ ] )

    // 1. If _method_ is not present, then
    if (!method) {
        // a. If _V_ is *undefined*, throw a *TypeError* exception.
        if (V === undefined) throw new TypeError("Object expected");

        // b. Set _method_ to ? GetDisposeMethod(_V_, _hint_).
        method = GetDisposeMethod(V, hint);

        // c. If _method_ is *undefined*, throw a *TypeError* exception.
        if (method === undefined) throw new TypeError(hint === "async" ? "Object not async disposable" : "Object not disposable");
    }

    // 2. Else,
    else {
        // a. If IsCallable(_method_) is *false*, throw a *TypeError* exception.
        if (!isFunction(method)) throw new TypeError(hint === "async" ? "Object not async disposable" : "Object not disposable");
    }

    // 3. Return the DisposableResource Record { [[ResourceValue]]: _V_, [[Hint]]: _hint_, [[DisposeMethod]]: _method_ }.
    return { resource: V, hint, dispose: method } as DisposableResourceRecord<Hint>;
}

/* @internal */
export function GetDisposeMethod<Hint extends "sync" | "async">(V: object, hint: Hint): DisposeMethod<Hint> | undefined {
    // 3.1.4 GetDisposeMethod ( _V_, _hint_ )

    let method: DisposeMethod<Hint> | undefined;

    // 1. If _hint_ is ~async~, then
    if (hint === "async") {
        // a. Let _method_ be ? GetMethod(_V_, @@asyncDispose).
        // b. If _method_ is *undefined*, then
            // i. Set _method_ to ? GetMethod(_V_, @@dispose).
        method = GetMethod(V as AsyncDisposable, AsyncDisposable.asyncDispose);
        if (method === undefined) {
            method = GetMethod(V as Disposable, Disposable.dispose);
        }
    }

    // 2. Else,
    else {
        // a. Let _method_ be ? GetMethod(_V_, @@dispose).
        method = GetMethod(V as Disposable, Disposable.dispose);
    }

    // 3. Return _method_.
    return method;
}

/* @internal */
export function Dispose<Hint extends "sync" | "async">(V: object | undefined, hint: Hint, method: DisposeMethod<Hint>) {
    // 3.1.5 Dispose ( _V_, _hint_, _method_ )

    return hint === "async" ?
        DisposeAsync(V, method) :
        DisposeSync(V, method);
}

function DisposeSync(V: object | undefined, method: DisposeMethod<"sync">) {
    // 3.1.5 Dispose ( _V_, _hint_, _method_ )
    // NOTE: when _hint_ is ~sync~

    // 1. [Let _result_ be] ? Call(_method_, _V_).
    Call(method, V);

    // 2. [If _hint_ is ~async~ and _result_ is not *undefined*, then]

    // 3. Return *undefined*.
}

async function DisposeAsync(V: object | undefined, method: DisposeMethod<"async">) {
    // 3.1.5 Dispose ( _V_, _hint_, _method_ )
    // NOTE: when _hint_ is ~async~

    // 1. Let _result_ be ? Call(_method_, _V_).
    const result = Call(method, V);

    // 2. If [_hint_ is ~async~ and] _result_ is not *undefined*, then
    if (result !== undefined) {
        await result;
    }

    // 3. Return *undefined*.
}

/* @internal */
export function DisposeResources<Hint extends "sync" | "async">(hint: Hint, disposableResourceStack: DisposableResourceRecord<Hint>[] | undefined, throwCompletion: ThrowCompletion | undefined, errors?: unknown[]): Hint extends "async" ? Promise<void> | void : void;
export function DisposeResources<Hint extends "sync" | "async">(hint: Hint, disposableResourceStack: DisposableResourceRecord<Hint>[] | undefined, throwCompletion: ThrowCompletion | undefined, errors?: unknown[]) {
    // 3.1.6 DisposeResources ( _disposable_, _completion_, [ , _errors_ ] )
    return hint === "async" ?
        DisposeResourcesAsync(disposableResourceStack as DisposableResourceRecord<"async">[] | undefined, throwCompletion, errors) :
        DisposeResourcesSync(disposableResourceStack as DisposableResourceRecord<"sync">[] | undefined, throwCompletion, errors);
}

function DisposeResourcesSync(disposableResourceStack: DisposableResourceRecord<"sync">[] | undefined, throwCompletion: ThrowCompletion | undefined, errors?: unknown[]) {
    // 3.1.6 DisposeResources ( _disposable_, _completion_, [ , _errors_ ] )
    // NOTE: when _hint_ is ~sync~

    // 1. If _errors_ is not present, let _errors_ be a new empty List.
    errors ??= [];

    // 2. If _disposable_ is not *undefined*, then
    if (disposableResourceStack !== undefined) {
        // a. For each _resource_ of _disposable_.[[DisposableResourceStack]], in reverse list order, do
        for (let i = disposableResourceStack.length - 1; i >= 0; i--) {
            const resource = disposableResourceStack[i];
            
            // i. Let _result_ be Dispose(_resource_.[[ResourceValue]], _resource_.[[Hint]], _resource_.[[DisposeMethod]]).
            try {
                Dispose(resource.resource, resource.hint, resource.dispose);
            }
            catch (e) {
                // 1. If _result_.[[Type]] is ~throw~, then
                //   a. Append _result_.[[Value]] to _errors_.
                errors[errors.length] = e;
            }
        }
    }

    // 3. Let _errorsLength_ be the number of elements in _errors_.
    // 4. If _errorsLength_ &gt; 0, then
    if (errors.length > 0) {
        // a. Let _error_ be a newly created `AggregateError` object.
        // b. Perform ! DefinePropertyOrThrow(_error_, *"errors"*, PropertyDescriptor { [[Configurable]]: *true*, [[Enumerable]]: *false*, [[Writable]]: *true*, [[Value]]: ! CreateArrayFromList(_errors_) }).
        // c. If _completion_.[[Type]] is ~throw~, then
        //   i. Perform ! CreateNonEnumerableDataPropertyOrThrow(_error_, "cause", _completion_.[[Value]]).
        // d. Return ThrowCompletion(_error_).
        ThrowAggregateError(errors, throwCompletion, DisposeResources);
    }

    // 5. Return _completion_.
    if (throwCompletion) throw throwCompletion.cause;
}

async function DisposeResourcesAsync(disposableResourceStack: DisposableResourceRecord<"async">[] | undefined, throwCompletion: ThrowCompletion | undefined, errors?: unknown[]) {
    // 3.1.6 DisposeResources ( _disposable_, _completion_, [ , _errors_ ] )
    // NOTE: when _hint_ is ~async~

    // 1. If _errors_ is not present, let _errors_ be a new empty List.
    errors ??= [];

    // 2. If _disposable_ is not *undefined*, then
    if (disposableResourceStack !== undefined) {
        // a. For each _resource_ of _disposable_.[[DisposableResourceStack]], in reverse list order, do
        for (let i = disposableResourceStack.length - 1; i >= 0; i--) {
            const resource = disposableResourceStack[i];

            // i. Let _result_ be Dispose(_resource_.[[ResourceValue]], _resource_.[[Hint]], _resource_.[[DisposeMethod]]).
            try {
                await Dispose(resource.resource, resource.hint, resource.dispose);
            }
            catch (e) {
                // 1. If _result_.[[Type]] is ~throw~, then
                //   a. Append _result_.[[Value]] to _errors_.
                errors[errors.length] = e;
            }
        }
    }

    // 3. Let _errorsLength_ be the number of elements in _errors_.
    // 4. If _errorsLength_ &gt; 0, then
    if (errors.length > 0) {
        // a. Let _error_ be a newly created `AggregateError` object.
        // b. Perform ! DefinePropertyOrThrow(_error_, *"errors"*, PropertyDescriptor { [[Configurable]]: *true*, [[Enumerable]]: *false*, [[Writable]]: *true*, [[Value]]: ! CreateArrayFromList(_errors_) }).
        // c. If _completion_.[[Type]] is ~throw~, then
        //   i. Perform ! CreateNonEnumerableDataPropertyOrThrow(_error_, "cause", _completion_.[[Value]]).
        // d. Return ThrowCompletion(_error_).
        ThrowAggregateError(errors, throwCompletion, DisposeResources);
    }

    // 5. Return _completion_.
    if (throwCompletion) throw throwCompletion.cause;
}

/* @internal */
export type DisposeMethod<Hint extends "sync" | "async"> =
    Hint extends "async" ?
        ((this: object | undefined) => void | PromiseLike<void>) :
        ((this: object | undefined) => void);

/* @internal */
export interface DisposableResourceRecord<Hint extends "sync" | "async"> {
    hint: Hint;
    resource: object | undefined;
    dispose: DisposeMethod<Hint>;
}

interface ScopeContext<Hint extends "sync" | "async"> {
    scope: Scope<Hint>;
    state: "initialized" | "exiting" | "done";
    disposables: DisposableResourceRecord<Hint>[];
    throwCompletion: ThrowCompletion | undefined;
}

type ScopeResource<Hint extends "sync" | "async"> =
    Hint extends "async" ?
        AsyncDisposable :
        Disposable;

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
