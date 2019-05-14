# `@esfx`

The `@esfx` suite of packages is designed to provide low-level interoperability between 3rd-party packages for a number of common operations.

# Packages

The main packages in the `@esfx` suite include:

- [`@esfx/equatable`](packages/equatable/README.md) - A low-level Symbol-based API for defining equality.
- [`@esfx/disposable`](packages/disposable/README.md) - A low-level Symbol-based API for defining explicit resource management.
- [`@esfx/collection-core`](packages/collection-core/README.md) - A low-level Symbol-based API for defining common collection behaviors.
- [`@esfx/collections`](packages/collections/README.md) - A common collections API composed of the following packages:
    - [`@esfx/collections-hashmap`](packages/collections-hashmap/README.md)
    - [`@esfx/collections-hashset`](packages/collections-hashset/README.md)
    - [`@esfx/collections-sortedmap`](packages/collections-sortedmap/README.md)
    - [`@esfx/collections-sortedset`](packages/collections-sortedset/README.md)
    - [`@esfx/collections-linkedlist`](packages/collections-linkedlist/README.md)
- [`@esfx/cancelable`](packages/cancelable/README.md) - A low-level Symbol-based API for defining a common cancellation protocol.
- [`@esfx/async`](packages/async/README.md) - Provides a number of asynchronous coordination primitives from the following packages:
    - [`@esfx/async-autoresetevent`](packages/async-autoresetevent/README.md)
    - [`@esfx/async-barrier`](packages/async-barrier/README.md)
    - [`@esfx/async-canceltoken`](packages/async-canceltoken/README.md)
    - [`@esfx/async-countdown`](packages/async-countdown/README.md)
    - [`@esfx/async-deferred`](packages/async-deferred/README.md)
    - [`@esfx/async-delay`](packages/async-delay/README.md)
    - [`@esfx/async-manualresetevent`](packages/async-manualresetevent/README.md)
    - [`@esfx/async-queue`](packages/async-queue/README.md)
    - [`@esfx/async-readerwriterlock`](packages/async-readerwriterlock/README.md)
    - [`@esfx/async-semaphore`](packages/async-semaphore/README.md)
    - [`@esfx/async-stack`](packages/async-stack/README.md)
- [`@esfx/events`](packages/events/README.md) - A low-level API for defining events.
- [`@esfx/indexed-object`](packages/indexed-object/README.md) - A base class for custom integer-indexed objects.
- [`@esfx/metadata`](packages/metadata/README.md) - An API for defining metadata about an object.
- [`@esfx/ref`](packages/ref/README.md) - A low-level API for defining forward references.
- [`@esfx/lazy`](packages/lazy/README.md) - Provides a class to simplify lazy-initialization logic.
- [`@esfx/type-model`](packages/type-model/README.md) - A number of useful types for TypeScript.

# Shims

Shim packages augment built-in objects with functionality from the main packages.

- [`@esfx/equatable-shim`](packages/equatable-shim/README.md)
- [`@esfx/collection-core-shim`](packages/collection-core-shim/README.md)
- [`@esfx/collection-core-dom-shim`](packages/collection-core-dom-shim/README.md)
- [`@esfx/cancelable-dom-shim`](packages/cancelable-dom-shim/README.md)
- [`@esfx/metadata-shim`](packages/metadata-shim/README.md)
- [`@esfx/reflect-metadata-compat`](packages/reflect-metadata-compat/README.md)

# Adapters

Adapter packages provide functionality to simplify interoperability scenarios with different platforms:

- [`@esfx/cancelable-dom`](packages/cancelable-dom/README.md)
