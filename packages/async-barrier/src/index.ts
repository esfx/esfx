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

   Barrier is derived from the implementation of Barrier in
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

import { Cancelable, CancelError } from "@esfx/cancelable";
import { WaitQueue } from "@esfx/async-waitqueue";
import /*#__INLINE__*/ { isFunction, isNumber, isUndefined } from "@esfx/internal-guards";

/**
 * Enables multiple tasks to cooperatively work on an algorithm through
 * multiple phases.
 */
export class AsyncBarrier {
    private _isExecutingPostPhaseAction = false;
    private _postPhaseAction: ((barrier: AsyncBarrier) => void | PromiseLike<void>) | undefined;
    private _phaseNumber: number = 0;
    private _participantCount: number;
    private _remainingParticipants: number;
    private _waiters = new WaitQueue<void>();

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, { configurable: true, value: "AsyncBarrier" });
    }

    /**
     * Initializes a new instance of the Barrier class.
     *
     * @param participantCount The initial number of participants for the barrier.
     * @param postPhaseAction An action to execute between each phase.
     */
    constructor(participantCount: number, postPhaseAction?: (barrier: AsyncBarrier) => void | PromiseLike<void>) {
        if (!isNumber(participantCount)) throw new TypeError("Number expected: participantCount.");
        if ((participantCount |= 0) < 0) throw new RangeError("Argument out of range: participantCount.");
        if (!isUndefined(postPhaseAction) && !isFunction(postPhaseAction)) throw new TypeError("Function expected: postPhaseAction.");

        this._participantCount = participantCount;
        this._remainingParticipants = participantCount;
        this._postPhaseAction = postPhaseAction;
    }

    /**
     * Gets the number of the Barrier's current phase.
     */
    get currentPhaseNumber() {
        return this._phaseNumber;
    }

    /**
     * Gets the total number of participants in the barrier.
     */
    get participantCount() {
        return this._participantCount;
    }

    /**
     * Gets the number of participants in the barrier that haven't yet signaled in the current phase.
     */
    get remainingParticipants() {
        return this._remainingParticipants;
    }

    /**
     * Notifies the Barrier there will be additional participants.
     *
     * @param participantCount The number of additional participants.
     */
    add(participantCount: number = 1) {
        if (!isNumber(participantCount)) throw new TypeError("Number expected: participantCount.");
        if ((participantCount |= 0) <= 0) throw new RangeError("Argument out of range: participantCount.");
        if (this._isExecutingPostPhaseAction) throw new Error("This method may not be called from within the postPhaseAction.");

        this._participantCount += participantCount;
        this._remainingParticipants += participantCount;
    }

    /**
     * Notifies the Barrier there will be fewer participants.
     *
     * @param participantCount The number of participants to remove.
     */
    remove(participantCount: number = 1) {
        if (!isNumber(participantCount)) throw new TypeError("Number expected: participantCount.");
        if ((participantCount |= 0) <= 0) throw new RangeError("Argument out of range: participantCount.");
        if (this._participantCount < participantCount) throw new RangeError("Argument out of range: participantCount.");
        if (this._isExecutingPostPhaseAction) throw new Error("This method may not be called from within the postPhaseAction.");

        this._participantCount -= participantCount;
        this._remainingParticipants -= participantCount;
        if (this._participantCount === 0) {
            this._finishPhase();
        }
    }

    /**
     * Signals that a participant has reached the barrier and waits for all other participants
     * to reach the barrier.
     *
     * @param cancelable An optional Cancelable used to cancel the request.
     */
    async signalAndWait(cancelable?: Cancelable): Promise<void> {
        if (!isUndefined(cancelable) && !Cancelable.hasInstance(cancelable)) throw new TypeError("Cancelable expected: cancelable");

        const signal = cancelable?.[Cancelable.cancelSignal]();
        if (signal?.signaled) throw signal.reason ?? new CancelError();

        if (this._isExecutingPostPhaseAction) throw new Error("This method may not be called from within the postPhaseAction.");
        if (this._participantCount === 0) throw new Error("The barrier has no registered participants.");
        if (this._remainingParticipants === 0) throw new Error("The number of operations using the barrier exceeded the number of registered participants.");

        const waiter = this._waiters.wait(cancelable);
        this._remainingParticipants--;
        if (this._remainingParticipants === 0) {
            this._finishPhase();
        }
        
        await waiter;
    }

    private _finishPhase() {
        const postPhaseAction = this._postPhaseAction;
        if (postPhaseAction) {
            this._isExecutingPostPhaseAction = true;
            Promise
                .resolve()
                .then(() => postPhaseAction(this))
                .then(() => this._resolveNextPhase(), error => this._rejectNextPhase(error));
        }
        else {
            Promise
                .resolve()
                .then(() => this._resolveNextPhase());
        }
    }

    private _nextPhase() {
        this._isExecutingPostPhaseAction = false;
        this._remainingParticipants = this._participantCount;
        this._phaseNumber++;
    }

    private _resolveNextPhase() {
        this._nextPhase();
        this._waiters.resolveAll();
    }

    private _rejectNextPhase(error: any) {
        this._nextPhase();
        this._waiters.rejectAll(error);
    }
}
