# `@esfx/struct-type`

Define structured types using `ArrayBuffer` and `SharedArrayBuffer`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/struct-type
```

# Usage

```ts
import { StructType, int32 } from "@esfx/struct-type";

// simple types
const Point = StructType([
    { name: "x", type: int32 },
    { name: "y", type: int32 },
]);

// complex types
const Line = StructType([
    { name: "p1", type: Point },
    { name: "p2", type: Point },
]);

// inherited types
const Point3D = StructType(Point, [
    { name: "z", type: int32 }
]);

// create instances
const p1 = new Point({ x: 1, y: 2 }); // by field name
const p2 = new Point([3, 4]); // by field ordinal

// copy contents
const buffer = new ArrayBuffer(16);
const l = new Line([p1, p2]);
l.writeTo(buffer);

// create from a buffer
const l2 = new Line(buffer);

// read from field names
console.log(l1.p1.x); // 1
console.log(l1.p1.y); // 2
console.log(l1.p2.x); // 3
console.log(l1.p2.y); // 4

// read from field ordinals
console.log(l1[0][0]); // 1
console.log(l1[0][1]); // 2
console.log(l1[1][0]); // 3
console.log(l1[1][1]); // 4
```

## Using with Workers

```ts
import { StructType, int32 } from "@esfx/struct-type";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

// NOTE: For TypeScript, the `as const` is needed in the 
//       declaration below to infer the correct field names.
//       For JavaScript, remove the `as const` and type annotations.

const ThreadData = StructType([
    { name: "itemsRemaining", type: int32 },
]);

if (isMainThread) {
    // this is running on the main thread...
    const data = new ThreadData(/*shared*/ true); // allocate struct using a SharedArrayBuffer
    data.itemsRemaining = 5;

    const worker = new Worker(__filename, { workerData: data.buffer });
    worker.on("message", message => {
        if (message === "done") {
            console.log(data.itemsRemaining); // 0
        }
    });
}
else if (parentPort) {
    // this is running in a background worker...
    const data = new ThreadData(workerData); // allocate struct using the SharedArrayBuffer
    while (data.itemsRemaining) {
        // do some work...
        data.itemsRemaining--;
    }
    parentPort.postMessage("done");
}

```

# API

You can read more about the API [here](https://esfx.js.org/esfx/api/struct-type.html).
