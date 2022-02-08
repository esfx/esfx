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

import { CancelableSource, Cancelable, CancelSignal, CancelSubscription, CancelError } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";

export { CancelSubscription, CancelError } from "@esfx/cancelable";

interface CancelState {
    getState(): "unsignaled" | "signaled" | "closed";
    subscribe(onSignaled: () => void): CancelSubscription;
}

interface CancelLinks {
    getLinkedState(): "unsignaled" | "signaled" | "closed";
    unlink(): void;
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

const cancelSourcePrototype: object = {
    [Cancelable.cancelSignal](this: CancelSource) { return this.token; },
    [CancelableSource.cancel](this: CancelSource) { this.cancel(); },
};

Object.setPrototypeOf(cancelSourcePrototype, Disposable.prototype);
Object.defineProperty(cancelSourcePrototype, Symbol.toStringTag, { configurable: true, value: "CancelSource" });

function createCancelSource(links: CancelLinks | undefined): CancelSource {
    let state: "unsignaled" | "signaled" | "closed" = "unsignaled";
    let token: CancelToken | undefined;
    let subscriptions: List<() => void> | undefined;
    const source: CancelSource = Object.setPrototypeOf({
        get token() {
            return token || (token = createCancelToken({
                getState() {
                    return state === "unsignaled" && links ? links.getLinkedState() : state;
                },
                subscribe(onSignaled) {
                    if (state === "closed") {
                        return Cancelable.none.subscribe(onSignaled);
                    }
                    if (state === "signaled") {
                        return Cancelable.canceled.subscribe(onSignaled);
                    }
                    const list = subscriptions || (subscriptions = { head: null });
                    return createCancelSubscription(list, listAdd(list, onSignaled));
                }
            }));
        },
        cancel() {
            if (state !== "unsignaled") {
                return;
            }
            const currentLinks = links;
            const currentSubscriptions = subscriptions;
            state = "signaled";
            links = undefined;
            subscriptions = undefined;
            if (currentLinks) {
                currentLinks.unlink();
            }
            if (currentSubscriptions) {
                for (let node = currentSubscriptions.head, next = node && node.next; node; node = next, next = node && node.next) {
                    // The registration for each callback holds onto the node, the node holds onto the
                    // list, and the list holds all other nodes and callbacks. By removing the node from
                    // the list, the GC can collect any otherwise unreachable nodes.
                    if (listRemove(currentSubscriptions, node)) {
                        executeCallback(node.value);
                        node.value = undefined!;
                    }
                }
            }
        },
        close() {
            if (state !== "unsignaled") {
                return;
            }
            const currentLinks = links;
            const currentSubscriptions = subscriptions;
            state = "closed";
            links = undefined;
            subscriptions = undefined;
            if (currentLinks) {
                currentLinks.unlink();
            }
            if (currentSubscriptions) {
                for (let node = currentSubscriptions.head, next = node && node.next; node; node = next, next = node && node.next) {
                    if (listRemove(currentSubscriptions, node)) {
                        node.value = undefined!;
                    }
                }
            }
        },
    }, cancelSourcePrototype);
    Object.freeze(source);
    return source;
}

function createCancelSubscription(list: List<() => void>, node: Node<() => void>): CancelSubscription {
    return CancelSubscription.create(() => {
        if (listRemove(list, node)) {
            node.value = undefined!;
        }
    });
}

function createCancelToken(source: CancelState): CancelToken {
    const token = Object.create(CancelToken.prototype, {
        _state: { value: source }
    });
    Object.freeze(token);
    return token;
}

// A source that cannot be canceled.
const closedSource = createCancelSource(/*links*/ undefined);
closedSource.close();

// A source that is already canceled.
const canceledSource = createCancelSource(/*links*/ undefined);
canceledSource.cancel();

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
     * the exception is propagated to a host specific unhanedle exception mechanism.
     */
    cancel(): void;
    /**
     * Closes the source, preventing the possibility of future cancellation.
     */
    close(): void;
}

/**
 * Propagates notifications that operations should be canceled.
 */
export class CancelToken implements Cancelable, CancelSignal {
    static readonly none = closedSource.token;
    static readonly canceled = canceledSource.token;

    private _state!: CancelState;

    private constructor() {
        throw new TypeError("Object not creatable.");
    }

    /**
     * Gets a value indicating whether the token is signaled.
     */
    get signaled() {
        return this._state.getState() === "signaled";
    }

    /**
     * Gets a value indicating whether the token can be signaled.
     */
    get canBeSignaled() {
        return this._state.getState() !== "closed";
    }

    /**
     * Creates a new CancelSource.
     */
    static source(): CancelSource {
        return createCancelSource(/*links*/ undefined);
    }

    /**
     * Gets a CancelToken from a cancelable.
     */
    static from(cancelable: Cancelable | null | undefined) {
        if (cancelable !== null && cancelable !== undefined && !Cancelable.hasInstance(cancelable)) {
            throw new TypeError("Cancelable exepected: cancelable");
        }
        if (cancelable === Cancelable.none || cancelable === null || cancelable === undefined) {
            return CancelToken.none;
        }
        if (cancelable === Cancelable.canceled) {
            return CancelToken.canceled;
        }
        if (cancelable instanceof CancelToken) {
            return cancelable;
        }
        if (cancelSourcePrototype.isPrototypeOf(cancelable)) {
            return (cancelable as CancelSource).token;
        }
        const signal = cancelable[Cancelable.cancelSignal]();
        if (!canBeSignaled(signal)) {
            return CancelToken.none;
        }
        if (isSignaled(signal)) {
            return CancelToken.canceled;
        }
        let subscription: CancelSubscription | undefined;
        const source = createCancelSource({
            getLinkedState() {
                return isSignaled(signal) ? "signaled" :
                    canBeSignaled(signal) ? "unsignaled" :
                    "closed";
            },
            unlink() {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = undefined;
                }
            }
        })
        subscription = signal.subscribe(source.cancel);
        return source.token;
    }

    /**
     * Returns a CancelToken that becomes signaled when **any** of the provided cancelables are signaled.
     * @param cancelables An iterable of Cancelable objects.
     */
    static race(cancelables: Iterable<Cancelable>) {
        if (typeof cancelables !== "object" || cancelables === null || !(Symbol.iterator in cancelables)) {
            throw new TypeError("Object not iterable: cancelables");
        }
        const signals: CancelSignal[] = [];
        for (const cancelable of cancelables) {
            if (!Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable element expected: cancelables");
            signals.push(cancelable[Cancelable.cancelSignal]());
        }
        if (!signals.some(canBeSignaled)) {
            return CancelToken.none;
        }
        if (signals.some(isSignaled)) {
            return CancelToken.canceled;
        }
        const subscriptions: CancelSubscription[] = [];
        const source = createCancelSource({
            getLinkedState() {
                if (signals.some(isSignaled)) return "signaled";
                if (signals.every(canBeSignaled)) return "unsignaled";
                return "closed";
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
            subscriptions.push(signal.subscribe(source.cancel));
        }
        return source.token;
    }

    /**
     * Returns a CancelToken that becomes signaled when **all** of the provided cancelables are signaled.
     * @param cancelables An iterable of Cancelable objects.
     */
    static all(cancelables: Iterable<Cancelable>) {
        if (typeof cancelables !== "object" || cancelables === null || !(Symbol.iterator in cancelables)) {
            throw new TypeError("Object not iterable: cancelables");
        }
        const signals: CancelSignal[] = [];
        for (const cancelable of cancelables) {
            if (!Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable element expected: cancelables");
            signals.push(cancelable[Cancelable.cancelSignal]());
        }
        if (!signals.some(canBeSignaled)) {
            return CancelToken.none;
        }
        if (signals.every(isSignaled)) {
            return CancelToken.canceled;
        }
        let signalsRemaining = signals.length;
        const subscriptions: CancelSubscription[] = [];
        const source = createCancelSource({
            getLinkedState() {
                if (signals.every(isSignaled)) return "signaled";
                if (signals.every(canBeSignaled)) return "unsignaled";
                return "closed";
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
            subscriptions.push(signal.subscribe(() => {
                if (!signaled) {
                    signaled = true;
                    signalsRemaining--;
                    if (signalsRemaining === 0) {
                        source.cancel();
                    }
                }
            }));
        }
        return source.token;
    }

    /**
     * Throws a CancelError if the token was signaled.
     */
    throwIfSignaled() {
        if (this.signaled) {
            const error = new CancelError();
            if (Error.captureStackTrace) {
                Error.captureStackTrace(error, throwIfSignaledMethod);
            }
            throw error;
        }
    }

    /**
     * Subscribes to notifications for when the object becomes signaled.
     */
    subscribe(onSignaled: () => void): CancelSubscription {
        if (typeof onSignaled !== "function") throw new TypeError("Function expected: onSignaled");
        return this._state.subscribe(onSignaled);
    }

    // #region Cancelable
    [Cancelable.cancelSignal](): CancelToken {
        return this;
    }
    // #endregion Cancelable
}

Object.defineProperty(CancelToken.prototype, Symbol.toStringTag, { configurable: true, value: "CancelToken" });

const throwIfSignaledMethod = CancelToken.prototype.throwIfSignaled;

interface List<T> {
    head: Node<T> | null;
}

interface Node<T> {
    value: T;
    prev: Node<T> | null;
    next: Node<T> | null;
}

function listAdd<T>(list: List<T>, value: T) {
    const node: Node<T> = { value, next: null, prev: null };
    if (!list.head) {
        list.head = node.next = node.prev = node;
    }
    else {
        const tail = list.head.prev;
        if (!tail?.next) throw new Error("Illegal state");
        node.prev = tail;
        node.next = tail.next;
        tail.next = tail.next.prev = node;
    }
    return node;
}

function listRemove<T>(list: List<T>, node: Node<T>) {
    if (!node.next || !node.prev) {
        return false;
    }
    if (node.next === node) {
        if (list.head !== node) throw new Error("Illegal state");
        list.head = null;
    }
    else {
        node.next.prev = node.next;
        node.prev.next = node.prev;
        if (list.head === node) {
            list.head = node.next;
        }
    }
    node.next = node.prev = null;
    return true;
}
