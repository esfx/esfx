const { Event } = require("@esfx/events");

class MyService {
    constructor() {
        this._loadedEvent = Event.create(this);
        this.loadedEvent = this._loadedEvent.event;
    }

    load() {
        // ...
        this._loadedEvent.emit();
    }
}

// Use
const svc = new MyService();
svc.loadedEvent.on(() => console.log("loaded"));
svc.load();