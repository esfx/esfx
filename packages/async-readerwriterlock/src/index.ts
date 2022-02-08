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

   THIRD PARTY LICENSE NOTICE:

   ReaderWriterLock is derived from the implementation of ReaderWriterLock in
   Promise Extensions for Javascript: https://github.com/rbuckton/prex

   Promise Extensions is licensed under the Apache 2.0 License:

   Promise Extensions for JavaScript
   Copyright (c) Microsoft Corporation

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

import { WaitQueue } from "@esfx/async-waitqueue";
import { LockHandle, UpgradeableLockHandle, AsyncLockable } from "@esfx/async-lockable";
import { Cancelable } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";

export { LockHandle, UpgradeableLockHandle } from "@esfx/async-lockable";

/**
 * Coordinates readers and writers for a resource.
 */
export class AsyncReaderWriterLock {
    private _readerQueue = new WaitQueue<void>();
    private _writerQueue = new WaitQueue<void>();
    private _readers = new Set<LockHandle>();
    private _writer: LockHandle | undefined;
    private _upgradeable: LockHandle | undefined;

    /**
     * Creates a `AsyncReaderWriterLockReader` that can be used to take and release "read" locks on a resource.
     */
    createReader() {
        const owner = this;
        const handle: AsyncReaderWriterLockReader = Object.setPrototypeOf({
            get owner() {
                return owner;
            },
            get ownsLock() {
                return owner._readers.has(handle);
            },
            async lock(cancelable?: Cancelable) {
                await owner._lockReader(handle, false, cancelable);
                return handle;
            },
            unlock() {
                owner._unlockReader(handle);
            }
        }, readerPrototype);
        return handle;
    }

    /**
     * Creates a `AsyncReaderWriterLockUpgradeableReader` that can be used to take and release "read" locks on a resource
     * and can be later upgraded to take and release "write" locks.
     */
    createUpgradeableReader() {
        const owner = this;
        const handle: AsyncReaderWriterLockUpgradeableReader = Object.setPrototypeOf({
            get owner() {
                return handle;
            },
            get ownsLock() {
                return owner._readers.has(handle);
            },
            async lock(cancelable?: Cancelable) {
                await owner._lockReader(handle, true, cancelable);
                return handle;
            },
            unlock() {
                owner._unlockReader(handle);
            },
            createWriter() {
                return owner._createUpgradedWriter(handle);
            },
            async upgrade(cancelable?: Cancelable) {
                const upgradedWriter = this.createWriter();
                await upgradedWriter.lock(cancelable);
                return upgradedWriter;
            }
        }, upgradeableReaderPrototype);
        return handle;
    }

    /**
     * Creates a `AsyncReaderWriterLockWriter` that can be used to take and release "write" locks on a resource.
     */
    createWriter() {
        const owner = this;
        const handle: AsyncReaderWriterLockWriter = Object.setPrototypeOf({
            get owner() {
                return owner;
            },
            get ownsLock() {
                return owner._writer === handle;
            },
            async lock(cancelable?: Cancelable) {
                await owner._lockWriter(handle, undefined, cancelable);
                return handle;
            },
            unlock() {
                owner._unlockWriter(handle);
            }
        }, writerPrototype);
        return handle;
    }

    private _createUpgradedWriter(upgradeable: AsyncReaderWriterLockUpgradeableReader) {
        const owner = this;
        const handle: AsyncReaderWriterLockWriter = Object.setPrototypeOf({
            get owner() {
                return owner;
            },
            get ownsLock() {
                return owner._writer === handle;
            },
            async lock(cancelable?: Cancelable) {
                await owner._lockWriter(handle, upgradeable, cancelable);
                return handle;
            },
            unlock() {
                owner._unlockWriter(handle);
            }
        }, upgradedWriterPrototype);
        return handle;
    }

    /**
     * Asynchronously waits for and takes a read lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    async read(cancelable?: Cancelable) {
        const reader = this.createReader();
        await reader.lock(cancelable);
        return reader;
    }

    /**
     * Asynchronously waits for and takes a read lock on a resource
     * that can later be upgraded to a write lock.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    async upgradeableRead(cancelable?: Cancelable) {
        const upgradeableReader = this.createUpgradeableReader();
        await upgradeableReader.lock(cancelable);
        return upgradeableReader;
    }

    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    async write(cancelable?: Cancelable) {
        const writer = this.createWriter();
        await writer.lock(cancelable);
        return writer;
    }

    private _processLockRequests(): void {
        if (this._processWriteRequest()) return;
        this._processReadRequests();
    }

    private _processWriteRequest(): boolean {
        if (this._canTakeWriteLock()) {
            if (this._writerQueue.resolveOne()) {
                return true;
            }
        }
        return false;
    }

    private _processReadRequests(): void {
        if (this._canTakeReadLock()) {
            this._readerQueue.resolveAll();
        }
    }

    private _canTakeReadLock() {
        return !this._writer
            && this._writerQueue.size === 0;
    }

    private _canTakeWriteLock() {
        return !this._writer
            && this._readers.size === 0;
    }

    private async _lockReader(handle: LockHandle, upgradeable: boolean, cancelable?: Cancelable) {
        Cancelable.throwIfSignaled(cancelable);
        while (true) {
            if (this._readers.has(handle)) {
                throw new Error("Lock already taken.");
            }
            if (this._canTakeReadLock() && !(upgradeable && this._upgradeable)) {
                this._readers.add(handle);
                if (upgradeable) {
                    this._upgradeable = handle;
                }
                return;
            }
            await this._readerQueue.wait(cancelable);
        }
    }

    private _unlockReader(handle: LockHandle): void {
        if (!this._readers.has(handle)) {
            throw new Error("Lock already released.");
        }
        if (handle === this._upgradeable) {
            if (this._writer) {
                throw new Error("Cannot unlock an upgraded lock.");
            }
            this._upgradeable = undefined;
        }
        this._readers.delete(handle);
        this._processLockRequests();
    }

    private async _lockWriter(handle: LockHandle, upgradeable: LockHandle | undefined, cancelable?: Cancelable) {
        Cancelable.throwIfSignaled(cancelable);
        while (true) {
            if (this._writer === handle) {
                throw new Error("Lock already taken.");
            }
            if (this._upgradeable !== upgradeable) {
                throw new Error("Lock already released.");
            }
            if (this._canTakeWriteLock()) {
                this._writer = handle;
                return;
            }
            await this._writerQueue.wait(cancelable);
        }
    }

    private _unlockWriter(handle: LockHandle): void {
        if (this._writer !== handle) {
            throw new Error("Lock already released.");
        }
        this._writer = undefined;
        this._processLockRequests();
    }
}

Object.defineProperty(AsyncReaderWriterLock.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLock" });

export interface AsyncReaderWriterLockReader extends LockHandle<AsyncReaderWriterLockReader> {
    /**
     * Gets the `AsyncReaderWriterLock` that owns this object.
     */
    readonly owner: AsyncReaderWriterLock;
}

export interface AsyncReaderWriterLockWriter extends LockHandle<AsyncReaderWriterLockWriter> {
    /**
     * Gets the `AsyncReaderWriterLock` that owns this object.
     */
    readonly owner: AsyncReaderWriterLock;
}

export interface AsyncReaderWriterLockUpgradedWriter extends LockHandle<AsyncReaderWriterLockUpgradedWriter> {
    /**
     * Gets the `AsyncReaderWriterLock` that owns this object.
     */
    readonly owner: AsyncReaderWriterLock;
}

export interface AsyncReaderWriterLockUpgradeableReader extends UpgradeableLockHandle<AsyncReaderWriterLockUpgradeableReader, AsyncReaderWriterLockUpgradedWriter> {
    /**
     * Gets the `AsyncReaderWriterLock` that owns this object.
     */
    readonly owner: AsyncReaderWriterLock;
    /**
     * Creates a `AsyncReaderWriterLockUpgradedWriter` that can be used to take and release "write" locks on a resource.
     */
    createWriter(): AsyncReaderWriterLockUpgradedWriter;
    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    upgrade(cancelable?: Cancelable): Promise<AsyncReaderWriterLockUpgradedWriter>;
}

const lockHandlePrototype: object = {
    get mutex() {
        return this;
    },
    async [AsyncLockable.lock](this: LockHandle, cancelable?: Cancelable) {
        await this.lock(cancelable);
        return this;
    },
    [AsyncLockable.unlock](this: LockHandle) {
        this.unlock();
    },
    [Disposable.dispose](this: LockHandle) {
        if (this.ownsLock) {
            this.unlock();
        }
    }
};

Object.setPrototypeOf(lockHandlePrototype, Disposable.prototype);
Object.defineProperty(lockHandlePrototype, Symbol.toStringTag, { configurable: true, value: "LockHandle" });

const readerPrototype: object = {};
Object.setPrototypeOf(readerPrototype, lockHandlePrototype);
Object.defineProperty(readerPrototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockReader" });

const writerPrototype: object = {};
Object.setPrototypeOf(writerPrototype, lockHandlePrototype);
Object.defineProperty(writerPrototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockWriter" });

const upgradeableReaderPrototype: object = {};
Object.setPrototypeOf(upgradeableReaderPrototype, readerPrototype);
Object.defineProperty(upgradeableReaderPrototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockUpgradeableReader" });

const upgradedWriterPrototype: object = {};
Object.setPrototypeOf(upgradedWriterPrototype, writerPrototype);
Object.defineProperty(upgradedWriterPrototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockUpgradedWriter" });
