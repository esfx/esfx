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

You can read more about the API [here](https://esfx.js.org/esfx/api/events.html).
