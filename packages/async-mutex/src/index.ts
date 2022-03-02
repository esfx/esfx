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

import { AsyncLockable, LockHandle } from "@esfx/async-lockable";
import { WaitQueue } from "@esfx/async-waitqueue";
import { Cancelable, CancelError } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";
import /*#__INLINE__*/ { isUndefined } from "@esfx/internal-guards";

let lock: (mutex: AsyncMutex, handle: LockHandle<AsyncMutex>, cancelable?: Cancelable) => Promise<void>;
let unlock: (mutex: AsyncMutex, handle: LockHandle<AsyncMutex>) => void;
let ownsLock: (mutex: AsyncMutex, handle: LockHandle<AsyncMutex>) => boolean;

/**
 * An async coordination primitive used to coordinate access to a protected resource.
 */
export class AsyncMutex implements AsyncLockable {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncMutex" });

        lock = (mutex, handle, cancelable) => mutex._lock(handle, cancelable);
        unlock = (mutex, handle) => mutex._unlock(handle);
        ownsLock = (mutex, handle) => mutex._handle === handle;
    }

    private _waiters = new WaitQueue<void>();
    private _handle: LockHandle<AsyncMutex> | undefined;

    declare [Symbol.toStringTag]: string;

    /**
     * Indicates whether the lock has been taken.
     */
    get isLocked() {
        return this._handle !== undefined;
    }

    /**
     * Asynchronously waits for the lock to become available and then takes the lock.
     * @param cancelable A `Cancelable` used to cancel the pending request.
     */
    async lock(cancelable?: Cancelable): Promise<LockHandle<AsyncMutex>> {
        const handle = new AsyncMutexLockHandle(this);
        await handle.lock(cancelable);
        return handle;
    }

    /**
     * Synchronously tries to take a lock.
     */
    tryLock(): boolean {
        if (!this._handle) {
            this._handle = new AsyncMutexLockHandle(this);
            return true;
        }
        return false;
    }

    /**
     * Releases the lock.
     */
    unlock() {
        if (this._handle) {
            this._unlock(this._handle);
            return true;
        }
        return false;
    }

    private async _lock(handle: LockHandle<AsyncMutex>, cancelable?: Cancelable) {
        if (!isUndefined(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expectd: cancelable");

        const signal = cancelable?.[Cancelable.cancelSignal]();
        if (signal?.signaled) throw signal.reason ?? new CancelError();

        if (this._handle === handle) {
            throw new Error("Lock already taken.");
        }

        if (this._handle) {
            await this._waiters.wait(cancelable);
            if (this._handle === handle) {
                throw new Error("Lock already taken.");
            }
        }

        this._handle = handle;
    }

    private _unlock(handle: LockHandle<AsyncMutex>) {
        if (this._handle !== handle) {
            throw new Error("Lock already released.");
        }

        if (!this._waiters.resolveOne()) {
            this._handle = undefined;
        }
    }

    // #region AsyncLockable

    [AsyncLockable.lock](cancelable?: Cancelable) {
        return this.lock(cancelable);
    }

    [AsyncLockable.unlock]() {
        this.unlock();
    }

    // #endregion AsyncLockable
}

class AsyncMutexLockHandle implements LockHandle<AsyncMutex> {
    static {
        Object.defineProperty(this, "constructor", { ...Object.getOwnPropertyDescriptor(this, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncMutexLockHandle" });
    }

    private _mutex: AsyncMutex;

    constructor(mutex: AsyncMutex) {
        this._mutex = mutex;
    }

    declare [Symbol.toStringTag]: string;

    get mutex() {
        return this._mutex;
    }

    get ownsLock(): boolean {
        return ownsLock(this._mutex, this);
    }

    async lock(cancelable?: Cancelable): Promise<this> {
        await lock(this._mutex, this, cancelable);
        return this;
    }

    unlock() {
        unlock(this._mutex, this);
    }

    [AsyncLockable.lock](cancelable?: Cancelable) {
        return this.lock(cancelable);
    }

    [AsyncLockable.unlock]() {
        return this.unlock();
    }

    [Disposable.dispose]() {
        if (this.ownsLock) {
            this.unlock();
        }
    }
}
