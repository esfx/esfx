/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { ReadonlyCollection, ReadonlyKeyedCollection, KeyedCollection, ReadonlyIndexedCollection } from "@esfx/collection-core";

//
// Global augmentations
//

// Collections

declare global { interface CSSRuleList extends ReadonlyIndexedCollection<CSSRule> {} }
if (typeof CSSRuleList === "function") makeReadonlyIndexedCollection(CSSRuleList.prototype);

declare global { interface CSSStyleDeclaration extends ReadonlyIndexedCollection<string> {} }
if (typeof CSSStyleDeclaration === "function") makeReadonlyIndexedCollection(CSSStyleDeclaration.prototype);

declare global { interface DOMRectList extends ReadonlyIndexedCollection<DOMRect> {} }
if (typeof DOMRectList === "function") makeReadonlyIndexedCollection(DOMRectList.prototype);

declare global { interface DOMStringList extends ReadonlyIndexedCollection<DOMStringList> {} }
if (typeof DOMStringList === "function") makeReadonlyIndexedCollection(DOMStringList.prototype);

declare global { interface DOMTokenList extends ReadonlyIndexedCollection<string> {} }
if (typeof DOMTokenList === "function") makeReadonlyIndexedCollection(DOMTokenList.prototype);

declare global { interface DataTransferItemList extends ReadonlyIndexedCollection<DataTransferItem> {} }
if (typeof DataTransferItemList === "function") makeReadonlyIndexedCollection(DataTransferItemList.prototype);

declare global { interface FileList extends ReadonlyIndexedCollection<File> {} }
if (typeof FileList === "function") makeReadonlyIndexedCollection(FileList.prototype);

declare global {
    interface HTMLAllCollection extends ReadonlyIndexedCollection<Element> {} 
    interface HTMLCollectionBase extends ReadonlyIndexedCollection<Element> {}
    interface HTMLCollectionOf<T extends Element> extends ReadonlyIndexedCollection<T> {}
}
if (typeof HTMLCollection === "function") makeReadonlyIndexedCollection(HTMLCollection.prototype);
if (typeof HTMLAllCollection === "function") makeReadonlyIndexedCollection(HTMLAllCollection.prototype);
if (typeof HTMLFormControlsCollection === "function" && !(HTMLFormControlsCollection.prototype instanceof HTMLCollection)) {
    makeReadonlyIndexedCollection(HTMLFormControlsCollection.prototype);
}

declare global { interface HTMLFormElement extends ReadonlyIndexedCollection<Element> {} }
if (typeof HTMLFormElement === "function") makeReadonlyIndexedCollection(HTMLFormElement.prototype);

declare global { interface HTMLSelectElement extends ReadonlyIndexedCollection<Element> {} }
if (typeof HTMLSelectElement === "function") makeReadonlyIndexedCollection(HTMLSelectElement.prototype);

declare global { interface MediaList extends ReadonlyIndexedCollection<string> {} }
if (typeof MediaList === "function") makeReadonlyIndexedCollection(MediaList.prototype);

declare global { interface MimeTypeArray extends ReadonlyIndexedCollection<Plugin> {} }
if (typeof MimeTypeArray === "function") makeReadonlyIndexedCollection(MimeTypeArray.prototype);

declare global { interface NamedNodeMap extends ReadonlyIndexedCollection<Attr> {} }
if (typeof NamedNodeMap === "function") makeReadonlyIndexedCollection(NamedNodeMap.prototype);

declare global {
    interface NodeList extends ReadonlyIndexedCollection<Node> {}
    interface NodeListOf<TNode extends Node> extends ReadonlyIndexedCollection<TNode> {}
}
if (typeof NodeList === "function") makeReadonlyIndexedCollection(NodeList.prototype);

declare global { interface Plugin extends ReadonlyIndexedCollection<MimeType> {} }
if (typeof Plugin === "function") makeReadonlyIndexedCollection(Plugin.prototype);

declare global { interface PluginArray extends ReadonlyIndexedCollection<Plugin> {} }
if (typeof PluginArray === "function") makeReadonlyIndexedCollection(PluginArray.prototype);

declare global { interface SVGLengthList extends ReadonlyIndexedCollection<SVGLength> {} }
if (typeof SVGLengthList === "function") makeReadonlyIndexedCollection(SVGLengthList.prototype);

declare global { interface SVGNumberList extends ReadonlyIndexedCollection<SVGNumber> {} }
if (typeof SVGNumberList === "function") makeReadonlyIndexedCollection(SVGNumberList.prototype);

declare global { interface SVGPointList extends ReadonlyIndexedCollection<DOMPoint> {} }
if (typeof SVGPointList === "function") makeReadonlyIndexedCollection(SVGPointList.prototype);

declare global { interface SVGStringList extends ReadonlyIndexedCollection<string> {} }
if (typeof SVGStringList === "function") makeReadonlyIndexedCollection(SVGStringList.prototype);

declare global { interface SVGTransformList extends ReadonlyIndexedCollection<SVGTransform> {} }
if (typeof SVGTransformList === "function") makeReadonlyIndexedCollection(SVGTransformList.prototype);

declare global { interface SourceBufferList extends ReadonlyIndexedCollection<SourceBuffer> {} }
if (typeof SourceBufferList === "function") makeReadonlyIndexedCollection(SourceBufferList.prototype);

declare global { interface SpeechRecognitionResult extends ReadonlyIndexedCollection<SpeechRecognitionAlternative> {} }
if (typeof SpeechRecognitionResult === "function") makeReadonlyIndexedCollection(SpeechRecognitionResult.prototype);

declare global { interface SpeechRecognitionResultList extends ReadonlyIndexedCollection<SpeechRecognitionResult> {} }
if (typeof SpeechRecognitionResultList === "function") makeReadonlyIndexedCollection(SpeechRecognitionResultList.prototype);

declare global { interface StyleSheetList extends ReadonlyIndexedCollection<StyleSheet> {} }
if (typeof StyleSheetList === "function") makeReadonlyIndexedCollection(StyleSheetList.prototype);

declare global { interface TextTrackCueList extends ReadonlyIndexedCollection<TextTrackCue> {} }
if (typeof TextTrackCueList === "function") makeReadonlyIndexedCollection(TextTrackCueList.prototype);

declare global { interface TextTrackList extends ReadonlyIndexedCollection<TextTrack> {} }
if (typeof TextTrackList === "function") makeReadonlyIndexedCollection(TextTrackList.prototype);

declare global { interface TouchList extends ReadonlyIndexedCollection<Touch> {} }
if (typeof TouchList === "function") makeReadonlyIndexedCollection(TouchList.prototype);

// Maps

declare global { interface AudioParamMap extends ReadonlyKeyedCollection<string, AudioParam> {} }
if (typeof AudioParamMap === "function") makeReadonlyKeyedCollection(AudioParamMap.prototype);

declare global { interface MediaKeyStatusMap extends ReadonlyKeyedCollection<BufferSource, any> {} }
if (typeof MediaKeyStatusMap === "function") makeReadonlyKeyedCollection(MediaKeyStatusMap.prototype);

declare global { interface RTCStatsReport extends ReadonlyKeyedCollection<string, any> {} }
if (typeof RTCStatsReport === "function") makeReadonlyKeyedCollection(RTCStatsReport.prototype);

declare global { interface FormData extends KeyedCollection<string, string | Blob> {} }
if (typeof FormData === "function") makeKeyedCollection(FormData.prototype);

declare global { interface Headers extends KeyedCollection<string, string> {} }
if (typeof Headers === "function") makeKeyedCollection(Headers.prototype);

declare global { interface URLSearchParams extends KeyedCollection<string, string> {} }
if (typeof URLSearchParams === "function") makeKeyedCollection(URLSearchParams.prototype);

interface MapLike<K, V> {
    readonly size?: number;
    has(key: K): boolean;
    get(key: K): V | null | undefined;
    set(key: K, value: V): void;
    delete(key: K): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
}

function makeKeyedCollection<K, V>(prototype: MapLike<K, V>, overrides?: PropertyDescriptorMap) {
    Object.defineProperties(prototype, {
        // ReadonlyKeyedCollection<K, V>
        [KeyedCollection.size]: {
            configurable: true,
            get: "size" in prototype 
                ? function (this: MapLike<K, V>) {
                    return this.size!;
                }
                : function (this: MapLike<K, V>) {
                    let size = 0;
                    for (const _ of this.keys()) size++;
                    return size;
                }
        },
        [KeyedCollection.has]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>, key: K) {
                return this.has(key);
            }
        },
        [KeyedCollection.get]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>, key: K): V | undefined {
                const result = this.get(key);
                return result === null ? undefined : result;
            }
        },
        [KeyedCollection.keys]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>) {
                return this.keys();
            }
        },
        [KeyedCollection.values]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>) {
                return this.values();
            }
        },
    
        // KeyedCollection<K, V>
        [KeyedCollection.set]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>, key: K, value: V) {
                this.set(key, value);
            }
        },
        [KeyedCollection.delete]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>, key: K) {
                if (this.has(key)) {
                    this.delete(key);
                    return true;
                }
                return false;
            }
        },
        [KeyedCollection.clear]: {
            configurable: true, writable: true,
            value(this: MapLike<K, V>) {
                const keys = new Set(this.keys());
                for (const key of keys) {
                    this.delete(key);
                }
            }
        },
        ...overrides,
    });
}

function makeReadonlyKeyedCollection<K, V>(prototype: ReadonlyMap<K, V>, overrides?: PropertyDescriptorMap) {
    Object.defineProperties(prototype, {
        // ReadonlyKeyedCollection<K, V>
        [ReadonlyKeyedCollection.size]: {
            configurable: true,
            get(this: ReadonlyMap<K, V>) { return this.size; }
        },
        [ReadonlyKeyedCollection.has]: {
            configurable: true, writable: true,
            value(this: ReadonlyMap<K, V>, key: K) {
                return this.has(key);
            }
        },
        [ReadonlyKeyedCollection.get]: {
            configurable: true, writable: true,
            value(this: ReadonlyMap<K, V>, key: K) {
                return asUndefinedIfNull(this.get(key));
            }
        },
        [ReadonlyKeyedCollection.keys]: {
            configurable: true, writable: true,
            value(this: ReadonlyMap<K, V>) {
                return this.keys();
            }
        },
        [ReadonlyKeyedCollection.values]: {
            configurable: true, writable: true,
            value(this: ReadonlyMap<K, V>) {
                return this.values();
            }
        },
        ...overrides,
    });
}

function makeReadonlyCollection<T>(prototype: ArrayLike<T>, overrides?: PropertyDescriptorMap) {
    Object.defineProperties(prototype, {
        // ReadonlyCollection<T>
        [ReadonlyCollection.size]: {
            configurable: true,
            get(this: ArrayLike<T>) { return this.length; }
        },
        [ReadonlyCollection.has]: {
            configurable: true, writable: true,
            value(this: ArrayLike<T>, value: T) {
                return Array.prototype.indexOf.call(this, value) !== -1;
            }
        },
        ...overrides,
    });
}

function makeReadonlyIndexedCollection<T>(prototype: ArrayLike<T>, overrides?: PropertyDescriptorMap) {
    makeReadonlyCollection(prototype, {
        // ReadonlyIndexedCollection<T>
        [ReadonlyIndexedCollection.indexOf]: {
            configurable: true, writable: true,
            value(this: ArrayLike<T>, value: T, fromIndex?: number) {
                return Array.prototype.indexOf.call(this, value, fromIndex);
            }
        },
        [ReadonlyIndexedCollection.getAt]: {
            configurable: true, writable: true,
            value(this: ArrayLike<T>, index: number) {
                return asUndefinedIfNull(this[index]);
            }
        },
        ...overrides,
    });
}

function asUndefinedIfNull<T>(value: T): T;
function asUndefinedIfNull<T>(value: T | null | undefined): T | undefined;
function asUndefinedIfNull<T>(value: T | null | undefined): T | undefined {
    return value === null ? undefined : value;
}