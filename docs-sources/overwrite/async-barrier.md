---
uid: async-barrier
---

The `@esfx/async-barrier` package provides the @"async-barrier.AsyncBarrier" class, an async coordination primitive.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-barrier
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { AsyncBarrier } from "@esfx/async-barrier";

async function main() {
    let count = 0;

    // Create a barrier with 3 participants and a post-phase action to print results.
    // When phase 2 completes, throw an exception to be observed by all participants.
    const barrier = new AsyncBarrier(3, b => {
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

## [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncBarrier } = require("@esfx/async-barrier");

async function main() {
    let count = 0;

    // Create a barrier with 3 participants and a post-phase action to print results.
    // When phase 2 completes, throw an exception to be observed by all participants.
    const barrier = new AsyncBarrier(3, b => {
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

***
