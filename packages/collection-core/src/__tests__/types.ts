import { KeyedCollection, ReadonlyCollection, Collection, ReadonlyIndexedCollection, FixedSizeIndexedCollection, IndexedCollection, ReadonlyKeyedCollection } from "..";

declare let unknown: unknown;
declare let iterableOfNumber: Iterable<number>;
declare let iterableOfNumberString: Iterable<[number, string]>;
declare let readonlyCollectionOfNumber: ReadonlyCollection<number>;
declare let collectionOfNumber: Collection<number>;
declare let readonlyIndexedCollectionOfNumber: ReadonlyIndexedCollection<number>;
declare let fixedSizeIndexedCollectionOfNumber: FixedSizeIndexedCollection<number>;
declare let indexedCollectionOfNumber: IndexedCollection<number>;
declare let readonlyKeyedCollectionOfNumberString: ReadonlyKeyedCollection<number, string>;
declare let keyedCollectionNumberString: KeyedCollection<number, string>;

// NOTE: this test isn't actually run and is only used to verify type guards
it("type tests", () => {
    if (!0) return;
    if (ReadonlyCollection.hasInstance(unknown)) unknown; // $ExpectType ReadonlyCollection<unknown>
    if (ReadonlyCollection.hasInstance(iterableOfNumber)) iterableOfNumber; // $ExpectType ReadonlyCollection<number>
    if (ReadonlyCollection.hasInstance(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType ReadonlyCollection<number>
    if (ReadonlyCollection.hasInstance(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number>
    if (ReadonlyCollection.hasInstance(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyCollection.hasInstance(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (ReadonlyCollection.hasInstance(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (Collection.hasInstance(unknown)) unknown; // $ExpectType Collection<unknown>
    if (Collection.hasInstance(iterableOfNumber)) iterableOfNumber; // $ExpectType Collection<number>
    if (Collection.hasInstance(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType Collection<number>
    if (Collection.hasInstance(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number>
    if (Collection.hasInstance(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number> & Collection<number>
    if (Collection.hasInstance(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number> & Collection<number>
    if (Collection.hasInstance(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(unknown)) unknown; // $ExpectType ReadonlyIndexedCollection<unknown>
    if (ReadonlyIndexedCollection.hasInstance(iterableOfNumber)) iterableOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (ReadonlyIndexedCollection.hasInstance(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(unknown)) unknown; // $ExpectType FixedSizeIndexedCollection<unknown>
    if (FixedSizeIndexedCollection.hasInstance(iterableOfNumber)) iterableOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.hasInstance(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.hasInstance(unknown)) unknown; // $ExpectType IndexedCollection<unknown>
    if (IndexedCollection.hasInstance(iterableOfNumber)) iterableOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.hasInstance(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.hasInstance(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & IndexedCollection<number>
    if (IndexedCollection.hasInstance(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.hasInstance(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.hasInstance(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (ReadonlyKeyedCollection.hasInstance(unknown)) unknown; // $ExpectType ReadonlyKeyedCollection<unknown, unknown>
    if (ReadonlyKeyedCollection.hasInstance(iterableOfNumberString)) iterableOfNumberString; // $ExpectType ReadonlyKeyedCollection<number, string>
    if (ReadonlyKeyedCollection.hasInstance(readonlyKeyedCollectionOfNumberString)) readonlyKeyedCollectionOfNumberString; // $ExpectType ReadonlyKeyedCollection<number, string>
    if (ReadonlyKeyedCollection.hasInstance(keyedCollectionNumberString)) keyedCollectionNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.hasInstance(unknown)) unknown; // $ExpectType KeyedCollection<unknown, unknown>
    if (KeyedCollection.hasInstance(iterableOfNumberString)) iterableOfNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.hasInstance(readonlyKeyedCollectionOfNumberString)) readonlyKeyedCollectionOfNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.hasInstance(keyedCollectionNumberString)) keyedCollectionNumberString; // $ExpectType KeyedCollection<number, string>
});