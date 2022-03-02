
# `@esfx/async-lockable`

A low-level Symbol-based common API for async coordination primitives.

# Overview

* [Installation](#installation)
* [API](#api)

# Installation

```sh
npm i @esfx/async-lockable
```

# Usage

```ts
import { AsyncLockable, LockHandle } from "@esfx/async-lockable";
import { Cancelable } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";

export class MyLockable implements AsyncLockable {
    private _currentLock?: LockHandle<MyLockable>;

    async lock(cancelable?: Cancelable): Promise<LockHandle<MyLockable>> {
        const thisLock = this;
        return this._lock({
            // LockHandle implementation
            get mutex() {
                return thisLock;
            },
            get ownsLock() {
                return thisLock._currentLock === lockHandle;
            },

            async lock(cancelable?: Cancelable) {
                return thisLock._lock(lockHandle, cancelable);
            },

            unlock() {
                thisLock._unlock(lockHandle);
            },

            // AsyncLockable implementation
            [AsyncLockable.lock](cancelable?: Cancelable) {
                return this.lock(cancelable);
            },
            [AsyncLockable.unlock]() {
                this.unlock();
            },

            // Disposable implementation
            [Disposable.dispose]() {
                if (this.ownsLock) {
                    this.unlock();
                }
            }
        }, cancelable);
    }

    unlock() {
        if (!this._currentLock) throw new Error();
        this._unlock(this._currentLock);
    }

    private async _lock(lockHandle: LockHandle<MyLockable>, cancelable?: Cancelable) {
        if (this._currentLock === lockHandle) throw new Error();

        // ...perform actions necessary to take the lock...

        return this._currentLock = lockHandle;
    }

    private _unlock(lockHandle: LockHandle<MyLockable>) {
        if (this._currentLock !== lockHandle) throw new Error();

        // ...perform actions necessary to release lock...

    }

    // AsyncLockable implementation
    [AsyncLockable.lock](cancelable?: Cancelable) {
        return this.lock(cancelable);
    }

    [AsyncLockable.unlock]() {
        this.unlock();
    }
}

```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/async-lockable.html).
