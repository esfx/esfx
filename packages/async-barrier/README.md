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
