---
uid: collection-core-dom-shim
---

Provides a global shim to add default @"collection-core" behaviors to global DOM objects.

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
    - @"collection-core.ReadonlyKeyedCollection"
- `AudioTrackList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `CSSRuleList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `CSSStyleDeclaration` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `ClientRectList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `DOMRectList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `DOMStringList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `DOMTokenList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `DataTransferItemList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `FileList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `FormData` implements:
    - @"collection-core.KeyedCollection"
    - @"collection-core.ReadonlyKeyedCollection"
- `HTMLAllCollection` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `HTMLCollectionBase` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `HTMLCollectionOf` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `HTMLFormElement` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `HTMLSelectElement` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `Headers` implements:
    - @"collection-core.KeyedCollection"
    - @"collection-core.ReadonlyKeyedCollection"
- `MediaKeyStatusMap` implements:
    - @"collection-core.ReadonlyKeyedCollection"
- `MediaList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `MimeTypeArray` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `NamedNodeMap` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `NodeList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `Plugin` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `PluginArray` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `RTCStatsReport` implements:
    - @"collection-core.ReadonlyKeyedCollection"
- `SVGLengthList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SVGNumberList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SVGStringList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SourceBufferList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SpeechGrammarList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SpeechRecognitionResult` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `SpeechRecognitionResultList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `StyleSheetList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `TextTrackCueList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `TextTrackList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `TouchList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"
- `URLSearchParams` implements:
    - @"collection-core.KeyedCollection"
    - @"collection-core.ReadonlyKeyedCollection"
    - @"collection-core.ReadonlyKeyedCollection"
- `VideoTrackList` implements:
    - @"collection-core.ReadonlyIndexedCollection"
    - @"collection-core.ReadonlyCollection"

To install the global shim, import @"collection-core-dom-shim":

## [TypeScript](#tab/ts)
```ts
import "@esfx/collection-core-dom-shim"; // triggers global-scope side effects
import { ReadonlyIndexedCollection } from "@esfx/collection-core";

document.anchors[ReadonlyIndexedCollection.size]; // gets the number of anchors in the document
```

## [JavaScript (CommonJS)](#tab/js)
```js
require("@esfx/collection-core-dom-shim"); // triggers global-scope side effects
const { ReadonlyIndexedCollection } = require("@esfx/collection-core");

document.anchors[ReadonlyIndexedCollection.size]; // gets the number of anchors in the document
```

***
