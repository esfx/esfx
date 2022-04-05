const { Disposable } = require("@esfx/disposable");
const fs = require("fs");

class MyFileResouce {
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