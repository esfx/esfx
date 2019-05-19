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
import { ReaderWriterLock } from "@esfx/async-readerwriterlock";

// 'rwlock' protects access to 'userCache' and data stored on disk
const rwlock = new ReaderWriterLock();
const userCache = new Map();

async function getUser(id) {
    // get read access
    const lk = await rwlock.read();
    try {
        let user = userCache.get(id);
        if (!user) {
            user = await readUserFromDisk(id);
            userCache.set(id, user);
        }
        return user;
    }
    finally {
        // release read access
        lk.unlock();
    }
}

async function addUser(user) {
    // get write access
    const lk = await rwlock.write();
    try {
        userCache.set(user.id, user);
        await writeUserToDisk(user.id, user);
    }
    finally {
        // release write access
        lk.unlock();
    }
}

async function updateUser(id, oldData, newData) {
    // get upgradeable read access
    const lk = await rwlock.upgradeableRead();
    try {
        // verify that we are ok to make changes...
        let user = userCache.get(id);
        if (!user || user.name === oldData.name && user.email === oldData.email) {
            // looks safe, so upgrade to a write lock
            const updlk = await lk.upgrade();
            try {
                if (!user) {
                    user = { id };
                    userCache.set(id, user);
                }
                user.name = newData.name;
                user.email = newData.email;
                await writeUserToDisk(user.id, user);
            }
            finally {
                updlk.unlock(); // release the write lock
            }
        }
    }
    finally {
        lk.unlock(); // release the read lock
    }
}
```

# API

```ts
import { LockHandle, UpgradeableLockHandle } from "@esfx/async-lockable";
import { Cancelable } from "@esfx/cancelable";

/**
 * Coordinates readers and writers for a resource.
 */
export declare class ReaderWriterLock {
    /**
     * Creates a `ReaderWriterLockReader` that can be used to take and release "read" locks on a
     * resource.
     */
    createReader(): ReaderWriterLockReader;
    /**
     * Creates a `ReaderWriterLockUpgradeableReader` that can be used to take and release "read"
     * locks on a resource
     * and can be later upgraded to take and release "write" locks.
     */
    createUpgradeableReader(): ReaderWriterLockUpgradeableReader;
    /**
     * Creates a `ReaderWriterLockWriter` that can be used to take and release "write" locks
     * on a resource.
     */
    createWriter(): ReaderWriterLockWriter;
    /**
     * Asynchronously waits for and takes a read lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    read(cancelable?: Cancelable): Promise<ReaderWriterLockReader>;
    /**
     * Asynchronously waits for and takes a read lock on a resource
     * that can later be upgraded to a write lock.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    upgradeableRead(cancelable?: Cancelable): Promise<ReaderWriterLockUpgradeableReader>;
    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    write(cancelable?: Cancelable): Promise<ReaderWriterLockWriter>;
}

export interface ReaderWriterLockReader extends LockHandle<ReaderWriterLockReader> {
    /**
     * Gets the `ReaderWriterLock` that owns this object.
     */
    readonly owner: ReaderWriterLock;
}

export interface ReaderWriterLockWriter extends LockHandle<ReaderWriterLockWriter> {
    /**
     * Gets the `ReaderWriterLock` that owns this object.
     */
    readonly owner: ReaderWriterLock;
}

export interface ReaderWriterLockUpgradedWriter
    extends LockHandle<ReaderWriterLockUpgradedWriter> {
    /**
     * Gets the `ReaderWriterLock` that owns this object.
     */
    readonly owner: ReaderWriterLock;
}

export interface ReaderWriterLockUpgradeableReader
    extends UpgradeableLockHandle<ReaderWriterLockUpgradeableReader, ReaderWriterLockUpgradedWriter> {
    /**
     * Gets the `ReaderWriterLock` that owns this object.
     */
    readonly owner: ReaderWriterLock;
    /**
     * Creates a `ReaderWriterLockUpgradedWriter` that can be used to take and release "write"
     * locks on a resource.
     */
    createWriter(): ReaderWriterLockUpgradedWriter;
    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    upgrade(cancelable?: Cancelable): Promise<ReaderWriterLockUpgradedWriter>;
}
```
