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

import { isObject } from "@esfx/internal-guards";
import { Cancelable } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";

/**
 * Represents a value that can be used to synchronize access to a resource.
 */
export interface AsyncLockable {
    /**
     * Takes a lock.
     * @param cancelable A `Cancelable` object that can be used to cancel the request.
     */
    [AsyncLockable.lock](cancelable?: Cancelable): Promise<LockHandle>;
    /**
     * Releases a lock.
     */
    [AsyncLockable.unlock](): void;
}

export namespace AsyncLockable {
    /**
     * A well-known symbol used to define an locking method on an object.
     */
    export const lock = Symbol.for("@esfx/async-lockable:AsyncLockable.lock");

    /**
     * A well-known symbol used to define an unlocking method on an object.
     */
    export const unlock = Symbol.for("@esfx/async-lockable:AsyncLockable.unlock");

    /**
     * Determines whether a value is `AsyncLockable`.
     */
    export function isAsyncLockable(value: unknown): value is AsyncLockable {
        return isObject(value)
            && AsyncLockable.lock in value
            && AsyncLockable.unlock in value;
    }
}

/**
 * An object used to release a held lock.
 */
export interface LockHandle<TMutex extends AsyncLockable = AsyncLockable> extends Disposable, AsyncLockable {
    /**
     * Gets the associated `AsyncLockable` object.
     */
    readonly mutex: TMutex;
    /**
     * Indicates whether this handle owns its associated `mutex`.
     */
    readonly ownsLock: boolean;
    /**
     * Reacquires the lock. If this handle already owns the lock, an `Error` is thrown.
     * @param cancelable A Cancelable used to cancel the request.
     */
    lock(cancelable?: Cancelable): Promise<this>;
    /**
     * Releases the lock. If this handle does not own the lock, an `Error` is thrown.
     */
    unlock(): void;
}

/**
 * An object used to release a held lock or upgrade to a stronger lock.
 */
export interface UpgradeableLockHandle<TMutex extends AsyncLockable = AsyncLockable, TUpgradedMutex extends AsyncLockable = AsyncLockable> extends LockHandle<TMutex> {
    /**
     * Upgrades the lock to a stronger lock.
     * @param cancelable A Cancelable used to cancel the request.
     */
    upgrade(cancelable?: Cancelable): Promise<LockHandle<TUpgradedMutex>>;
}
