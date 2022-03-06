---
uid: '@esfx/events!'
---

Provides a low-level API for defining events.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/events
```

# Usage

## [TypeScript](#tab/ts)
```ts
import { Event } from "@esfx/events";

class MyService {
    private _loadedEvent = Event.create<(this: MyService) => void(this);
    readonly loadedEvent = this._loadedEvent.event;

    load() {
        ...
        this._loadedEvent.emit();
    }
}

const svc = new MyService();
svc.loadedEvent.on(() => console.log("loaded"));
svc.load();
```

## [JavaScript (CommonJS)](#tab/js)
```js
const { Event } = require("@esfx/events");

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

***