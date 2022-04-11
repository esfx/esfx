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

   CancelToken is derived from the implementation of CancellationToken in
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

import { Cancelable, CancelableSource, CancelError, CancelSignal, CancelSubscription } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";
import /*#__INLINE__*/ { isFunction, isIterableObject, isMissing, isPositiveFiniteNumber } from "@esfx/internal-guards";
import /*#__INLINE__*/ { LinkedList, LinkedListNode, listAdd, listCreate, listRemove } from "@esfx/internal-linked-list";

export { CancelError, CancelSubscription } from "@esfx/cancelable";

// #region DOM AbortController/AbortSignal compatibility

type DOMAbortSignal = (typeof globalThis) extends { AbortSignal: Function & { prototype: infer TAbortSignal } } ? TAbortSignal : never;

interface AbortController {
    readonly signal: AbortSignal;
    abort(reason?: unknown): void
}

declare var AbortController: { new(): AbortController; prototype: AbortController };

interface AbortSignal {
    readonly aborted: boolean;
    readonly reason?: unknown;
    addEventListener(event: string, listener: () => void): void;
    removeEventListener(event: string, listener: () => void): void;
}

declare var AbortSignal: { new(): AbortSignal; prototype: AbortSignal };

let AbortControllerAbort: ((obj: AbortController, reason?: unknown) => void) | undefined;
let AbortControllerGetSignal: ((obj: AbortController) => AbortSignal) | undefined;
let AbortSignalAddEventListener: ((obj: AbortSignal, event: string, listener: () => void) => void) | undefined;
let AbortSignalRemoveEventListener: ((obj: AbortSignal, event: string, listener: () => void) => void) | undefined;
let AbortSignalGetAborted: ((obj: AbortSignal) => boolean) | undefined;
let AbortSignalGetReason: ((obj: AbortSignal) => unknown) | undefined;

if (typeof AbortController === "function" && typeof AbortSignal === "function") {
    const uncurryThis = Function.prototype.bind.bind(Function.prototype.call) as <T, A extends unknown[], R>(f: (this: T, ...args: A) => R) => (this_: T, ...args: A) => R;
    AbortControllerAbort = uncurryThis(AbortController.prototype.abort);
    AbortControllerGetSignal = uncurryThis(Object.getOwnPropertyDescriptor(AbortController.prototype, "signal")!.get!);
    AbortSignalAddEventListener = uncurryThis(AbortSignal.prototype.addEventListener);
    AbortSignalRemoveEventListener = uncurryThis(AbortSignal.prototype.removeEventListener);
    AbortSignalGetAborted = uncurryThis(Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!);
    AbortSignalGetReason = "reason" in AbortSignal.prototype ? uncurryThis(Object.getOwnPropertyDescriptor(AbortSignal.prototype, "reason")!.get!) : undefined;
}

// #endregion DOM AbortController/AbortSignal compatibility

const emptySubscription = Cancelable.none.subscribe(() => {});
const defaultReason = Cancelable.canceled.reason;

interface CancelLinks {
    getLinkedState(): "unsignaled" | "signaled" | "closed";
    unlink(): void;
}

class CancelState {
    static createCancelToken: (cancelState: CancelState) => CancelToken;

    static closed: CancelState;
    static canceled: CancelState;

    static {
        this.closed = new CancelState();
        this.closed.close();

        this.canceled = new CancelState();
        this.canceled.cancel(new CancelError());
    }

    private _links: CancelLinks | undefined;
    private _state: "unsignaled" | "signaled" | "closed" = "unsignaled";
    private _reason: unknown;
    private _source: CancelSource | undefined;
    private _token: CancelToken | undefined;
    private _subscriptions: LinkedList<() => void> | undefined;
    private _abortController: AbortController | undefined;
    private _pendingCancelAfters: ReturnType<typeof setTimeout>[] = [];

    constructor(links?: CancelLinks) {
        this._links = links;
    }

    get state() {
        return this._state === "unsignaled" && this._links ? this._links.getLinkedState() : this._state;
    }

    get source() {
        return this._source ??= new CancelSource(this);
    }

    get token() {
        return this._token ??= CancelState.createCancelToken(this);
    }

    get reason() {
        return this._reason;
    }

    get abortController() {
        if (!this._abortController && typeof AbortController === "function") {
            this._abortController = new AbortController();
            if (this._state === "signaled") {
                AbortControllerAbort!(this._abortController, this._reason);
            }
        }
        return this._abortController;
    }

    get abortSignal() {
        const abortController = this.abortController;
        return abortController ? AbortControllerGetSignal!(abortController) : undefined;
    }

    static race(signals: CancelSignal[]) {
        const subscriptions: CancelSubscription[] = [];
        const cancelState = new CancelState({
            getLinkedState() {
                return signals.some(isSignaled) ? "signaled" :
                    signals.some(canBeSignaled) ? "unsignaled" :
                    "closed";
            },
            unlink() {
                if (subscriptions.length > 0) {
                    for (const subscription of subscriptions.splice(0, subscriptions.length)) {
                        subscription.unsubscribe();
                    }
                }
            }
        });

        for (const signal of signals) {
            let signaled = false;
            const onSignaled = () => {
                if (!signaled) {
                    signaled = true;
                    cancelState.cancel(signal.reason ?? defaultReason);
                }
            };

            if (signal.signaled) {
                onSignaled();
                break;
            }
            else {
                subscriptions.push(signal.subscribe(onSignaled));
            }
        }

        return cancelState;
    }

    cancel(reason: unknown) {
        if (this._state !== "unsignaled") return;

        const links = this._links;
        const subscriptions = this._subscriptions;
        const abortController = this._abortController;
        const pendingCancelAfters = this._pendingCancelAfters.splice(0, this._pendingCancelAfters.length);

        this._state = "signaled";
        this._reason = reason;
        this._links = undefined;
        this._subscriptions = undefined;
        this._abortController = undefined;

        for (const timeout of pendingCancelAfters) {
            clearTimeout(timeout);
        }

        try {
            links?.unlink();

            if (subscriptions) {
                const callbacks: (() => void)[] = [];
                while (subscriptions.head) {
                    // The registration for each callback holds onto the node, the node holds onto the
                    // list, and the list holds all other nodes and callbacks. By removing the node from
                    // the list, the GC can collect any otherwise unreachable nodes.
                    const head = subscriptions.head;
                    if (listRemove(subscriptions, head)) {
                        callbacks.push(head.value);
                        head.value = undefined!;
                    }
                }

                for (const callback of callbacks) {
                    executeCallback(callback);
                }
            }
        }
        finally {
            if (abortController) {
                AbortControllerAbort!(abortController, this._reason);
            }
        }
    }

    cancelAfter(ms: number, reason: unknown) {
        if (this._state === "unsignaled") {
            this._pendingCancelAfters.push(setTimeout(() => this.cancel(reason), ms));
        }
    }

    close() {
        if (this._state !== "unsignaled") return;

        const currentLinks = this._links;
        const currentSubscriptions = this._subscriptions;
        const pendingCancelAfters = this._pendingCancelAfters.splice(0, this._pendingCancelAfters.length);

        this._state = "closed";
        this._reason = undefined;
        this._links = undefined;
        this._subscriptions = undefined;
        this._abortController = undefined;

        for (const timeout of pendingCancelAfters) {
            clearTimeout(timeout);
        }

        currentLinks?.unlink();
        if (currentSubscriptions) {
            while (currentSubscriptions.head) {
                const head = currentSubscriptions.head;
                if (listRemove(currentSubscriptions, head)) {
                    head.value = undefined!;
                }
            }
        }
    }

    subscribe(onSignaled: () => void): CancelSubscription {
        if (this.state !== "unsignaled") {
            throw new Error("Illegal state");
        }

        const list = this._subscriptions ??= listCreate();
        return createCancelSubscription(list, listAdd(list, onSignaled));
    }
}

/**
 * Signals a CancelToken when cancellation has been requested.
 */
export interface CancelSource extends CancelableSource, Disposable {
    /**
     * Gets the CancelToken linked to this source.
     */
    readonly token: CancelToken;

    /**
     * Cancels the source, evaluating any subscribed callbacks. If any callback raises an exception,
     * the exception is propagated to a host specific unhandled exception mechanism.
     */
    cancel(reason?: unknown): void;

    /**
     * Closes the source, preventing the possibility of future cancellation.
     */
    close(): void;
}

const weakCancelSourceState = new WeakMap<CancelSource, CancelState>();

const CancelSource = class implements CancelSource {
    static {
        // Hide the constructor from the prototype
        Object.defineProperty(this.prototype, "constructor", { ...Object.getOwnPropertyDescriptor(this.prototype, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "CancelSource" });
    }

    constructor(cancel: CancelState) {
        weakCancelSourceState.set(this, cancel);
        Object.freeze(this);
    }

    get token() {
        const cancel = weakCancelSourceState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelSource");
        return cancel.token;
    }

    cancel(reason?: unknown) {
        const cancel = weakCancelSourceState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelSource");
        if (cancel.state === "unsignaled") {
            cancel.cancel(reason ?? new CancelError());
        }
    }

    cancelAfter(timeout: number, reason?: unknown) {
        if (!isPositiveFiniteNumber(timeout)) throw new RangeError("Argument out of range: timeout");

        const cancel = weakCancelSourceState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelSource");
        if (cancel.state === "unsignaled") {
            cancel.cancelAfter(timeout, reason ?? new CancelError("Operation timed out"));
        }
    }

    close() {
        const cancel = weakCancelSourceState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelSource");
        cancel.close();
    }

    [CancelableSource.cancelSignal]() {
        return this.token;
    }

    [CancelableSource.cancel](reason?: unknown) {
        this.cancel(reason);
    }

    [Disposable.dispose]() {
        this.close();
    }
};

const weakCancelTokenState = new WeakMap<CancelToken, CancelState>();

/**
 * Propagates notifications that operations should be canceled.
 */
export class CancelToken implements Cancelable, CancelSignal {
    static {
        CancelState.createCancelToken = cancelState => {
            // If it is available, make the token an `AbortSignal` instance with a `CancelToken` prototype.
            // This gives the token the same internal state as an `AbortSignal` and allows the token to be
            // used in `fetch` and other DOM apis.
            const abortSignal = cancelState.abortSignal;
            const token: CancelToken = abortSignal ?
                Object.setPrototypeOf(abortSignal, CancelToken.prototype) :
                Object.create(CancelToken.prototype);
            weakCancelTokenState.set(token, cancelState);
            Object.freeze(token);
            return token;
        }

        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "CancelToken" });
    }

    static readonly none = CancelState.closed.token;
    static readonly canceled = CancelState.canceled.token;

    private constructor() {
        throw new TypeError("Object not creatable.");
    }

    /**
     * Gets a value indicating whether the token is signaled.
     */
    get signaled() {
        const cancel = weakCancelTokenState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelToken");
        return cancel.state === "signaled";
    }

    /**
     * Gets the reason for cancellation.
     */
    get reason() {
        const cancel = weakCancelTokenState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelToken");
        return cancel.reason;
    }

    /**
     * Gets a value indicating whether the token can be signaled.
     */
    get canBeSignaled() {
        const cancel = weakCancelTokenState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelToken");
        return cancel.state !== "closed";
    }

    /**
     * Adapts a {@link CancelToken} from a cancelable.
     */
     static from(cancelable: Cancelable | DOMAbortSignal | null | undefined) {
        if (cancelable === Cancelable.none || isMissing(cancelable)) {
            return CancelToken.none;
        }
        if (cancelable === Cancelable.canceled) {
            return CancelToken.canceled;
        }
        if (cancelable instanceof CancelSource) {
            return cancelable.token;
        }
        if (cancelable instanceof CancelToken) {
            return cancelable;
        }
        if (typeof AbortSignal === "function" && cancelable instanceof AbortSignal) {
            return getCancelTokenFromAbortSignal(cancelable);
        }
        if (Cancelable.hasInstance(cancelable)) {
            return getCancelTokenFromCancelable(cancelable);
        }
        throw new TypeError("Cancelable exepected: cancelable");
    }

    /**
     * Creates a new {@link CancelSource}.
     *
     * @param cancelables An optional iterable of `Cancelable` objects. If present,
     * the source becomes linked to the provided cancelables and will be canceled
     * when a linked cancelable is canceled.
     *
     * @remarks Calling {@link source} with `cancelables` is similar to {@link race}, except you can
     * individually cancel or close the resulting source. This can be better for memory or GC purposes,
     * since when the resulting source is canceled or closed it can be unlinked from the cancelables,
     * removing references from each cancelable to the resulting source which could otherwise prevent
     * garbage collection.
     */
    static source(cancelables?: Iterable<Cancelable | DOMAbortSignal | null | undefined>): CancelSource {
        if (isMissing(cancelables)) {
            return new CancelState().source;
        }

        if (!isIterableObject(cancelables)) {
            throw new TypeError("Object not iterable: cancelables");
        }

        const signals = getCancelSignalArrayFromCancelables(cancelables);
        if (!signals) {
            throw new TypeError("Cancelable element expected: cancelables");
        }

        if (!signals.some(canBeSignaled)) {
            return new CancelState().source;
        }

        return CancelState.race(signals).source;
    }

    /**
     * Returns a `CancelToken` that becomes signaled when **any** of the provided cancelables are signaled.
     *
     * @param cancelables An iterable of `Cancelable` objects.
     *
     * @remarks This is similar to calling {@link source} with the provided cancelables. In general,
     * calling {@link source} is preferred as it provides better resource management.
     */
    static race(cancelables: Iterable<Cancelable | DOMAbortSignal | null | undefined>) {
        if (!isIterableObject(cancelables)) {
            throw new TypeError("Object not iterable: cancelables");
        }

        const signals = getCancelSignalArrayFromCancelables(cancelables);
        if (!signals) {
            throw new TypeError("Cancelable element expected: cancelables");
        }

        if (!signals.some(canBeSignaled)) {
            return CancelToken.none;
        }

        return CancelState.race(signals).token;
    }

    /**
     * Returns a `CancelToken` that becomes signaled when **all** of the provided cancelables are signaled.
     *
     * @param cancelables An iterable of `Cancelable` objects.
     */
    static all(cancelables: Iterable<Cancelable | DOMAbortSignal | null | undefined>) {
        if (!isIterableObject(cancelables)) {
            throw new TypeError("Object not iterable: cancelables");
        }

        const signals = getCancelSignalArrayFromCancelables(cancelables);
        if (!signals) {
            throw new TypeError("Cancelable element expected: cancelables");
        }

        if (!signals.some(canBeSignaled)) {
            return CancelToken.none;
        }

        const reasons: unknown[] = [];
        const subscriptions: CancelSubscription[] = [];
        const cancelState = new CancelState({
            getLinkedState() {
                return signals.every(isSignaled) ? "signaled" :
                    signals.some(canBeSignaled) ? "unsignaled" :
                    "closed";
            },
            unlink() {
                if (subscriptions.length > 0) {
                    for (const subscription of subscriptions.splice(0, subscriptions.length)) {
                        subscription.unsubscribe();
                    }
                }
            }
        });

        let signalsRemaining = signals.length;
        for (let i = 0; i < signals.length; i++) {
            let signaled = false;
            const signal = signals[i];
            const onSignaled = () => {
                if (!signaled) {
                    signaled = true;
                    signalsRemaining--;
                    reasons[i] = signal.reason ?? defaultReason;
                    if (signalsRemaining === 0) {
                        const error = new CancelError();
                        if (!reasons.every(reason => reason === defaultReason)) {
                            Object.defineProperty(error, "cause", { enumerable: false, configurable: true, writable: true, value: new AggregateError(reasons) });
                        }
                        cancelState.cancel(error);
                    }
                }
            };

            if (signal.signaled) {
                onSignaled();
            }
            else {
                subscriptions.push(signal.subscribe(onSignaled));
            }
        }

        return cancelState.token;
    }

    /**
     * Gets a `CancelToken` that is already canceled with the provided reason.
     */
    static canceledWith(reason: unknown) {
        const cancelState = new CancelState();
        cancelState.cancel(reason ?? new CancelError());
        return cancelState.token;
    }

    /**
     * Gets a `CancelToken` that will be canceled with the provided reason after a timeout has elapsed.
     */
    static timeout(ms: number, reason?: unknown) {
        if (!isPositiveFiniteNumber(ms)) throw new RangeError("Argument out of range: ms");

        const cancelState = new CancelState();
        cancelState.cancelAfter(ms, reason ?? new CancelError("Operation timed out"));
        return cancelState.token;
    }

    /**
     * Throws a CancelError if the token was signaled.
     */
    throwIfSignaled() {
        const cancel = weakCancelTokenState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelToken");
        if (cancel.state === "signaled") {
            throw cancel.reason;
        }
    }

    /**
     * Subscribes to notifications for when the object becomes signaled.
     */
    subscribe(onSignaled: () => void): CancelSubscription {
        if (!isFunction(onSignaled)) throw new TypeError("Function expected: onSignaled");

        const cancel = weakCancelTokenState.get(this);
        if (!cancel) throw new TypeError("Value of 'this' must be of type CancelToken");
        if (cancel.state === "closed") return emptySubscription;
        if (cancel.state === "signaled") return onSignaled(), emptySubscription;
        return cancel.subscribe(onSignaled);
    }

    // #region Cancelable
    [Cancelable.cancelSignal](): CancelToken {
        return this;
    }
    // #endregion Cancelable
}

// helpers

const weakCancelTokenFromCancelSignal = new WeakMap<CancelSignal, CancelToken>();
const weakCancelTokenFromAbortSignal = typeof AbortSignal === "function" ? new WeakMap<AbortSignal, CancelToken>() : undefined;
const weakCancelSignalFromAbortSignal = typeof AbortSignal === "function" ? new WeakMap<AbortSignal, CancelSignal>() : undefined;

function getCancelSignalArrayFromCancelables(cancelables: Iterable<Cancelable | DOMAbortSignal | null | undefined>): CancelSignal[] | undefined {
    const signals: CancelSignal[] = [];
    for (const cancelable of cancelables) {
        const signal: CancelSignal | undefined =
            cancelable === null || cancelable === undefined ? CancelToken.none :
            cancelable instanceof CancelToken ? cancelable :
            typeof AbortSignal === "function" && cancelable instanceof AbortSignal ? getCancelSignalFromAbortSignal(cancelable) :
            Cancelable.hasInstance(cancelable) ? cancelable[Cancelable.cancelSignal]() :
            undefined;

        if (!signal) {
            return undefined;
        }

        signals.push(signal);
    }

    return signals;
}

function getCancelTokenFromCancelSignal(cancelSignal: CancelSignal): CancelToken {
    if (cancelSignal instanceof CancelToken) {
        return cancelSignal;
    }

    let cancelToken = weakCancelTokenFromCancelSignal?.get(cancelSignal);
    if (!cancelToken) {
        let subscription: CancelSubscription | undefined;

        const cancelState = new CancelState({
            getLinkedState() {
                return isSignaled(cancelSignal) ? "signaled" :
                    canBeSignaled(cancelSignal) ? "unsignaled" :
                    "closed";
            },
            unlink() {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = undefined;
                }
            }
        });

        subscription = cancelSignal.subscribe(() => {
            cancelState.cancel(cancelSignal.reason ?? defaultReason);
        });

        cancelToken = cancelState.token;
        weakCancelTokenFromCancelSignal?.set(cancelSignal, cancelToken);
    }
    return cancelToken;
}

function getCancelTokenFromCancelable(cancelable: Cancelable) {
    if (cancelable instanceof CancelToken) {
        return cancelable;
    }

    return getCancelTokenFromCancelSignal(cancelable[Cancelable.cancelSignal]());
}

function getCancelSignalFromAbortSignal(abortSignal: AbortSignal): CancelSignal {
    if (abortSignal instanceof CancelToken) {
        return abortSignal;
    }

    let cancelSignal = weakCancelSignalFromAbortSignal?.get(abortSignal);
    if (!cancelSignal) {
        cancelSignal = {
            get signaled() {
                return AbortSignalGetAborted!(abortSignal);
            },
            get reason() {
                return AbortSignalGetReason?.(abortSignal) ?? defaultReason;
            },
            subscribe(onSignaled) {
                if (!isFunction(onSignaled)) throw new TypeError("Function expected: onSignaled");

                let subscribed = true;
                const onAbort = () => {
                    if (subscribed) {
                        subscribed = false;
                        AbortSignalRemoveEventListener!(abortSignal, "abort", onAbort);
                        onSignaled();
                        onSignaled = undefined!;
                    }
                };
                AbortSignalAddEventListener!(abortSignal, "abort", onAbort);
                return CancelSubscription.create(() => {
                    if (subscribed) {
                        subscribed = false;
                        AbortSignalRemoveEventListener!(abortSignal, "abort", onAbort);
                        onSignaled = undefined!;
                    }
                });
            }
        };
        weakCancelSignalFromAbortSignal?.set(abortSignal, cancelSignal);
    }
    return cancelSignal;
}

function getCancelTokenFromAbortSignal(abortSignal: AbortSignal): CancelToken {
    if (abortSignal instanceof CancelToken) {
        return abortSignal;
    }

    let cancelToken = weakCancelTokenFromAbortSignal?.get(abortSignal);
    if (!cancelToken) {
        cancelToken = getCancelTokenFromCancelSignal(getCancelSignalFromAbortSignal(abortSignal));
        weakCancelTokenFromAbortSignal?.set(abortSignal, cancelToken);
    }

    return cancelToken;
}

function executeCallback(callback: () => void) {
    try {
        callback();
    }
    catch (e) {
        // HostReportError(e);
        setImmediate(() => { throw e; });
    }
}

function isSignaled(signal: CancelSignal) {
    return signal.signaled;
}

function canBeSignaled(signal: CancelSignal) {
    return signal !== Cancelable.none && (!(signal instanceof CancelToken) || signal.canBeSignaled);
}

function createCancelSubscription(list: LinkedList<(reason: unknown) => void>, node: LinkedListNode<(reason: unknown) => void>): CancelSubscription {
    return CancelSubscription.create(() => {
        if (list && node && listRemove(list, node)) {
            node.value = undefined!;
            node = undefined!;
            list = undefined!;
        }
    });
}
