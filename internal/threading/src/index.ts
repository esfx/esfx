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

/* @internal */
export const enum SignalFlags {
    NonSignaled = 0,
    Signaled = 1 << 0,

    ManualReset = 1 << 1,
    ManualResetExcludes = ~(ManualReset | Signaled | NonSignaled),
    ManualResetSignaled = Signaled | ManualReset,
    ManualResetNonSignaled = NonSignaled | ManualReset,

    AutoReset = 1 << 2,
    AutoResetExcludes = ~(AutoReset | Signaled | NonSignaled),
    AutoResetSignaled = Signaled | AutoReset,
    AutoResetNonSignaled = NonSignaled | AutoReset,

    Mutex = 1 << 3,
    MutexExcludes = ~(Mutex | Signaled | NonSignaled),
    MutexLocked = Signaled | Mutex,
    MutexUnlocked = NonSignaled | Mutex,

    ConditionVariable = 1 << 4,
    ConditionVariableExcludes = ~(ConditionVariable),

    Semaphore = 1 << 5,
    SemaphoreExcludes = ~(Semaphore | Signaled | NonSignaled),
    SemaphoreLocked = Signaled | Semaphore,
    SemaphoreUnlocked = NonSignaled | Semaphore,

    Countdown = 1 << 6,
    CountdownExcludes = ~(Countdown | Signaled | NonSignaled),
    CountdownSignaled = Signaled | Countdown,
    CountdownNonSignaled = NonSignaled | Countdown,
}

/* @internal */
export function setArray(array: Int32Array, index: number, valueWhenNonSignaled: number, valueWhenSignaled: number, notifyCount: number) {
    if (Atomics.compareExchange(array, index, valueWhenNonSignaled, valueWhenSignaled) === valueWhenNonSignaled) {
        Atomics.notify(array, index, notifyCount);
        return true;
    }
    return false;
}

/* @internal */
export function resetArray(array: Int32Array, index: number, valueWhenNonSignaled: number, valueWhenSignaled: number) {
    return Atomics.compareExchange(array, index, valueWhenSignaled, valueWhenNonSignaled) === valueWhenSignaled;
}

/* @internal */
export function waitOneArray(array: Int32Array, index: number, valueWhenNonSignaled: number, ms = +Infinity) {
    return Atomics.wait(array, index, valueWhenNonSignaled, ms) !== "timed-out";
}

/* @internal */
export function lockArray(array: Int32Array, index: number, valueWhenUnlocked: number, valueWhenLocked: number, ms = +Infinity) {
    const start = Date.now();
    while (Atomics.compareExchange(array, index, valueWhenUnlocked, valueWhenLocked) !== valueWhenUnlocked) {
        if (ms <= 0 || Atomics.wait(array, index, valueWhenLocked, ms) === "timed-out") {
            return false;
        }
        if (isFinite(ms)) {
            ms -= Date.now() - start;
        }
    }
    return true;
}

/* @internal */
export function unlockArray(array: Int32Array, index: number, valueWhenUnlocked: number, valueWhenLocked: number) {
    if (Atomics.compareExchange(array, index, valueWhenLocked, valueWhenUnlocked) === valueWhenLocked) {
        return Atomics.notify(array, index, 1);
    }
    return -1;
}

/* @internal */
export function waitForArray(array: Int32Array, waitIndex: number, unlock: (array: Int32Array) => void, lock: (array: Int32Array) => void, ms: number, condition?: () => boolean) {
    while (!condition || !condition()) {
        unlock(array);
        let result: "ok" | "timed-out" | "not-equal" = "not-equal";
        while (result === "not-equal") {
            const waitCount = Atomics.load(array, waitIndex);
            result = Atomics.wait(array, waitIndex, waitCount, ms);
        }
        lock(array);
        if (result === "timed-out") {
            return false;
        }
        if (!condition) break;
    }
    return true;
}
