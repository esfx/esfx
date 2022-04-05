import { Event } from "@esfx/events";

class MyService {
    private _loadedEvent = Event.create<(this: MyService) => void>(this);
    readonly loadedEvent = this._loadedEvent.event;

    load() {
        // ...
        this._loadedEvent.emit();
    }
}

const svc = new MyService();
svc.loadedEvent.on(() => console.log("loaded"));
svc.load();