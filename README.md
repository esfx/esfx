# `@esfx`

The `@esfx` suite of packages is designed to provide low-level interoperability between 3rd-party packages for a number of common operations.

# Packages

The main packages in the `@esfx` suite include:

- [`@esfx/async`](packages/async#readme) - Provides a number of asynchronous coordination primitives from the following packages:
    - [`@esfx/async-autoresetevent`](packages/async-autoresetevent#readme)
    - [`@esfx/async-barrier`](packages/async-barrier#readme)
    - [`@esfx/async-canceltoken`](packages/async-canceltoken#readme)
    - [`@esfx/async-conditionvariable`](packages/async-conditionvariable#readme)
    - [`@esfx/async-countdown`](packages/async-countdown#readme)
    - [`@esfx/async-deferred`](packages/async-deferred#readme)
    - [`@esfx/async-delay`](packages/async-delay#readme)
    - [`@esfx/async-lazy`](packages/async-lazy#readme)
    - [`@esfx/async-lockable`](packages/async-lockable#readme)
    - [`@esfx/async-manualresetevent`](packages/async-manualresetevent#readme)
    - [`@esfx/async-mutex`](packages/async-mutex#readme)
    - [`@esfx/async-queue`](packages/async-queue#readme)
    - [`@esfx/async-readerwriterlock`](packages/async-readerwriterlock#readme)
    - [`@esfx/async-semaphore`](packages/async-semaphore#readme)
    - [`@esfx/async-stack`](packages/async-stack#readme)
    - [`@esfx/async-waitqueue`](packages/async-waitqueue#readme)
- [`@esfx/cancelable`](packages/cancelable#readme) - A low-level Symbol-based API for defining a common cancellation protocol.
- [`@esfx/collection-core`](packages/collection-core#readme) - A low-level Symbol-based API for defining common collection behaviors.
- [`@esfx/collections`](packages/collections#readme) - A common collections API composed of the following packages:
    - [`@esfx/collections-hashmap`](packages/collections-hashmap#readme)
    - [`@esfx/collections-hashset`](packages/collections-hashset#readme)
    - [`@esfx/collections-linkedlist`](packages/collections-linkedlist#readme)
    - [`@esfx/collections-sortedmap`](packages/collections-sortedmap#readme)
    - [`@esfx/collections-sortedset`](packages/collections-sortedset#readme)
- [`@esfx/disposable`](packages/disposable#readme) - A low-level Symbol-based API for defining explicit resource management.
- [`@esfx/equatable`](packages/equatable#readme) - A low-level Symbol-based API for defining equality.
- [`@esfx/events`](packages/events#readme) - A low-level API for defining events.
- [`@esfx/indexed-object`](packages/indexed-object#readme) - A base class for custom integer-indexed objects.
- [`@esfx/lazy`](packages/lazy#readme) - Provides a class to simplify lazy-initialization logic.
- [`@esfx/metadata`](packages/metadata#readme) - An API for defining metadata about an object.
- [`@esfx/ref`](packages/ref#readme) - A low-level API for defining forward references.
- [`@esfx/threading`](packages/threading#readme) - Thread synchronization primitives for use with Workers:
    - [`@esfx/threading-autoresetevent`](packages/threading-autoresetevent#readme)
    - [`@esfx/threading-conditionvariable`](packages/threading-conditionvariable#readme)
    - [`@esfx/threading-countdown`](packages/threading-countdown#readme)
    - [`@esfx/threading-lockable`](packages/threading-lockable#readme)
    - [`@esfx/threading-manualresetevent`](packages/threading-manualresetevent#readme)
    - [`@esfx/threading-mutex`](packages/threading-mutex#readme)
    - [`@esfx/threading-semaphore`](packages/threading-semaphore#readme)
    - [`@esfx/threading-sleep`](packages/threading-sleep#readme)
    - [`@esfx/threading-spinwait`](packages/threading-spinwait#readme)
- [`@esfx/type-model`](packages/type-model#readme) - A number of useful types for TypeScript.

# Shims

Shim packages augment built-in objects with functionality from the main packages.

- [`@esfx/cancelable-dom-shim`](packages/cancelable-dom-shim#readme)
- [`@esfx/collection-core-shim`](packages/collection-core-shim#readme)
- [`@esfx/collection-core-dom-shim`](packages/collection-core-dom-shim#readme)
- [`@esfx/equatable-shim`](packages/equatable-shim#readme)
- [`@esfx/metadata-shim`](packages/metadata-shim#readme)
- [`@esfx/reflect-metadata-compat`](packages/reflect-metadata-compat#readme)

# Adapters

Adapter packages provide functionality to simplify interoperability scenarios with different platforms:

- [`@esfx/cancelable-dom`](packages/cancelable-dom#readme)

# Documentation

You can read more about the API [here](https://esfx.github.io/esfx/).

<!-- -->