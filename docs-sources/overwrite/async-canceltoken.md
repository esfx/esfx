---
uid: async-canceltoken
---

The `@esfx/async-canceltoken` package provides the @"async-canceltoken.CancelToken" class, an implementation of `@esfx/cancelable`.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/async-canceltoken
```

# Usage

* [Basic Usage](#basic-usage)
* [Linking Tokens](#linking-tokens)

## Basic Usage

### [TypeScript](#tab/ts)
```ts
import { CancelToken } from "@esfx/async-canceltoken";

// consume a cancel token
async function doWork(token = CancelToken.none) {
    // do some work
    await doSomeOtherWork(token);

    // throw an error if cancellation has been signaled since awaiting.
    token.throwIfSignaled();
}

function doSomeOtherWork(token = CancelToken.none) {
    return new Promise((resolve, reject) => {
        token.throwIfSignaled(); // throw if cancellation has already been signaled.

        // setup some external async operation...
        const worker = ...;

        // listen for cancellation and abort the worker.
        const subscription = token.subscribe(() => {
            worker.abort();
            reject(new CancelError());
        });
        
        // start working, resolve when done
        worker.start(resolve);
    });
}

// call an async function that supports cancellation
const source = CancelToken.source();
doWork(source.token).then(() => {
    // operation completed...
    source.close();
}, err => {
    if (err instanceof CancelError) {
        // operation was canceled..
    }
});

// cancel operation after 10 seconds
setTimeout(() => source.cancel(), 1000 * 10);
```

### [JavaScript (CommonJS)](#tab/js)
```js
const { CancelToken } = require("@esfx/async-canceltoken");

// consume a cancel token
async function doWork(token = CancelToken.none) {
    // do some work
    await doSomeOtherWork(token);

    // throw an error if cancellation has been signaled since awaiting.
    token.throwIfSignaled();
}

function doSomeOtherWork(token = CancelToken.none) {
    return new Promise((resolve, reject) => {
        token.throwIfSignaled(); // throw if cancellation has already been signaled.

        // setup some external async operation...
        const worker = ...;

        // listen for cancellation and abort the worker.
        const subscription = token.subscribe(() => {
            worker.abort();
            reject(new CancelError());
        });
        
        // start working, resolve when done
        worker.start(resolve);
    });
}

// call an async function that supports cancellation
const source = CancelToken.source();
doWork(source.token).then(() => {
    // operation completed...
    source.close();
}, err => {
    if (err instanceof CancelError) {
        // operation was canceled..
    }
});

// cancel operation after 10 seconds
setTimeout(() => source.cancel(), 1000 * 10);
```

***

## Linking Tokens

### [TypeScript](#tab/ts)
```ts
import { CancelToken } from "@esfx/async-canceltoken";

// You can compose a cancellation graph with a root CancelToken, allowing you to cancel a large
// number of asynchronous operations all at once

let rootSource = CancelToken.source();

function cancelAllDownloads() {
    // explicitly cancel all downloads
    rootSource.cancel();

    // reset the root source
    rootSource = CancelToken.source();
}

async function downloadFile(url, path, token = CancelToken.none) {
    // add own source for timeout after 60 seconds
    const timeoutSource = CancelToken.source();
    setTimeout(() => timeoutSource.cancel(), 60 * 1000);

    // download can be canceled by either 'rootSource', 'timeoutSource' or 'token':
    const linkedToken = CancelToken.race([rootSource.token, timeoutSource.token, token]);

    // ... use linkedToken to observe cancellation.
}
```

### [JavaScript (CommonJS)](#tab/js)
```js
const { CancelToken } = require("@esfx/async-canceltoken");

// You can compose a cancellation graph with a root CancelToken, allowing you to cancel a large
// number of asynchronous operations all at once

let rootSource = CancelToken.source();

function cancelAllDownloads() {
    // explicitly cancel all downloads
    rootSource.cancel();

    // reset the root source
    rootSource = CancelToken.source();
}

async function downloadFile(url, path, token = CancelToken.none) {
    // add own source for timeout after 60 seconds
    const timeoutSource = CancelToken.source();
    setTimeout(() => timeoutSource.cancel(), 60 * 1000);

    // download can be canceled by either 'rootSource', 'timeoutSource' or 'token':
    const linkedToken = CancelToken.race([rootSource.token, timeoutSource.token, token]);

    // ... use linkedToken to observe cancellation.
}
```

***
