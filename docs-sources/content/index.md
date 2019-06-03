---
uid: esfx
title: '@esfx reference'
---
The `@esfx` suite of packages is designed to provide low-level interoperability between 3rd-party packages for a number of common operations.

# Packages

The main packages in the `@esfx` suite include:

- @"async" - Provides a number of asynchronous coordination primitives from the following packages:
    - @"async-autoresetevent"
    - @"async-barrier"
    - @"async-canceltoken"
    - @"async-conditionvariable"
    - @"async-countdown"
    - @"async-deferred"
    - @"async-delay"
    - @"async-lazy"
    - @"async-lockable"
    - @"async-manualresetevent"
    - @"async-mutex"
    - @"async-queue"
    - @"async-readerwriterlock"
    - @"async-semaphore"
    - @"async-stack"
    - @"async-waitqueue"
- @"cancelable" - A low-level Symbol-based API for defining a common cancellation protocol.
- @"collection-core" - A low-level Symbol-based API for defining common collection behaviors.
- @"collections" - A common collections API composed of the following packages:
    - @"collections-hashmap"
    - @"collections-hashset"
    - @"collections-linkedlist"
    - @"collections-sortedmap"
    - @"collections-sortedset"
- @"disposable" - A low-level Symbol-based API for defining explicit resource management.
- @"equatable" - A low-level Symbol-based API for defining equality.
- @"events" - A low-level API for defining events.
- @"indexed-object" - A base class for custom integer-indexed objects.
- @"lazy" - Provides a class to simplify lazy-initialization logic.
- @"metadata" - An API for defining metadata about an object.
- @"ref" - A low-level API for defining forward references.
- @"threading" - Thread synchronization primitives for use with Workers:
    - @"threading-autoresetevent"
    - @"threading-conditionvariable"
    - @"threading-countdown"
    - @"threading-lockable"
    - @"threading-manualresetevent"
    - @"threading-mutex"
    - @"threading-semaphore"
    - @"threading-sleep"
    - @"threading-spinwait"
- @"type-model" - A number of useful types for TypeScript.

# Shims

Shim packages augment built-in objects with functionality from the main packages.

- @"cancelable-dom-shim"
- @"collection-core-shim"
- @"collection-core-dom-shim"
- @"equatable-shim"
- @"metadata-shim"
- @"reflect-metadata-compat"

# Adapters

Adapter packages provide functionality to simplify interoperability scenarios with different platforms:

- @"cancelable-dom"
