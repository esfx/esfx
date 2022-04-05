import { Disposable } from "@esfx/disposable";
import * as fs from "fs";

class MyFileResouce {
    private _handle?: number;

    constructor() {
        this._handle = fs.openSync("path/to/file", "r");
    }

    close() {
        if (this._handle !== undefined) {
            fs.closeSync(this._handle);
            this._handle = undefined;
        }
    }
    
    // provide low-level 'dispose' primitive for interop
    [Disposable.dispose]() {
        this.close();
    }
}