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

import { isIterable, isFunction, isMissing } from "@esfx/internal-guards";
import { CancelableSource, Cancelable, CancelSignal, CancelSubscription, CancelError } from "@esfx/cancelable";
import { LinkedList, LinkedListNode } from "@esfx/collections-linkedlist";
import { Disposable } from "@esfx/disposable";
import { Optional } from '../../type-model';

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
    return !(signal instanceof CancelToken) || signal.canBeSignaled;
}

const cancelSourcePrototype = {
    [Cancelable.cancelSignal](this: CancelSource) { return this.token; },
    [CancelableSource.cancel](this: CancelSource) { this.cancel(); },
    [Disposable.dispose](this: CancelSource) { this.close(); },
    [Symbol.toStringTag]: "CancelSource",
};

function createCancelSource(links: Optional<CancelLinks>): CancelSource {
    let state: "unsignaled" | "signaled" | "closed" = "unsignaled";
    let token: Optional<CancelToken>;
    let subscriptions: Optional<LinkedList<Optional<() => void>>>;

    const cancel = () => {
        if (state !== "unsignaled") {
            return;
        }

        state = "signaled";
        const currentLinks = links;
        links = undefined;
        if (currentLinks) {
            currentLinks.unlink();
        }

        const currentSubscriptions = subscriptions;
        subscriptions = undefined;

        if (currentSubscriptions) {
            for (const node of [...currentSubscriptions.nodes()]) {
                // The registration for each callback holds onto the node, the node holds onto the
                // list, and the list holds all other nodes and callbacks. By removing the node from 
                // the list, the GC can collect any otherwise unreachable nodes.
                if (node.detachSelf() && node.value) {
                    const callback = node.value;
                    node.value = undefined;
                    executeCallback(callback);
                }
            }
        }
    };

    const close = () => {
        if (state !== "unsignaled") {
            return;
        }

        state = "closed";
        const currentLinks = links;
        links = undefined;
        if (currentLinks) {
            currentLinks.unlink();
        }

        const currentSubscriptions = subscriptions;
        subscriptions = undefined;
        if (currentSubscriptions) {
            for (const subscription of [...currentSubscriptions.nodes()]) {
                if (subscription.detachSelf()) {
                    subscription.value = undefined;
                }
            }
        }
    };

    const getToken = () => {
        return token || (token = createCancelToken({ getState, subscribe }));
    };

    const getState = () => {
        if (state === "unsignaled" && links) {
            return links.getLinkedState();
        }
        return state;
    };

    const subscribe = (onSignaled: () => void) => {
        if (state === "closed") {
            return createCancelSubscription(/*node*/ undefined);
        }

        if (state === "signaled") {
            executeCallback(onSignaled);
            return createCancelSubscription(/*node*/ undefined);
        }

        const list = subscriptions || (subscriptions = new LinkedList());
        return createCancelSubscription(list.push(onSignaled));
    };

    const source: CancelSource = Object.create(cancelSourcePrototype, {
        token: {
            enumerable: false,
            configurable: true,
            get: getToken
        },
        cancel: { value: cancel },
        close: { value: close },
    });

    Object.freeze(source);
    return source;
}

const cancelSubscriptionPrototype = {
    [Disposable.dispose](this: CancelSubscription) { this.unsubscribe(); },
    [Symbol.toStringTag]: "CancelSubscription",
};

function createCancelSubscription(node: Optional<LinkedListNode<Optional<() => void>>>): CancelSubscription {
    const unsubscribe = () => {
        const currentNode = node;
        node = undefined;
        if (currentNode && currentNode.detachSelf()) {
            currentNode.value = undefined;
        }
    };

    const subscription: CancelSubscription = Object.create(cancelSubscriptionPrototype, {
        unsubscribe: { value: unsubscribe },
    });
    Object.freeze(subscription);
    return subscription;
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
        if (!isMissing(cancelable) && !Cancelable.isCancelable(cancelable)) throw new TypeError("Cancelable exepected: cancelable");
        if (cancelable === undefined || cancelable === null) return CancelToken.none;
        if (cancelable instanceof CancelToken) return cancelable;
        if (cancelSourcePrototype.isPrototypeOf(cancelable)) return (cancelable as CancelSource).token;
        return CancelToken.race([cancelable]);
    }

    /**
     * Returns a CancelToken that becomes signaled when **any** of the provided cancelables are signaled.
     * @param cancelables An iterable of Cancelable objects.
     */
    static race(cancelables: Iterable<Cancelable>) {
        if (!isIterable(cancelables)) throw new TypeError("Object not iterable: iterable.");

        const signals: CancelSignal[] = [];
        for (const cancelable of cancelables) {
            if (!Cancelable.isCancelable(cancelable)) throw new TypeError("Cancelable element expected: cancelables");
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
        if (!isIterable(cancelables)) throw new TypeError("Object not iterable: iterable.");

        const signals: CancelSignal[] = [];
        for (const cancelable of cancelables) {
            if (!Cancelable.isCancelable(cancelable)) throw new TypeError("Cancelable element expected: cancelables");
            signals.push(cancelable[Cancelable.cancelSignal]());
        }

        if (!signals.some(canBeSignaled)) {
            return CancelToken.none;
        }

        if (signals.every(isSignaled)) {
            return CancelToken.canceled;
        }

        let countdown = signals.length;
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
                    countdown--;
                    if (countdown === 0) {
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
        if (!isFunction(onSignaled)) throw new TypeError("Function expected: onSignaled");
        return this._state.subscribe(onSignaled);
    }

    // #region Cancelable
    [Cancelable.cancelSignal](): CancelToken {
        return this;
    }
    // #endregion Cancelable
}

Object.defineProperty(CancelToken.prototype, Symbol.toStringTag, {
    enumerable: false,
    writable: true,
    configurable: true,
    value: "CancelToken",
});

const throwIfSignaledMethod = CancelToken.prototype.throwIfSignaled;

export { CancelError, CancelSubscription };
