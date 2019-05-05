# `@esfx/events`

The `@esfx/events` package provides a low-level API for defining events.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/events
```

# Usage

```ts
import { Event } from "@esfx/events";

// Definition (TypeScript)
class MyService {
    private _loadedEvent = Event.create<(this: MyService) => void(this);
    readonly loadedEvent = this._loadedEvent.event;

    load() {
        ...
        this._loadedEvent.emit();
    }
}

// Definition (JavaScript)
class MyService {
    constructor() {
        this._loadedEvent = Event.create(this);
        this.loadedEvent = this._loadedEvent.event;
    }

    load() {
        ...
        this._loadedEvent.emit();
    }
}

// Use
const svc = new MyService();
svc.loadedEvent.on(() => console.log("loaded"));
svc.load();
```

# API

```ts
export declare type EventListener<F extends (...args: any[]) => void> = (this: ThisParameterType<F>, ...args: Parameters<F>) => void;
export declare class EventSource<F extends (...args: any[]) => void> {
    private constructor();
    readonly event: Event<F>;
    readonly owner: ThisParameterType<F>;
    emit(...args: Parameters<F>): boolean;
}
export interface Event<F extends (...args: any[]) => void> extends Function {
    (listener: EventListener<F>): ThisParameterType<F>;
}
export declare class Event<F extends (...args: any[]) => void> {
    private constructor();
    readonly owner: ThisParameterType<F>;
    readonly count: number;
    static create<F extends (this: undefined, ...args: any[]) => void>(): EventSource<F>;
    static create<F extends (...args: any[]) => void>(owner: ThisParameterType<F>): EventSource<F>;
    addListener(listener: EventListener<F>): ThisParameterType<F>;
    on(listener: EventListener<F>): ThisParameterType<F>;
    once(listener: EventListener<F>): ThisParameterType<F>;
    prependListener(listener: EventListener<F>): ThisParameterType<F>;
    prependOnceListener(listener: EventListener<F>): ThisParameterType<F>;
    removeListener(listener: EventListener<F>): ThisParameterType<F>;
    off(listener: EventListener<F>): ThisParameterType<F>;
    removeAllListeners(): ThisParameterType<F>;
    listeners(): IterableIterator<EventListener<F>>;
    rawListeners(): IterableIterator<EventListener<F>>;
}
```