# `@esfx/async-readerwriterlock`

The `@esfx/async-readerwriterlock` package provides the `ReaderWriterLock` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-readerwriterlock
```

# Usage

```ts
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
import { Disposable } from '@esfx/disposable';
/**
 * Coordinates readers and writers for a resource.
 */
export declare class ReaderWriterLock {
    /**
     * Asynchronously waits for and takes a read lock on a resource.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    read(cancelable?: Cancelable): Promise<LockHandle>;
    /**
     * Asynchronously waits for and takes a read lock on a resource
     * that can later be upgraded to a write lock.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    upgradeableRead(cancelable?: Cancelable): Promise<UpgradeableLockHandle>;
    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    write(cancelable?: Cancelable): Promise<LockHandle>;
}
/**
 * An object used to release a held lock.
 */
export interface LockHandle extends Disposable {
    /**
     * Releases the lock.
     */
    release(): void;
}
/**
 * An object used to release a held lock or upgrade to a write lock.
 */
export interface UpgradeableLockHandle extends LockHandle, Disposable {
    /**
     * Upgrades the lock to a write lock.
     *
     * @param token A Cancelable used to cancel the request.
     */
    upgrade(token?: Cancelable): Promise<LockHandle>;
}
```
