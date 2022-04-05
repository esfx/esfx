---
uid: '@esfx/collection-core-dom-shim!'
---

Provides a global shim to add default @"@esfx/collection-core!" behaviors to global DOM objects.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/collection-core-dom-shim
```

## Usage

The global shim adds a default implementation the collection interfaces to the following global DOM objects:

- `AudioParamMap` implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `AudioTrackList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `CSSRuleList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `CSSStyleDeclaration` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `ClientRectList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `DOMRectList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `DOMStringList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `DOMTokenList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `DataTransferItemList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `FileList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `FormData` implements:
    - @"@esfx/collection-core!KeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `HTMLAllCollection` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `HTMLCollectionBase` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `HTMLCollectionOf` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `HTMLFormElement` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `HTMLSelectElement` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `Headers` implements:
    - @"@esfx/collection-core!KeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `MediaKeyStatusMap` implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `MediaList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `MimeTypeArray` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `NamedNodeMap` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `NodeList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `Plugin` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `PluginArray` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `RTCStatsReport` implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `SVGLengthList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SVGNumberList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SVGStringList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SourceBufferList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SpeechGrammarList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SpeechRecognitionResult` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `SpeechRecognitionResultList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `StyleSheetList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `TextTrackCueList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `TextTrackList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `TouchList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- `URLSearchParams` implements:
    - @"@esfx/collection-core!KeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- `VideoTrackList` implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"

To install the global shim, import @"@esfx/collection-core-dom-shim!":

### [TypeScript](#tab/ts)
```ts
import "@esfx/collection-core-dom-shim"; // triggers global-scope side effects
import { ReadonlyIndexedCollection } from "@esfx/collection-core";

document.anchors[ReadonlyIndexedCollection.size]; // gets the number of anchors in the document
```

### [JavaScript (CommonJS)](#tab/js)
```js
require("@esfx/collection-core-dom-shim"); // triggers global-scope side effects
const { ReadonlyIndexedCollection } = require("@esfx/collection-core");

document.anchors[ReadonlyIndexedCollection.size]; // gets the number of anchors in the document
```

***
