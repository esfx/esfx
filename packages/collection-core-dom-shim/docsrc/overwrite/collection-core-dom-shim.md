---
uid: '@esfx/collection-core-dom-shim!'
---

Provides a global shim to add default @"@esfx/collection-core!" behaviors to global DOM objects.

### Installation

```sh
npm i @esfx/collection-core-dom-shim
```

### Usage

#### [TypeScript](#tab/ts)
[!code-typescript[](../examples/usage.ts)]
#### [JavaScript (CommonJS)](#tab/js)
[!code-javascript[](../examples/usage.js)]
***

### Remarks

This shim adds a default implementation of the collection interfaces to the following global DOM objects:

- @"!AudioParamMap:interface" implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- @"!AudioTrackList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!CSSRuleList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!CSSStyleDeclaration:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!DOMRectList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!DOMStringList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!DOMTokenList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!DataTransferItemList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!FileList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!FormData:interface" implements:
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
- @"!HTMLFormElement:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!HTMLSelectElement:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!Headers:interface" implements:
    - @"@esfx/collection-core!KeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- @"!MediaKeyStatusMap:interface" implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- @"!MediaList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!MimeTypeArray:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!NamedNodeMap:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!NodeList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!Plugin:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!PluginArray:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!RTCStatsReport:interface" implements:
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- @"!SVGLengthList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SVGNumberList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SVGStringList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SourceBufferList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SpeechGrammarList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SpeechRecognitionResult:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!SpeechRecognitionResultList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!StyleSheetList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!TextTrackCueList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!TextTrackList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!TouchList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
- @"!URLSearchParams:interface" implements:
    - @"@esfx/collection-core!KeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
    - @"@esfx/collection-core!ReadonlyKeyedCollection:interface"
- @"!VideoTrackList:interface" implements:
    - @"@esfx/collection-core!ReadonlyIndexedCollection:interface"
    - @"@esfx/collection-core!ReadonlyCollection:interface"
