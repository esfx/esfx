# `@esfx/async-barrier`

The `@esfx/async-barrier` package provides the `Barrier` class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-barrier
```

# Usage

```ts
import { Barrier } from "@esfx/async-barrier";

async function main() {
    let count = 0;

    // Create a barrier with 3 participants and a post-phase action to print results.
    // When phase 2 completes, throw an exception to be observed by all participants.
    const barrier = new Barrier(3, b => {
        console.log(`Post-phase action: count=${count}, phase=${b.currentPhaseNumber}`);
        if (b.currentPhaseNumber === 2) throw new Error("Oops");
    });

    // Add two participants
    barrier.add(2);
    barrier.participantCount; // 5

    // Remove one participant
    barrier.remove();
    barrier.participantcount; // 4

    const action = async () => {
        count++;

        // Wait for the current phase to end. During the post-phase action 'count' will be 4 and 
        // 'phase' will be 0.
        await barrier.signalAndWait();

        count++;

        // Wait for the current phase to end. During the post-phase action 'count' will be 8 and 
        // 'phase' will be 1.
        await barrier.signalAndWait();

        count++;

        // When phase 2 ends an exception is thrown to all participants:
        try {
            await barrier.signalAndWait();
        }
        catch (e) {
            console.log(`Caught error: ${e.message}`);
        }

        // Wait for the current phase to end. During the post-phase action 'count' will be 16 and 
        // 'phase' will be 3.
        await barrier.signalAndWait();
    };

    // Start 4 async actions to serve as the 4 participants.
    await Promise.all([action(), action(), action(), action()]);
}

main();
// prints:
// Post-phase action: count=4, phase=0
// Post-phase action: count=8, phase=1
// Post-phase action: count=12, phase=2
// Caught error: Oops
// Post-phase action: count=16, phase=3
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * Enables multiple tasks to cooperatively work on an algorithm through
 * multiple phases.
 */
export declare class Barrier {
    /**
     * Initializes a new instance of the Barrier class.
     *
     * @param participantCount The initial number of participants for the barrier.
     * @param postPhaseAction An action to execute between each phase.
     */
    constructor(participantCount: number, postPhaseAction?: (barrier: Barrier) => void | PromiseLike<void>);
    /**
     * Gets the number of the Barrier's current phase.
     */
    readonly currentPhaseNumber: number;
    /**
     * Gets the total number of participants in the barrier.
     */
    readonly participantCount: number;
    /**
     * Gets the number of participants in the barrier that haven't yet signaled in the current phase.
     */
    readonly remainingParticipants: number;
    /**
     * Notifies the Barrier there will be additional participants.
     *
     * @param participantCount The number of additional participants.
     */
    add(participantCount?: number): void;
    /**
     * Notifies the Barrier there will be fewer participants.
     *
     * @param participantCount The number of participants to remove.
     */
    remove(participantCount?: number): void;
    /**
     * Signals that a participant has reached the barrier and waits for all other participants
     * to reach the barrier.
     *
     * @param cancelable An optional Cancelable used to cancel the request.
     */
    signalAndWait(cancelable?: Cancelable): Promise<void>;
}
```
