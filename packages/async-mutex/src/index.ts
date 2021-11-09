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

import { Tag, defineTag } from "@esfx/internal-tag";
import { AsyncLockable, LockHandle } from "@esfx/async-lockable";
import { WaitQueue } from "@esfx/async-waitqueue";
import { Cancelable } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";

/**
 * An async coordination primitive used to coordinate access to a protected resource.
 */
@Tag()
export class AsyncMutex implements AsyncLockable {
    private _waiters = new WaitQueue<void>();
    private _handle: LockHandle<AsyncMutex> | undefined;

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
        const handle = createLockHandle(this);
        await handle.lock(cancelable);
        return handle;
    }

    /**
     * Synchronously tries to take a lock.
     */
    tryLock(): boolean {
        if (!this._handle) {
            this._handle = createLockHandle(this);
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
        Cancelable.throwIfSignaled(cancelable);
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

const mutexLockHandlePrototype: object = {
    [AsyncLockable.lock](this: LockHandle, cancelable?: Cancelable) {
        return this.lock(cancelable);
    },
    [AsyncLockable.unlock](this: LockHandle) {
        return this.unlock();
    },
    [Disposable.dispose](this: LockHandle) {
        if (this.ownsLock) {
            this.unlock();
        }
    }
};

defineTag(mutexLockHandlePrototype, "MutexLockHandle");
Object.setPrototypeOf(mutexLockHandlePrototype, Disposable.prototype);

function createLockHandle(mutex: AsyncMutex): LockHandle<AsyncMutex> {
    const handle: LockHandle<AsyncMutex> = Object.setPrototypeOf({
        get mutex() {
            return mutex;
        },
        get ownsLock() {
            return mutex["_handle"] === handle;
        },
        async lock(cancelable?: Cancelable) {
            await mutex["_lock"](handle, cancelable);
            return this;
        },
        unlock() {
            mutex["_unlock"](handle);
        }
    }, mutexLockHandlePrototype);
    return handle;
}
