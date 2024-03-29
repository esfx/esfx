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

import /*#__INLINE__*/ { isFunction } from "@esfx/internal-guards";

type LazyFactoryState<T> = { state: "factory", factory: (...args: any) => T | PromiseLike<T>, args: any[] | undefined };
type LazyValueState<T> = { state: "value", value: Promise<T> };
type LazyResolvingState = { state: "resolving" };
type LazyErrorState = { state: "error", error: unknown };
type LazyState<T> =
    | LazyFactoryState<T>
    | LazyValueState<T>
    | LazyResolvingState
    | LazyErrorState;

const noop = (): any => {};
const noopFactoryState: LazyFactoryState<any> = createFactoryState(noop, /*args*/ undefined);
const resolvingState: LazyResolvingState = { state: "resolving" };

function createFactoryState<T>(factory: () => T | PromiseLike<T>, args: any[] | undefined): LazyFactoryState<T> {
    return { state: "factory", factory, args };
}

function createValueState<T>(value: Promise<T>): LazyValueState<T> {
    return { state: "value", value };
}

function createErrorState(error: unknown): LazyErrorState {
    return { state: "error", error };
}

/**
 * A lazy-initialized asynchronous value.
 */
export class AsyncLazy<T> {
    private _state: LazyState<T>;

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncLazy" });
    }

    constructor(factory: () => T | PromiseLike<T>) {
        if (!isFunction(factory)) throw new TypeError("Function expected: factory");
        this._state = factory === noop
            ? noopFactoryState
            : createFactoryState(factory, /*args*/ undefined);
    }

    get isStarted() {
        return this._state.state !== "factory";
    }

    get value() {
        if (this._state.state === "error") return Promise.reject(this._state.error);
        if (this._state.state === "value") return this._state.value;
        if (this._state.state === "resolving") {
            const error = new Error("'value' recursively references itself during its own initialization.");
            this._state = createErrorState(error);
            return Promise.reject(error);
        }
        const { factory, args } = this._state;
        this._state = resolvingState;
        try {
            const value = Promise.resolve(args?.length ? factory(...args) : factory());
            this._state = createValueState(value);
            return value;
        }
        catch (error) {
            this._state = createErrorState(error);
            return Promise.reject(error);
        }
    }

    static from<T, A extends any[]>(factory: (...args: A) => T | PromiseLike<T>, ...args: A) {
        if (!isFunction(factory)) throw new TypeError("Function expected: factory");
        const lazy = new AsyncLazy<T>(noop);
        lazy._state = createFactoryState(factory, args);
        return lazy;
    }

    static for<T>(value: T | PromiseLike<T>) {
        const lazy = new AsyncLazy<T>(noop);
        lazy._state = createValueState(Promise.resolve(value));
        return lazy;
    }
}
