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

import { isFunction } from "@esfx/internal-guards";

type LazyFactoryState<T> = { state: "factory", factory: (...args: any) => T, args: any[] | undefined };
type LazyValueState<T> = { state: "value", value: T };
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

function createFactoryState<T>(factory: () => T, args: any[] | undefined): LazyFactoryState<T> {
    return { state: "factory", factory, args };;
}

function createValueState<T>(value: T): LazyValueState<T> {
    return { state: "value", value };
}

function createErrorState(error: unknown): LazyErrorState {
    return { state: "error", error };
}

export class Lazy<T> {
    private _state: LazyState<T>;

    constructor(factory: () => T) {
        if (!isFunction(factory)) throw new TypeError("Function expected: factory");
        this._state = factory === noop
            ? noopFactoryState
            : createFactoryState(factory, /*args*/ undefined);
    }

    get hasValue() {
        return this._state.state === "value";
    }

    get value() {
        if (this._state.state === "error") throw this._state.error;
        if (this._state.state === "value") return this._state.value;
        if (this._state.state === "resolving") {
            const error = new Error("'value' recursively references itself during its own initialization.");
            this._state = createErrorState(error);
            throw error;
        }
        const { factory, args } = this._state;
        this._state = resolvingState;
        try {
            const value = args && args.length ? factory(...args) : factory();
            this._state = createValueState(value);
            return value;
        }
        catch (error) {
            this._state = createErrorState(error);
            throw error;
        }
    }

    static from<T, A extends any[]>(factory: (...args: A) => T, ...args: A) {
        const lazy = new Lazy<T>(noop);
        lazy._state = createFactoryState(factory, args);
        return lazy;
    }

    static for<T>(value: T) {
        const lazy = new Lazy<T>(noop);
        lazy._state = createValueState(value);
        return lazy;
    }
}