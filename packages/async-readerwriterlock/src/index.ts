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
import { Cancelable, CancelError } from "@esfx/cancelable";
import { Disposable } from "@esfx/disposable";
import /*#__INLINE__*/ { isUndefined } from "@esfx/internal-guards";

export { LockHandle, UpgradeableLockHandle } from "@esfx/async-lockable";

let readerOwnsLock: (owner: AsyncReaderWriterLock, reader: LockHandle) => boolean;
let lockReader: (owner: AsyncReaderWriterLock, reader: LockHandle, upgradeable: boolean, cancelable?: Cancelable) => Promise<void>;
let unlockReader: (owner: AsyncReaderWriterLock, reader: LockHandle) => void;
let createUpgradedWriter: (owner: AsyncReaderWriterLock, reader: AsyncReaderWriterLockUpgradeableReader) => AsyncReaderWriterLockWriter;
let writerOwnsLock: (owner: AsyncReaderWriterLock, writer: LockHandle) => boolean;
let lockWriter: (owner: AsyncReaderWriterLock, writer: LockHandle, upgradeable: LockHandle | undefined, cancelable?: Cancelable) => Promise<void>;
let unlockWriter: (owner: AsyncReaderWriterLock, writer: LockHandle) => void;

/**
 * Coordinates readers and writers for a resource.
 */
export class AsyncReaderWriterLock {
    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLock" });
        readerOwnsLock = (owner, reader) => owner._readers.has(reader);
        lockReader = (owner, reader, upgradeable, cancelable) => owner._lockReader(reader, upgradeable, cancelable);
        unlockReader = (owner, reader) => owner._unlockReader(reader);
        createUpgradedWriter = (owner, reader) => owner._createUpgradedWriter(reader);
        writerOwnsLock = (owner, writer) => owner._writer === writer;
        lockWriter = (owner, writer, upgradeable, cancelable) => owner._lockWriter(writer, upgradeable, cancelable);
        unlockWriter = (owner, writer) => owner._unlockWriter(writer);
    }

    private _readerQueue = new WaitQueue<void>();
    private _writerQueue = new WaitQueue<void>();
    private _readers = new Set<LockHandle>();
    private _writer: LockHandle | undefined;
    private _upgradeable: LockHandle | undefined;

    /**
     * Creates a `AsyncReaderWriterLockReader` that can be used to take and release "read" locks on a resource.
     */
    createReader(): AsyncReaderWriterLockReader {
        return new AsyncReaderWriterLockReader(this);
    }

    /**
     * Creates a `AsyncReaderWriterLockUpgradeableReader` that can be used to take and release "read" locks on a resource
     * and can be later upgraded to take and release "write" locks.
     */
    createUpgradeableReader(): AsyncReaderWriterLockUpgradeableReader {
        return new AsyncReaderWriterLockUpgradeableReader(this);
    }

    /**
     * Creates a `AsyncReaderWriterLockWriter` that can be used to take and release "write" locks on a resource.
     */
    createWriter(): AsyncReaderWriterLockWriter {
        return new AsyncReaderWriterLockWriter(this);
    }

    private _createUpgradedWriter(upgradeable: AsyncReaderWriterLockUpgradeableReader): AsyncReaderWriterLockWriter {
        return new AsyncReaderWriterLockWriter(this, upgradeable);
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
        if (!isUndefined(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");

        const signal = cancelable?.[Cancelable.cancelSignal]();
        if (signal?.signaled) throw signal.reason ?? new CancelError();

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
        if (!isUndefined(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");

        const signal = cancelable?.[Cancelable.cancelSignal]();
        if (signal?.signaled) throw signal.reason ?? new CancelError();

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

export interface AsyncReaderWriterLockUpgradeableReader extends UpgradeableLockHandle<AsyncReaderWriterLockUpgradeableReader, AsyncReaderWriterLockWriter> {
    /**
     * Gets the `AsyncReaderWriterLock` that owns this object.
     */
    readonly owner: AsyncReaderWriterLock;

    /**
     * Creates a `AsyncReaderWriterLockWriter` that can be used to take and release "write" locks on a resource.
     */
    createWriter(): AsyncReaderWriterLockWriter;

    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A `Cancelable` used to cancel the request.
     */
    upgrade(cancelable?: Cancelable): Promise<AsyncReaderWriterLockWriter>;
}

abstract class AsyncReaderWriterLockBase {
    static {
        Object.defineProperty(this, "constructor", { ...Object.getOwnPropertyDescriptor(this, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLock" });
    }

    private _owner: AsyncReaderWriterLock;

    constructor(owner: AsyncReaderWriterLock) {
        this._owner = owner;
    }

    get owner() {
        return this._owner;
    }
    
    get mutex(): this {
        return this;
    }

    abstract get ownsLock(): boolean;
    abstract lock(cancelable?: Cancelable): Promise<this>;
    abstract unlock(): void;

    async [AsyncLockable.lock](cancelable?: Cancelable): Promise<LockHandle<AsyncLockable>> {
        await this.lock(cancelable);
        return this;
    }

    [AsyncLockable.unlock](): void {
        this.unlock();
    }

    [Disposable.dispose](): void {
        if (this.ownsLock) {
            this.unlock();
        }
    }
}

const AsyncReaderWriterLockReader = class extends AsyncReaderWriterLockBase implements AsyncReaderWriterLockReader {
    static {
        Object.defineProperty(this, "constructor", { ...Object.getOwnPropertyDescriptor(this, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockReader" });
    }

    get ownsLock(): boolean {
        return readerOwnsLock(this.owner, this);
    }

    async lock(cancelable?: Cancelable): Promise<this> {
        await lockReader(this.owner, this, /*upgradeable*/ false, cancelable);
        return this;
    }

    unlock(): void {
        unlockReader(this.owner, this);
    }
}

const AsyncReaderWriterLockUpgradeableReader = class extends AsyncReaderWriterLockBase implements AsyncReaderWriterLockUpgradeableReader {
    static {
        Object.defineProperty(this, "constructor", { ...Object.getOwnPropertyDescriptor(this, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockReader" });
    }

    get ownsLock(): boolean {
        return readerOwnsLock(this.owner, this);
    }

    async lock(cancelable?: Cancelable): Promise<this> {
        await lockReader(this.owner, this, /*upgradeable*/ true, cancelable);
        return this;
    }

    unlock(): void {
        unlockReader(this.owner, this);
    }

    createWriter(): AsyncReaderWriterLockWriter {
        return createUpgradedWriter(this.owner, this);
    }

    async upgrade(cancelable?: Cancelable): Promise<AsyncReaderWriterLockWriter> {
        const upgradedWriter = this.createWriter();
        await upgradedWriter.lock(cancelable);
        return upgradedWriter;
    }
};

const AsyncReaderWriterLockWriter = class extends AsyncReaderWriterLockBase implements AsyncReaderWriterLockWriter {
    static {
        Object.defineProperty(this, "constructor", { ...Object.getOwnPropertyDescriptor(this, "constructor"), value: Object });
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncReaderWriterLockWriter" });
    }

    private _upgradeable: LockHandle | undefined;

    constructor(owner: AsyncReaderWriterLock, upgradeable?: LockHandle) {
        super(owner);
        this._upgradeable = upgradeable;
    }

    get ownsLock(): boolean {
        return writerOwnsLock(this.owner, this);
    }

    async lock(cancelable?: Cancelable): Promise<this> {
        await lockWriter(this.owner, this, this._upgradeable, cancelable);
        return this;
    }

    unlock() {
        unlockWriter(this.owner, this);
    }
};
