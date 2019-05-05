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
    if (ReadonlyCollection.isReadonlyCollection(unknown)) unknown; // $ExpectType ReadonlyCollection<unknown>
    if (ReadonlyCollection.isReadonlyCollection(iterableOfNumber)) iterableOfNumber; // $ExpectType ReadonlyCollection<number>
    if (ReadonlyCollection.isReadonlyCollection(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType ReadonlyCollection<number>
    if (ReadonlyCollection.isReadonlyCollection(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number>
    if (ReadonlyCollection.isReadonlyCollection(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyCollection.isReadonlyCollection(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (ReadonlyCollection.isReadonlyCollection(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (Collection.isCollection(unknown)) unknown; // $ExpectType Collection<unknown>
    if (Collection.isCollection(iterableOfNumber)) iterableOfNumber; // $ExpectType Collection<number>
    if (Collection.isCollection(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType Collection<number>
    if (Collection.isCollection(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number>
    if (Collection.isCollection(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number> & Collection<number>
    if (Collection.isCollection(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number> & Collection<number>
    if (Collection.isCollection(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(unknown)) unknown; // $ExpectType ReadonlyIndexedCollection<unknown>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(iterableOfNumber)) iterableOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType ReadonlyIndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (ReadonlyIndexedCollection.isReadonlyIndexedCollection(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(unknown)) unknown; // $ExpectType FixedSizeIndexedCollection<unknown>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(iterableOfNumber)) iterableOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType FixedSizeIndexedCollection<number>
    if (FixedSizeIndexedCollection.isFixedSizeIndexedCollection(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(unknown)) unknown; // $ExpectType IndexedCollection<unknown>
    if (IndexedCollection.isIndexedCollection(iterableOfNumber)) iterableOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(readonlyCollectionOfNumber)) readonlyCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(collectionOfNumber)) collectionOfNumber; // $ExpectType Collection<number> & IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(readonlyIndexedCollectionOfNumber)) readonlyIndexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(fixedSizeIndexedCollectionOfNumber)) fixedSizeIndexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (IndexedCollection.isIndexedCollection(indexedCollectionOfNumber)) indexedCollectionOfNumber; // $ExpectType IndexedCollection<number>
    if (ReadonlyKeyedCollection.isReadonlyKeyedCollection(unknown)) unknown; // $ExpectType ReadonlyKeyedCollection<unknown, unknown>
    if (ReadonlyKeyedCollection.isReadonlyKeyedCollection(iterableOfNumberString)) iterableOfNumberString; // $ExpectType ReadonlyKeyedCollection<number, string>
    if (ReadonlyKeyedCollection.isReadonlyKeyedCollection(readonlyKeyedCollectionOfNumberString)) readonlyKeyedCollectionOfNumberString; // $ExpectType ReadonlyKeyedCollection<number, string>
    if (ReadonlyKeyedCollection.isReadonlyKeyedCollection(keyedCollectionNumberString)) keyedCollectionNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.isKeyedCollection(unknown)) unknown; // $ExpectType KeyedCollection<unknown, unknown>
    if (KeyedCollection.isKeyedCollection(iterableOfNumberString)) iterableOfNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.isKeyedCollection(readonlyKeyedCollectionOfNumberString)) readonlyKeyedCollectionOfNumberString; // $ExpectType KeyedCollection<number, string>
    if (KeyedCollection.isKeyedCollection(keyedCollectionNumberString)) keyedCollectionNumberString; // $ExpectType KeyedCollection<number, string>
});