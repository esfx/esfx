# `@esfx/collection-core-dom-shim`

The `@esfx/collection-core-dom-shim` package provides a global shim to add default @esfx/collection-core behaviors to global DOM objects.

# Overview

* [Installation](#installation)
* [Usage](#usage)

# Installation

```sh
npm i @esfx/collection-core-dom-shim
```

# Usage

The global shim adds a default implementation the collection interfaces to the following global DOM objects:

- `AudioParamMap` implements:
    - `ReadonlyKeyedCollection`
- `AudioTrackList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `CSSRuleList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `CSSStyleDeclaration` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `ClientRectList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `DOMRectList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `DOMStringList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `DOMTokenList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `DataTransferItemList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `FileList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `FormData` implements:
    - `KeyedCollection`
    - `ReadonlyKeyedCollection`
- `HTMLAllCollection` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `HTMLCollectionBase` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `HTMLCollectionOf` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `HTMLFormElement` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `HTMLSelectElement` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `Headers` implements:
    - `KeyedCollection`
    - `ReadonlyKeyedCollection`
- `MediaKeyStatusMap` implements:
    - `ReadonlyKeyedCollection`
- `MediaList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `MimeTypeArray` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `NamedNodeMap` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `NodeList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `Plugin` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `PluginArray` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `RTCStatsReport` implements:
    - `ReadonlyKeyedCollection`
- `SVGLengthList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SVGNumberList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SVGStringList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SourceBufferList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SpeechGrammarList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SpeechRecognitionResult` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `SpeechRecognitionResultList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `StyleSheetList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `TextTrackCueList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `TextTrackList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `TouchList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`
- `URLSearchParams` implements:
    - `KeyedCollection`
    - `ReadonlyKeyedCollection`
    - `ReadonlyKeyedCollection`
- `VideoTrackList` implements:
    - `ReadonlyIndexedCollection`
    - `ReadonlyCollection`

To install the global shim, import `@esfx/collection-core-dom-shim`:

```ts
import "@esfx/collection-core-dom-shim"; // triggers global-scope side effects
import { ReadonlyIndexedCollection } from "@esfx/collection-core";

document.anchors[ReadonlyIndexedCollection.size]; // gets the number of anchors in the document
```
