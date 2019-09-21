---
uid: esfx
title: '@esfx reference'
---
The `@esfx` suite of packages is designed to provide low-level interoperability between 3rd-party packages for a number of common operations.

# Packages

The main packages in the `@esfx` suite include:

- @"@esfx/async!" - Provides a number of asynchronous coordination primitives from the following packages:
    - @"@esfx/async-autoresetevent!"
    - @"@esfx/async-barrier!"
    - @"@esfx/async-canceltoken!"
    - @"@esfx/async-conditionvariable!"
    - @"@esfx/async-countdown!"
    - @"@esfx/async-deferred!"
    - @"@esfx/async-delay!"
    - @"@esfx/async-lazy!"
    - @"@esfx/async-lockable!"
    - @"@esfx/async-manualresetevent!"
    - @"@esfx/async-mutex!"
    - @"@esfx/async-queue!"
    - @"@esfx/async-readerwriterlock!"
    - @"@esfx/async-semaphore!"
    - @"@esfx/async-stack!"
    - @"@esfx/async-waitqueue!"
- @"@esfx/cancelable!" - A low-level Symbol-based API for defining a common cancellation protocol.
- @"@esfx/collection-core!" - A low-level Symbol-based API for defining common collection behaviors.
- @"@esfx/collections!" - A common collections API composed of the following packages:
    - @"@esfx/collections-hashmap!"
    - @"@esfx/collections-hashset!"
    - @"@esfx/collections-linkedlist!"
    - @"@esfx/collections-sortedmap!"
    - @"@esfx/collections-sortedset!"
- @"@esfx/disposable!" - A low-level Symbol-based API for defining explicit resource management.
- @"@esfx/equatable!" - A low-level Symbol-based API for defining equality.
- @"@esfx/events!" - A low-level API for defining events.
- @"@esfx/indexed-object!" - A base class for custom integer-indexed objects.
- @"@esfx/lazy!" - Provides a class to simplify lazy-initialization logic.
- @"@esfx/metadata!" - An API for defining metadata about an object.
- @"@esfx/ref!" - A low-level API for defining forward references.
- @"@esfx/threading!" - Thread synchronization primitives for use with Workers:
    - @"@esfx/threading-autoresetevent!"
    - @"@esfx/threading-conditionvariable!"
    - @"@esfx/threading-countdown!"
    - @"@esfx/threading-lockable!"
    - @"@esfx/threading-manualresetevent!"
    - @"@esfx/threading-mutex!"
    - @"@esfx/threading-semaphore!"
    - @"@esfx/threading-sleep!"
    - @"@esfx/threading-spinwait!"
- @"@esfx/type-model!" - A number of useful types for TypeScript.

# Shims

Shim packages augment built-in objects with functionality from the main packages.

- @"@esfx/cancelable-dom-shim!"
- @"@esfx/collection-core-shim!"
- @"@esfx/collection-core-dom-shim!"
- @"@esfx/equatable-shim!"
- @"@esfx/metadata-shim!"
- @"@esfx/reflect-metadata-compat!"

# Adapters

Adapter packages provide functionality to simplify interoperability scenarios with different platforms:

- @"@esfx/cancelable-dom!"
