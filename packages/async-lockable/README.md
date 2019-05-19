
# `@esfx/async-lockable`

A low-level Symbol-based common API for async coordination primitives.

# Overview

* [Installation](#installation)
* [API](#api)

# Installation

```sh
npm i @esfx/async-lockable
```

# API

```ts
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

export declare namespace AsyncLockable {
    /**
     * A well-known symbol used to define an locking method on an object.
     */
    const lock: unique symbol;
    /**
     * A well-known symbol used to define an unlocking method on an object.
     */
    const unlock: unique symbol;
    /**
     * Determines whether a value is `AsyncLockable`.
     */
    function isAsyncLockable(value: unknown): value is AsyncLockable;
}

/**
 * An object used to release a held lock.
 */
export interface LockHandle<
    TMutex extends AsyncLockable = AsyncLockable
> extends Disposable, AsyncLockable {
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
export interface UpgradeableLockHandle<
    TMutex extends AsyncLockable = AsyncLockable,
    TUpgradedMutex extends AsyncLockable = AsyncLockable
> extends LockHandle<TMutex> {
    /**
     * Upgrades the lock to a stronger lock.
     * @param cancelable A Cancelable used to cancel the request.
     */
    upgrade(cancelable?: Cancelable): Promise<LockHandle<TUpgradedMutex>>;
}
```

