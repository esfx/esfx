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

/**
 * Indicates an object that has resources that can be explicitly disposed.
 */
export interface Disposable {
    /**
     * Dispose this object's resources.
     */
    [Disposable.dispose](): void;
}

export namespace Disposable {
    /**
     * A well-known symbol used to define an explicit resource disposal method on an object.
     */
    export const dispose = Symbol.for("@esfx/disposable:Disposable.dispose");

    /**
     * Determines whether a value is [[Disposable]].
     */
    export function isDisposable(value: unknown): value is Disposable {
        return typeof value === "object"
            && value !== null
            && dispose in value;
    }
}

/**
 * Indicates an object that has resources that can be explicitly disposed asynchronously.
 */
export interface AsyncDisposable {
    /**
     * Dispose this object's resources.
     */
    [AsyncDisposable.asyncDispose](): Promise<void>;
}

export namespace AsyncDisposable {
    /**
     * A well-known symbol used to define an async explicit resource disposal method on an object.
     */
    export const asyncDispose = Symbol.for("@esfx/disposable:AsyncDisposable.asyncDispose");
    
    /**
     * Determines whether a value is [[AsyncDisposable]].
     */
    export function isAsyncDisposable(value: unknown): value is AsyncDisposable {
        return typeof value === "object"
            && value !== null
            && asyncDispose in value;
    }
}
