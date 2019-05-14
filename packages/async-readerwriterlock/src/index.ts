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

import { LinkedList } from "@esfx/collections-linkedlist";
import { Cancelable, CancelError } from "@esfx/cancelable";
import { CancelToken } from "@esfx/async-canceltoken";
import { Disposable } from '@esfx/disposable';

/**
 * Coordinates readers and writers for a resource.
 */
export class ReaderWriterLock {
    private _readers = new LinkedList<() => void>();
    private _upgradeables = new LinkedList<() => void>();
    private _upgrades = new LinkedList<() => void>();
    private _writers = new LinkedList<() => void>();
    private _upgradeable: UpgradeableLockHandle | undefined;
    private _upgraded: LockHandle | undefined;
    private _count = 0;

    /**
     * Asynchronously waits for and takes a read lock on a resource.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    read(cancelable?: Cancelable): Promise<LockHandle> {
        return new Promise<LockHandle>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            if (this._canTakeReadLock()) {
                resolve(this._takeReadLock());
                return;
            }

            const node = this._readers.push(() => {
                subscription.unsubscribe();
                if (token.signaled) {
                    reject(new CancelError());
                }
                else {
                    resolve(this._takeReadLock());
                }
            });

            const subscription = token.subscribe(() => {
                if (node.detachSelf()) {
                    reject(new CancelError());
                }
            });
        });
    }

    /**
     * Asynchronously waits for and takes a read lock on a resource
     * that can later be upgraded to a write lock.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    upgradeableRead(cancelable?: Cancelable): Promise<UpgradeableLockHandle> {
        return new Promise<UpgradeableLockHandle>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            if (this._canTakeUpgradeableReadLock()) {
                resolve(this._takeUpgradeableReadLock());
                return;
            }

            const node = this._upgradeables.push(() => {
                subscription.unsubscribe();
                if (token.signaled) {
                    reject(new CancelError());
                }
                else {
                    resolve(this._takeUpgradeableReadLock());
                }
            });

            const subscription = token.subscribe(() => {
                if (node.list) {
                    node.list.deleteNode(node);
                    reject(new CancelError());
                }
            });
        });
    }

    /**
     * Asynchronously waits for and takes a write lock on a resource.
     *
     * @param cancelable A Cancelable used to cancel the request.
     */
    write(cancelable?: Cancelable): Promise<LockHandle> {
        return new Promise<LockHandle>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            if (this._canTakeWriteLock()) {
                resolve(this._takeWriteLock());
                return;
            }

            const node = this._writers.push(() => {
                subscription.unsubscribe();
                if (token.signaled) {
                    reject(new CancelError());
                }
                else {
                    resolve(this._takeWriteLock());
                }
            });

            const subscription = token.subscribe(() => {
                if (node.list) {
                    node.list.deleteNode(node);
                    reject(new CancelError());
                }
            });
        });
    }

    private _upgrade(cancelable?: Cancelable): Promise<LockHandle> {
        return new Promise<LockHandle>((resolve, reject) => {
            const token = CancelToken.from(cancelable);
            token.throwIfSignaled();

            if (this._canTakeUpgradeLock()) {
                resolve(this._takeUpgradeLock());
                return;
            }

            const node = this._upgrades.push(() => {
                subscription.unsubscribe();
                if (token.signaled) {
                    reject(new CancelError());
                }
                else {
                    resolve(this._takeUpgradeLock());
                }
            });

            const subscription = token.subscribe(() => {
                if (node.list) {
                    node.list.deleteNode(node);
                    reject(new CancelError());
                }
            });
        });
    }

    private _processLockRequests(): void {
        if (this._processWriteLockRequest()) return;
        if (this._processUpgradeRequest()) return;
        this._processUpgradeableReadLockRequest();
        this._processReadLockRequests();
    }

    private _canTakeReadLock() {
        return this._count >= 0
            && this._writers.size === 0
            && this._upgrades.size === 0
            && this._writers.size === 0;
    }

    private _processReadLockRequests(): void {
        if (this._canTakeReadLock()) {
            this._readers.forEach(resolve => resolve());
            this._readers.clear();
        }
    }

    private _takeReadLock(): LockHandle {
        let released = false;
        this._count++;
        const release = () => {
            if (released)
                throw new Error("Lock already released.");
            released = true;
            this._releaseReadLock();
        };
        return {
            release,
            [Disposable.dispose]: release,
        };
    }

    private _releaseReadLock(): void {
        this._count--;
        this._processLockRequests();
    }

    private _canTakeUpgradeableReadLock() {
        return this._count >= 0 && !this._upgradeable;
    }

    private _processUpgradeableReadLockRequest(): void {
        if (this._canTakeUpgradeableReadLock()) {
            const resolve = this._upgradeables.shift();
            if (resolve) {
                resolve();
            }
        }
    }

    private _takeUpgradeableReadLock(): UpgradeableLockHandle {
        const upgrade = (cancelable?: Cancelable) => {
            if (this._upgradeable !== hold) throw new Error("Lock already released.");
            return this._upgrade(cancelable);
        };
        const release = () => {
            if (this._upgradeable !== hold) throw new Error("Lock already released.");
            this._releaseUpgradeableReadLock();
        };
        const hold: UpgradeableLockHandle = {
            upgrade,
            release,
            [Disposable.dispose]: release,
        };
        this._count++;
        this._upgradeable = hold;
        return hold;
    }

    private _releaseUpgradeableReadLock(): void {
        if (this._count === -1) {
            this._count = 0;
        }
        else {
            this._count--;
        }

        this._upgraded = undefined;
        this._upgradeable = undefined;
        this._processLockRequests();
    }

    private _canTakeUpgradeLock() {
        return this._count === 1
            && this._upgradeable
            && !this._upgraded;
    }

    private _processUpgradeRequest(): boolean {
        if (this._canTakeUpgradeLock()) {
            const resolve = this._upgrades.shift();
            if (resolve) {
                resolve();
                return true;
            }
        }

        return false;
    }

    private _takeUpgradeLock(): LockHandle {
        const release = () => {
            if (this._upgraded !== hold)
                throw new Error("Lock already released.");
            this._releaseUpgradeLock();
        };
        const hold: LockHandle = {
            release,
            [Disposable.dispose]: release
        };

        this._upgraded = hold;
        this._count = -1;
        return hold;
    }

    private _releaseUpgradeLock(): void {
        this._upgraded = undefined;
        this._count = 1;
        this._processLockRequests();
    }

    private _canTakeWriteLock() {
        return this._count === 0;
    }

    private _processWriteLockRequest(): boolean {
        if (this._canTakeWriteLock()) {
            const resolve = this._writers.shift();
            if (resolve) {
                resolve();
                return true;
            }
        }

        return false;
    }

    private _takeWriteLock(): LockHandle {
        let released = false;
        this._count = -1;
        const release = () => {
            if (released)
                throw new Error("Lock already released.");
            released = true;
            this._releaseWriteLock();
        };
        return {
            release,
            [Disposable.dispose]: release,
        };
    }

    private _releaseWriteLock(): void {
        this._count = 0;
        this._processLockRequests();
    }
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