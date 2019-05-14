# `@esfx/async-delay`

The `@esfx/async-delay` package provides the `delay` function.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/async-delay
```

# Usage

```ts
import { delay } from "@esfx/async-delay";

async function doSomeAction() {
    // wait 10 seconds
    await delay(10 * 1000);
}
```

# API

```ts
import { Cancelable } from "@esfx/cancelable";
/**
 * Waits the specified number of milliseconds before resolving.
 *
 * @param msec The number of milliseconds to wait before resolving.
 */
export declare function delay(msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving.
 *
 * @param msec The number of milliseconds to wait before resolving.
 */
export declare function delay(msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 *
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export declare function delay<T>(msec: number, value: T | PromiseLike<T>): Promise<T>;
/**
 * Waits the specified number of milliseconds before resolving.
 *
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 */
export declare function delay(cancelable: Cancelable, msec: number): Promise<void>;
/**
 * Waits the specified number of milliseconds before resolving with the provided value.
 *
 * @param cancelable A Cancelable
 * @param msec The number of milliseconds to wait before resolving.
 * @param value An optional value for the resulting Promise.
 */
export declare function delay<T>(cancelable: Cancelable, msec: number, value: T | PromiseLike<T>): Promise<T>;
```
