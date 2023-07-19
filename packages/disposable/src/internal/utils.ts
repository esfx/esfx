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

/* @internal */
export {
    DisposeCapability,
    NewDisposeCapability,
    AddDisposableResource,
    DisposeMethod,
    GetDisposeMethod,
    ThrowCompletion,
    DisposeResources,
    CreateScope,
};

function GetMethod<V, P extends keyof V>(V: V, P: P): V[P] extends ((...args: any[]) => any) ? V[P] : undefined;
function GetMethod<V, P extends keyof V>(V: V, P: P) {
    // ECMA262 7.3.11 GetMethod ( _V_, _P_ )

    const func = V[P];
    if (isMissing(func)) return undefined;
    if (!isFunction(func)) throw new TypeError(`Property ${typeof P === "symbol" ? P.toString() : JSON.stringify(P)} is not a function.`);
    return func;
}

const Call: <T, A extends any[], R>(F: (this: T, ...args: A) => R, V: T, ...argumentsList: A ) => R =
    // ECMA262 7.3.14 Call ( _F_, _V_ [ , _argumentsList_ ] )
    Function.prototype.call.bind(Function.prototype.call);

interface DisposeCapability<Hint extends "sync-dispose" | "async-dispose"> {
    disposableResourceStack: DisposableResourceRecord<Hint>[] | undefined;
}

type DisposeMethod<Hint extends "sync-dispose" | "async-dispose"> =
    Hint extends "async-dispose" ?
        ((this: object | undefined) => void | PromiseLike<void>) :
        ((this: object | undefined) => void);

interface DisposableResourceRecord<Hint extends "sync-dispose" | "async-dispose"> {
    ResourceValue: object | undefined;
    Hint: Hint;
    DisposeMethod: DisposeMethod<Hint> | undefined;
}

function NewDisposeCapability<Hint extends "sync-dispose" | "async-dispose">(): DisposeCapability<Hint> {
    return { disposableResourceStack: [] };
}

interface ThrowCompletion {
    value: unknown;
}

function AddDisposableResource<Hint extends "sync-dispose" | "async-dispose">(disposeCapability: DisposeCapability<Hint>, V: unknown, hint: Hint, method?: DisposeMethod<Hint>) {
    // 3.1.2 AddDisposableResource ( _disposable_, _V_, _hint_ [ , _method_ ] )
    let resource: DisposableResourceRecord<Hint>;

    // *. Assert: _disposeCapability_.[[DisposableResourceStack]] is not ~empty~.
    if (!disposeCapability.disposableResourceStack) throw new Error("Illegal state.");

    // 1. If _method_ is not present then,
    if (arguments.length === 3) {
        // a. If _V_ is either *null* or *undefined* and _hint_ is ~sync-dispose~, then
        //    i. Return ~unused~.
        if ((V === null || V === undefined) && hint === "sync-dispose") return;

        // b. Let _resource_ be ? CreateDisposableResource(_V_, _hint_).
        resource = CreateDisposableResource(V, hint);
    }

    // 2. Else,
    else {
        // a. If _V_ is either *null* or *undefined*, then
        if (V === null || V === undefined) {
            // i. Let _resource_ be CreateDisposableResource(*undefined*, _hint_, _method_).
            resource = CreateDisposableResource(undefined, hint, method);
        }

        // b. Else,
        else {
            // i. If _V_ is not an Object, throw a *TypeError* exception.
            if (!isObject(V)) throw new TypeError("Object expected");

            // ii. Let _resource_ be CreateDisposableResource(_V_, _hint_, _method_).
            resource = CreateDisposableResource(V, hint, method);
        }
    }

    // 3. Append _resource_ to _disposeCapability_.[[DisposableResourceStack]].
    disposeCapability.disposableResourceStack[disposeCapability.disposableResourceStack.length] = resource;

    // 4. Return ~unused~.
}

function CreateDisposableResource<Hint extends "sync-dispose" | "async-dispose">(V: any, hint: Hint, method?: DisposeMethod<Hint>): DisposableResourceRecord<Hint> {
    // 3.1.3 CreateDisposableResource ( _V_, _hint_ [, _method_ ] )

    // 1. If _method_ is not present, then
    if (arguments.length === 2) {
        // a. If _V_ is either *null* or *undefined*, then
        if (V === null || V === undefined) {
            // i. Set _V_ to *undefined*.
            V = undefined;

            // ii. Set _method_ to *undefined*.
            method = undefined;
        }

        // b. Else,
        else {
            // i. If _V_ is not an Object, throw a *TypeError* exception.
            if (!isObject(V)) throw new TypeError("Object expected");

            // ii. Set _method_ to ? GetDisposeMethod(_V_, _hint_).
            method = GetDisposeMethod(V, hint);

            // iii. If _method_ is *undefined*, throw a *TypeError* exception.
            if (method === undefined) throw new TypeError(hint === "async-dispose" ? "Object not async disposable" : "Object not disposable");
        }
    }

    // 2. Else,
    else {
        // a. If IsCallable(_method_) is *false*, throw a *TypeError* exception.
        if (!isFunction(method)) throw new TypeError(hint === "async-dispose" ? "Object not async disposable" : "Object not disposable");
    }

    // 3. Return the DisposableResource Record { [[ResourceValue]]: _V_, [[Hint]]: _hint_, [[DisposeMethod]]: _method_ }.
    return { ResourceValue: V, Hint: hint, DisposeMethod: method } as DisposableResourceRecord<Hint>;
}

function GetDisposeMethod<Hint extends "sync-dispose" | "async-dispose">(V: object, hint: Hint): DisposeMethod<Hint> | undefined {
    // 3.1.4 GetDisposeMethod ( _V_, _hint_ )

    let method: DisposeMethod<Hint> | undefined;

    // 1. If _hint_ is ~async-dispose~, then
    if (hint === "async-dispose") {
        // a. Let _method_ be ? GetMethod(_V_, @@asyncDispose).
        method = GetMethod(V as AsyncDisposable, AsyncDisposable.asyncDispose);

        // b. If _method_ is *undefined*, then
        if (method === undefined) {
            // i. Set _method_ to ? GetMethod(_V_, @@dispose).
            method = GetMethod(V as Disposable, Disposable.dispose);
            // ii. Let _closure_ be a new Abstract Closure with no parameters that captures _method_ and performs the following steps when called:
            const closure = (void 0, function (this: object | undefined) {
                // 1. Let _O_ be the *this* value.
                // 2. Perform ? Call(_method_, _O_).
                // 3. Return *undefined*.
                Call(method!, this);
            });

            // iii. NOTE: This function is not observable to user code. It is used to ensure that a Promise returned from a synchronous `@@dispose` method will not be awaited.
            // iv. Return CreateBuiltinFunction(_closure_, 0, *""*, « »).
            return closure;
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

function * Await<T>(value: T): Generator<unknown, Awaited<T>, unknown> {
    return (yield value) as Awaited<T>;
}

function * Dispose<Hint extends "sync-dispose" | "async-dispose">(V: object | undefined, hint: Hint, method: DisposeMethod<Hint> | undefined) {
    // 3.1.5 Dispose ( _V_, _hint_, _method_ )

    let result: unknown;
    
    // 1. If _method_ is *undefined*, let _result_ be *undefined*.
    if (method === undefined) {
        result = undefined;
    }
    // 2. Else, let _result_ be ? Call(_method_, _V_).
    else {
        result = Call(method, V);
    }

    // 3. If _hint_ is ~async-dispose~, then
    if (hint === "async-dispose") {
        //    a. Perform ? Await(_result_).
        yield * Await(result);
    }

    // 4. Return *undefined*.
    return undefined;
}

function * DisposeResources<Hint extends "sync-dispose" | "async-dispose">(hint: Hint, disposeCapability: DisposeCapability<Hint>, throwCompletion: ThrowCompletion | undefined) {
    // 3.1.6 DisposeResources ( _disposeCapability_, _completion_ )

    // *. Assert: _disposeCapability_.[[DisposableResourceStack]] is not ~empty~.
    if (!disposeCapability.disposableResourceStack) throw new Error("Illegal state.");

    // 1. For each _resource_ of _disposeCapability_.[[DisposableResourceStack]], in reverse list order, do
    for (let i = disposeCapability.disposableResourceStack.length - 1; i >= 0; i--) {
        const resource = disposeCapability.disposableResourceStack[i];

        // a. Let _result_ be Dispose(_resource_.[[ResourceValue]], _resource_.[[Hint]], _resource_.[[DisposeMethod]]).
        try {
            yield * Dispose(resource.ResourceValue, resource.Hint, resource.DisposeMethod);
        }
        // b. If _result_.[[Type]] is ~throw~, then
        catch (e) {
            // i. If _completion_.[[Type]] is ~throw~, then
            if (throwCompletion) {
                // 1. Set _result_ to _result_.[[Value]].
                const result = e;
                
                // 2. Let _suppressed_ be _completion_.[[Value]].
                const suppressed = throwCompletion.value;

                // 3. Let _error_ be a newly created *SuppressedError* object.
                // 4. Perform CreateNonEnumerableDataPropertyOrThrow(_error_, "error", _result_).
                // 5. Perform CreateNonEnumerableDataPropertyOrThrow(_error_, "suppressed", _suppressed_).
                const error = CreateSuppressedError("sync-dispose", result, suppressed);

                // 6. Set _completion_ to ThrowCompletion(_error_).
                throwCompletion = { value: error };
            }
            else {
                // 1. Set _completion_ to _result_.
                throwCompletion = { value: e };
            }
        }
    }

    // *. NOTE: After _disposeCapability_ has been disposed, it will never be used again. The contents of _disposeCapability_.[[DisposableResourceStack]] can be discarded at this point.
    // *. Set _disposeCapability_.[[DisposableResourceStack]] to ~empty~.
    disposeCapability.disposableResourceStack = undefined;

    // 5. Return _completion_.
    if (throwCompletion) throw throwCompletion.value;
}

interface ScopeContext<Hint extends "sync-dispose" | "async-dispose"> {
    scope: Scope<Hint>;
    state: "initialized" | "exiting" | "done";
    disposables: DisposeCapability<Hint>;
    throwCompletion: ThrowCompletion | undefined;
}

type ScopeResource<Hint extends "sync-dispose" | "async-dispose"> =
    Hint extends "async-dispose" ?
        AsyncDisposable | Disposable :
        Disposable;

interface Scope<Hint extends "sync-dispose" | "async-dispose"> {
    using<T extends ScopeResource<Hint> | null | undefined>(value: T): T;
    fail(error: unknown): void;
}

function CreateScope<Hint extends "sync-dispose" | "async-dispose">(hint: Hint): ScopeContext<Hint> {
    // Credit to Mathieu Hofman for initial `for (const { using } of Disposable)` mechanism: https://github.com/mhofman/disposator/
    // See THIRD PARTY LICENSE NOTICE at the top of this file.
    // Modified to return a `fail` callback to emulate error suppression semantics of https://github.com/tc39/proposal-explicit-resource-management/
    const scope: Scope<Hint> = {
        using(resource) {
            if (context.state !== "initialized") throw new Error("Illegal state.");
            AddDisposableResource(context.disposables, resource, hint);
            return resource;
        },
        fail(error) {
            if (context.state !== "initialized") throw new Error("Illegal state.");
            context.throwCompletion = { value: error };
        }
    };
    const context: ScopeContext<Hint> = {
        scope: Object.freeze(scope),
        state: "initialized",
        disposables: NewDisposeCapability(),
        throwCompletion: undefined,
    };
    return context;
}

declare class SuppressedError extends Error {
    error: any;
    suppressed: any;
    constructor(error: any, suppressed: any, msg?: string);
}

function CreateSuppressedError<Hint extends "sync-dispose" | "async-dispose">(hint: Hint, error: any, suppressed: any, stackCrawlMark: Function = CreateSuppressedError): Error {
    let e: SuppressedError;
    const msg = hint === "sync-dispose" ?
        "An error during dispose resulted in an error suppression" :
        "An error during async dispose resulted in an error suppression";
    if (typeof SuppressedError === "function") {
        e = new SuppressedError(error, suppressed, msg);
    }
    else {
        e = new Error(msg) as SuppressedError;
        e.name = "SuppressedError";
        e.error = error;
        e.suppressed = suppressed;
    }
    if (Error.captureStackTrace) {
        Error.captureStackTrace(e, stackCrawlMark);
    }
    return e;
}

/* @internal */
export function execSync<T>(gen: Generator<unknown, T, unknown>) {
    const res = gen.next();
    if (res.done) return res.value;
    throw new Error("Illegal state");
}

/* @internal */
export function execAsync<T>(gen: Generator<unknown, T, unknown>) {
    return new Promise(resolve => resolve(step("next", /*value*/ undefined)));
    function step(verb: "next" | "throw", value: unknown): T | Promise<T> {
        const res = gen[verb](value);
        if (res.done) return res.value;
        return Promise.resolve(res.value).then(value => step("next", value), value => step("throw", value));
    }
}
