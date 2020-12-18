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

const symContext = Symbol.for("@esfx/events:Event.context");
const symListener = Symbol.for("@esfx/events:EventListener.listener");

export type EventListener<F extends (...args: any[]) => void> = (this: ThisParameterType<F>, ...args: Parameters<F>) => void;

interface EventListenerLike<F extends (...args: any[]) => void> {
    (this: ThisParameterType<F>, ...args: Parameters<F>): void;
    [symListener]?: EventListener<F>;
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

function createOnceListener<F extends (...args: any[]) => void>(context: EventContext<F>, listener: EventListener<F>) {
    const fn: EventListenerLike<F> = onceListener.bind({ context, listener, done: false });
    fn[symListener] = listener;
    return fn;
}

class EventContext<F extends (...args: any[]) => void> {
    readonly owner: ThisParameterType<F>;
    // @ts-ignore
    readonly event: Event<F> = new Event<F>(this);
    // @ts-ignore
    readonly source: EventSource<F> = new EventSource<F>(this);

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

    removeListener(listener: EventListener<F>) {
        const listeners = this._list;
        if (typeof listeners === "function") {
            if (listeners === listener || listeners[symListener] === listener) {
                this._list = undefined;
            }
        }
        else if (listeners) {
            for (let i = 0; i < listeners.length; i++) {
                const currentListener = listeners[i];
                if (currentListener === listener || currentListener[symListener] === listener) {
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

export class EventSource<F extends (...args: any[]) => void> {
    private [symContext]: EventContext<F>;

    private constructor(context: EventContext<F>) {
        this[symContext] = context;
    }

    get event(): Event<F> {
        return this[symContext].event;
    }

    get owner() {
        return this[symContext].owner;
    }

    emit(...args: Parameters<F>) {
        return this[symContext].emit(...args);
    }
}

export interface Event<F extends (...args: any[]) => void> extends Function {
    (listener: EventListener<F>): ThisParameterType<F>;
}

export class Event<F extends (...args: any[]) => void> {
    private [symContext]: EventContext<F>;

    private constructor(context: EventContext<F>) {
        const self = function Event(listener: EventListener<F>) { return self.addListener(listener); } as Event<F>;
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

    addListener(listener: EventListener<F>) {
        this[symContext].addListener(listener);
        return this.owner;
    }

    on(listener: EventListener<F>) {
        return this.addListener(listener);
    }

    once(listener: EventListener<F>) {
        this.addListener(createOnceListener(this[symContext], listener));
        return this.owner;
    }

    prependListener(listener: EventListener<F>) {
        this[symContext].prependListener(listener);
        return this.owner;
    }

    prependOnceListener(listener: EventListener<F>) {
        return this.prependListener(createOnceListener(this[symContext], listener));
    }

    removeListener(listener: EventListener<F>) {
        this[symContext].removeListener(listener);
        return this.owner;
    }

    off(listener: EventListener<F>) {
        return this.removeListener(listener);
    }

    removeAllListeners() {
        this[symContext].removeAllListeners();
        return this.owner;
    }

    listeners() {
        return this[symContext].listeners();
    }

    rawListeners() {
        return this[symContext].rawListeners();
    }
}

Object.setPrototypeOf(Event, Function);
Object.setPrototypeOf(Event.prototype, Function.prototype);