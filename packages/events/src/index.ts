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

import { Disposable } from "@esfx/disposable";
import /*#__INLINE__*/ { isFunction } from "@esfx/internal-guards";

const symContext = Symbol.for("@esfx/events:Event.context");
const symListener = Symbol.for("@esfx/events:EventListener.listener");
const symListenerToken = Symbol.for("@esfx/events:EventListener.token");

const bind = Function.prototype.call.bind(Function.prototype.bind);

export type EventListener<F extends (...args: any[]) => void> = (this: ThisParameterType<F>, ...args: Parameters<F>) => void;
export type EventOwner<F extends (...args: any[]) => void> = ThisParameterType<F> extends undefined ? void : ThisParameterType<F>;

interface EventListenerLike<F extends (...args: any[]) => void> {
    (this: ThisParameterType<F>, ...args: Parameters<F>): void;
    [symListener]?: EventListener<F>;
    [symListenerToken]?: object;
}

interface OnceListenerRecord<F extends (...args: any[]) => void> {
    context: EventContext<F>;
    listener: EventListener<F>;
    done: boolean;
}

function onceListener<F extends (...args: any[]) => void>(this: OnceListenerRecord<F>, ...args: Parameters<F>) {
    if (this.done) return;
    this.done = true;
    this.context.removeListener(this.listener);
    Reflect.apply(this.listener, this.context.owner, args);
}

function createListenerWrap<F extends (...args: any[]) => void>(context: EventContext<F>, listener: EventListener<F>, options?: { token?: object, once?: boolean }) {
    const fn: EventListenerLike<F> = options?.once ?
        bind(onceListener, { context, listener, done: false }) :
        bind(listener, context.owner);
    fn[symListener] = listener;
    fn[symListenerToken] = options?.token;
    return fn;
}

class EventContext<F extends (...args: any[]) => void> {
    readonly owner: ThisParameterType<F>;
    readonly event: Event<F> = createEvent(this);
    readonly source: EventSource<F> = createEventSource<F>(this);
    private _list?: EventListenerLike<F> | EventListenerLike<F>[] = undefined;

    constructor(owner: ThisParameterType<F>) {
        this.owner = owner;
    }

    get count() {
        return typeof this._list === "function" ? 1 :
            this._list ? this._list.length :
            0;
    }

    addListener(listener: EventListener<F>) {
        if (this._list === undefined) {
            this._list = listener;
        }
        else if (typeof this._list === "function") {
            this._list = [this._list, listener];
        }
        else {
            this._list.push(listener);
        }
    }

    prependListener(listener: EventListener<F>) {
        if (!this._list) {
            this._list = [listener];
        }
        else if (typeof this._list === "function") {
            this._list = [listener, this._list];
        }
        else {
            this._list.unshift(listener);
        }
    }

    unsubscribe(token: object) {
        this._removeListener(currentListener => !!currentListener[symListenerToken] && currentListener[symListenerToken] === token);
    }

    removeListener(listener: EventListener<F>) {
        this._removeListener(currentListener => currentListener === listener || currentListener[symListener] === listener);
    }

    private _removeListener(match: (listener: EventListenerLike<F>) => boolean) {
        const listeners = this._list;
        if (typeof listeners === "function") {
            if (match(listeners)) {
                this._list = undefined;
            }
        }
        else if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                const currentListener = listeners[i];
                if (match(currentListener)) {
                    listeners.splice(i, 1);
                    if (listeners.length === 1) {
                        this._list = listeners[0];
                    }
                    break;
                }
            }
        }
    }

    removeAllListeners() {
        this._list = undefined;
    }

    * listeners(): IterableIterator<EventListener<F>> {
        if (typeof this._list === "function") {
            yield this._list[symListener] || this._list;
        }
        else if (this._list) {
            for (const listener of this._list) {
                yield listener[symListener] || listener;
            }
        }
    }

    * rawListeners(): IterableIterator<EventListener<F>> {
        if (typeof this._list === "function") {
            yield this._list;
        }
        else if (this._list) {
            for (const listener of this._list) {
                yield listener;
            }
        }
    }

    emit(...args: Parameters<F>) {
        if (typeof this._list === "function") {
            Reflect.apply(this._list, this.owner, args);
            return true;
        }
        else if (this._list) {
            for (const listener of this._list.slice()) {
                Reflect.apply(listener, this.owner, args);
            }
            return true;
        }
        return false;
    }
}

let createEventSource: <F extends (...args: any[]) => void>(context: EventContext<F>) => EventSource<F>;

export class EventSource<F extends (...args: any[]) => void> {
    static {
        createEventSource = context => new EventSource(context);
        Object.defineProperty(this.prototype, "constructor", { ...Object.getOwnPropertyDescriptor(this.prototype, "constructor"), value: Object });
    }

    private [symContext]: EventContext<F>;

    private constructor(context: EventContext<F>) {
        this[symContext] = context;
    }

    /**
     * Gets the {@link Event} raised by this source.
     */
    get event(): Event<F> {
        return this[symContext].event;
    }

    /**
     * Gets the owner of the {@link Event}.
     */
    get owner() {
        return this[symContext].owner;
    }

    /**
     * Emits the linked {@link Event} for this source.
     * @param args The arguments for th eevent.
     * @returns `true` if there were any listeners for the event; otherwise, `false`.
     */
    emit(...args: Parameters<F>) {
        return this[symContext].emit(...args);
    }
}

let createEvent: <F extends (...args: any[]) => void>(context: EventContext<F>) => Event<F>;

export class Event<F extends (...args: any[]) => void> {
    static {
        createEvent = context => new Event(context);
        Object.defineProperty(this.prototype, "constructor", { ...Object.getOwnPropertyDescriptor(this.prototype, "constructor"), value: Object });
    }

    private declare [symContext]: EventContext<F>;

    private constructor(context: EventContext<F>) {
        const self = function Event(listener: EventListener<F>) { return self.subscribe(listener); } as Event<F>;
        Object.setPrototypeOf(self, new.target.prototype);
        self[symContext] = context;
        return self;
    }

    get owner() {
        return this[symContext].owner;
    }

    get count() {
        return this[symContext].count;
    }

    static create<F extends (this: undefined, ...args: any[]) => void>(): EventSource<F>;
    static create<F extends (...args: any[]) => void>(owner: ThisParameterType<F>): EventSource<F>;
    static create<F extends (...args: any[]) => void>(owner?: ThisParameterType<F>) {
        return new EventContext<F>(owner as ThisParameterType<F>).source;
    }

    subscribe(listener: EventListener<F>, options?: { once?: boolean, prepend?: boolean }): EventSubscription<ThisParameterType<F>> {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        const context = this[symContext];
        const token = {};
        listener = createListenerWrap(context, listener, { once: options?.once, token });
        if (options?.prepend) {
            context.prependListener(listener);
        }
        else {
            context.addListener(listener);
        }
        return createEventSubscription(context, token);
    }

    addListener(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        this[symContext].addListener(listener);
        return this.owner as EventOwner<F>;
    }

    on(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        return this.addListener(listener);
    }

    once(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        this.addListener(createListenerWrap(this[symContext], listener, { once: true }));
        return this.owner as EventOwner<F>;
    }

    prependListener(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        this[symContext].prependListener(listener);
        return this.owner as EventOwner<F>;
    }

    prependOnceListener(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        return this.prependListener(createListenerWrap(this[symContext], listener, { once: true }));
    }

    removeListener(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        this[symContext].removeListener(listener);
        return this.owner as EventOwner<F>;
    }

    off(listener: EventListener<F>) {
        if (!isFunction(listener)) throw new TypeError("Function expected: listener");

        return this.removeListener(listener);
    }

    removeAllListeners() {
        this[symContext].removeAllListeners();
        return this.owner as EventOwner<F>;
    }

    listeners() {
        return this[symContext].listeners();
    }

    rawListeners() {
        return this[symContext].rawListeners();
    }
}

export interface Event<F extends (...args: any[]) => void> extends Function {
    (listener: EventListener<F>): EventSubscription<ThisParameterType<F>>;
}

Object.setPrototypeOf(Event, Function);
Object.setPrototypeOf(Event.prototype, Function.prototype);

let createEventSubscription: <F extends (...args: any[]) => void>(context: EventContext<F>, token: object) => EventSubscription<ThisParameterType<F>>;

export class EventSubscription<TOwner> implements Disposable {
    static {
        createEventSubscription = (context, token) => new EventSubscription(context, token);
        Object.defineProperty(this.prototype, "constructor", { ...Object.getOwnPropertyDescriptor(this.prototype, "constructor"), value: Object });
    }

    private [symContext]?: EventContext<(this: TOwner, ...args: any[]) => void>;
    private _token: object;

    private constructor(context: EventContext<(this: TOwner, ...args: any[]) => void>, token: object) {
        this[symContext] = context;
        this._token = token;
    }

    [Disposable.dispose]() {
        const context = this[symContext];
        this[symContext] = undefined;
        if (context) {
            context.unsubscribe(this._token);
        }
    }
}
