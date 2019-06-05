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

/// <reference lib="es2018.asynciterable" />

/**
 * A union of all of the primitive types in TypeScript.
 */
export type Primitive = string | symbol | boolean | number | bigint;

/**
 * A union of all of the falsey types in TypeScript.
 */
export type Falsey = null | undefined | false | 0 | 0n | '';

/**
 * A PropertyDescriptor constrained to the valid attributes for an accessor.
 */
export interface AccessorPropertyDescriptor<T = any> {
    enumerable?: boolean;
    configurable?: boolean;
    get?(): T;
    set?(v: T): void;
}

/**
 * A PropertyDescriptor constrained to the valid attributes for a method.
 */
export interface MethodPropertyDescriptor<T extends (...args: any[]) => any = (...args: any[]) => any> {
    enumerable?: boolean;
    configurable?: boolean;
    writable?: boolean;
    value: T;
}

/**
 * Indicates a type that may be `undefined`.
 */
export type Optional<T> = T | undefined;

/**
 * Strips `undefined` from a type.
 */
export type NonOptional<T> = T extends undefined ? never : T;

/**
 * Indicates a type that may be `null` or `undefined`.
 */
export type Nullable<T> = T | undefined | null;

/**
 * Strips `null` or `undefined` from a type.
 */
export import NonNullable = globalThis.NonNullable;

/**
 * Gets a union of `keyof T'` of each constituent `T'` of `T`.
 */
export type AnyKeyof<T> = T extends unknown ? keyof T : never;

/**
 * Gets a union of `Extract<T', U>` for each constituent `T'` of `T`.
 */
export type AnyExtract<T, U> = T extends unknown ? Extract<T, U> : never;

/**
 * Gets a union of `Exclude<T', U>` for each constituent `T'` of `T`.
 */
export type AnyExclude<T, U> = T extends unknown ? Exclude<T, U> : never;

/**
 * Represents a concrete ECMAScript constructor object.
 */
export type Constructor<T = {}, A extends any[] = any[]> = new (...args: A) => T;

/**
 * Represents an abstract class constructor.
 */
export type AbstractConstructor<T = {}> = Function & { prototype: T };

/**
 * Gets the type yielded by an Iterable.
 */
export type IteratedType<T> =
    T extends { [Symbol.iterator](): { next(): { done: false, value: infer U } } } ? U :
    T extends { [Symbol.iterator](): { next(): { done: true } } } ? never :
    T extends { [Symbol.iterator](): { next(): { done: boolean, value: infer U } } } ? U :
    T extends { [Symbol.iterator](): any } ? unknown :
    never;

/**
 * Gets the type that can be sent to a generator via its `next` method.
 */
export type GeneratorNextType<T> =
    T extends { [Symbol.iterator](): { next(value?: infer U): any } } ? U :
    never;

/**
 * Gets the type that can be returned from a generator when it has finished executing.
 */
export type GeneratorReturnType<T> =
    T extends { [Symbol.iterator](): { next(): { done: true, value?: infer U } } } ? U :
    T extends { [Symbol.iterator](): { next(): { done: false } } } ? never :
    T extends { [Symbol.iterator](): { next(): { done: boolean, value?: infer U } } } ? U :
    T extends { [Symbol.iterator](): any } ? void :
    never;

// TODO(rbuckton): Depends on `Await<T>`, which is currently unsafe.
// /**
//  * Gets the type yielded by an AsyncIterable.
//  */
// export type AsyncIteratedType<T> =
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: false, value: infer U }) => any): any; } } } ? Await<U> :
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: true }) => any): any; } } } ? never :
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: boolean, value: infer U }) => any): any; } } } ? Await<U> :
//     T extends { [Symbol.asyncIterator](): any } ? void :
//     never;

// TODO(rbuckton): Depends on `Await<T>`, which is currently unsafe.
// /**
//  * Gets the type that can be sent to a generator via its `next` method.
//  */
// export type AsyncGeneratorNextType<T> =
//     T extends { [Symbol.asyncIterator](): { next(value?: infer U): any } } ? U :
//     never;

// TODO(rbuckton): Depends on `Await<T>`, which is currently unsafe.
// /**
//  * Gets the type that can be returned from a generator when it has finished executing.
//  */
// export type AsyncGeneratorReturnType<T> =
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: true, value?: infer U }) => any): any; } } } ? Await<U> :
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: false }) => any): any; } } } ? never :
//     T extends { [Symbol.asyncIterator](): { next(): { then(onfulfilled: (value: { done: boolean, value?: infer U }) => any): any; } } } ? Await<U> :
//     T extends { [Symbol.asyncIterator](): any } ? void :
//     never;

/**
 * Gets the promised type of a Promise.
 */
export type PromisedType<T> =
    T extends { then(onfulfilled: infer U): any } ? U extends ((value: infer V) => any) ? V : never :
    never;

// TODO(rbuckton): Investigate whether UnionToIntersection should be kept. Intersections are ordered
//                  while unions are unordered.

// /**
//  * Maps a union of types into an intersection of types.
//  */
// export type UnionToIntersection<U> = ((U extends unknown ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never) | never;

/**
 * Maps to `true` if `A` is precisely the `any` type; otherwise, `false`.
 */
export type IsAny<A> = (1 | 2) extends (A extends never ? 1 : 2) ? true : false;

/**
 * Maps to `true` if `A` is precisely the `never` type; otherwise, `false`.
 */
export type IsNever<A> = (A extends never ? true : false) extends true ? true : false;

/**
 * Maps to `true` if `A` is precisely the `unknown` type; otherwise, `false`.
 */
export type IsUnknown<A> =
    IsAny<A> extends true ? false :
    unknown extends A ? true :
    false;

/**
 * Maps to `true` if `T` is a union of multiple types; otherwise, `false`.
 */
export type IsUnion<T> =
    IsNever<T> extends true ? false :
    __IsUnionRest<T, [T]>;

type __IsUnionRest<T, Q> = T extends unknown ? Not<SameType<[T], Q>> : never;

/**
 * Maps to `true` if `Sub` is a subtype of `Super`; otherwise, `false`.
 */
export type IsSubtypeOf<Sub, Super> =
    IsNever<Super> extends true ? IsNever<Sub> :
    IsNever<Sub> extends true ? true :
    IsAny<Super> extends true ? true :
    IsAny<Sub> extends true ? true :
    Sub extends Super ? true :
    false;

/**
 * Maps to `true` if `Super` is a supertype of `Sub`; otherwise, `false`.
 */
export type IsSupertypeOf<Super, Sub> = IsSubtypeOf<Sub, Super>;

/**
 * Maps to `true` if the type has a call signature; otherwise, `false`.
 */
export type IsCallable<T> =
    IsAny<T> extends true ? boolean :
    IsNever<T> extends true ? never :
    SameType<T, Function> extends true ? true :
    [T] extends [(...args: any) => any] ? true :
    false;

/**
 * Maps to `true` if the type has a construct signature; otherwise, `false`.
 */
export type IsConstructable<T> =
    IsAny<T> extends true ? boolean :
    IsNever<T> extends true ? never :
    SameType<T, Function> extends true ? true :
    [T] extends [new (...args: any) => any] ? true :
    false;

/**
 * Maps to `true` if `A` is `false`, otherwise `true`.
 */
export type Not<A extends boolean> =
    IsNever<A> extends true ? never :
    A extends false ? true :
    false;

/**
 * Maps to `true` if both `A` and `B` are `true`; otherwise, `false`.
 */
export type And<A extends boolean, B extends boolean> =
    IsNever<A> extends true ? never :
    IsNever<B> extends true ? never :
    A extends false ? false :
    B extends false ? false :
    true;

/**
 * Maps to `true` if either `A` or `B` are `true`; otherwise, `false`.
 */
export type Or<A extends boolean, B extends boolean> =
    IsNever<A> extends true ? never :
    IsNever<B> extends true ? never :
    A extends true ? true :
    B extends true ? true :
    false;

/**
 * Maps to `true` if only one of either `A` or `B` are `true`; otherwise, `false`.
 */
export type XOr<A extends boolean, B extends boolean> =
    IsNever<A> extends true ? never :
    IsNever<B> extends true ? never :
    A extends true ? Not<B> :
    B extends true ? Not<A> :
    false;

/**
 * Maps to `true` if every element of the tuple `L` is `true`; otherwise, `false`.
 */
export type Every<L extends boolean[]> =
    L extends [] ? never :
    __EveryRest<{
        [P in keyof L]:
            IsNever<L[P]> extends true ? "never" :
            IsAny<L[P]> extends true ? "boolean" :
            boolean extends L[P] ? "boolean" :
            L[P] extends false ? "false" :
            never;
    }[number]>;

type __EveryRest<R> =
    "never" extends R ? never : // an element was `never`
    "false" extends R ? false : // at least one element was `false`
    "boolean" extends R ? boolean : // an element was `any` or `boolean`
    true; // no elements were false

/**
 * Maps to `true` if any element of the tuple `L` is `true`; otherwise, `false`.
 */
export type Some<L extends boolean[]> = L extends [] ? never : __SomeRest<{
    [P in keyof L]:
        IsNever<L[P]> extends true ? "never" :
        IsAny<L[P]> extends true ? "boolean" :
        boolean extends L[P] ? "boolean" :
        L[P] extends true ? "true" :
        never;
}[number]>;

type __SomeRest<R> =
    "never" extends R ? never : // an element was `never`
    "true" extends R ? true : // at least one element was `true`
    "boolean" extends R ? boolean : // an element was `any` or `boolean`
    false; // no elements were true

/**
 * Maps to `true` if exactly one element of the tuple `L` is `true`; otherwise, `false`.
 */
export type One<L extends boolean[]> = L extends [] ? never : __OneRest<{
    [P in keyof L]:
        IsNever<L[P]> extends true ? "never" :
        IsAny<L[P]> extends true ? "boolean" :
        boolean extends L[P] ? "boolean" :
        L[P] extends true ? [P] :
        never;
}[number]>;

type __OneRest<R> =
    "never" extends R ? never : // an element was `never`
    "boolean" extends R ? boolean : // an element was `any` or `boolean`
    IsNever<R> extends true ? false : // no elements were `true`
    IsUnion<R> extends true ? false : // multiple elements were `true`
    true; // only one element was `true`

/**
 * Maps to `true` if both `A` and `B` are assignable to each other; otherwise, `false`.
 */
export type SameType<A, B> =
    IsNever<A> extends true ? IsNever<B> :
    IsNever<B> extends true ? false :
    [A, B] extends [B, A] ? true :
    false;

/**
 * Maps to `true` if all elements of the tuple `L` are assignable to each other; otherwise, `false`.
 */
export type SameTypes<L extends any[]> =
    L extends [] ? never :
    SameType<{ [P in keyof L]: SameType<L[P], L[number]> }[number], true>;

/**
 * Maps to `true` if either `A` or `B` are relatable to each other.
 */
export type Relatable<A, B> =
    IsNever<A> extends true ? false :
    IsNever<B> extends true ? false :
    IsAny<A> extends true ? true :
    IsAny<B> extends true ? true :
    [A] extends [B] ? true :
    [B] extends [A] ? true :
    false;

/**
 * Maps to `true` if any type in `A` is assignable to any type in `B`; otherwise, `false`.
 */
export type Overlaps<A, B> =
    IsNever<A> extends true ? false :
    IsNever<B> extends true ? false :
    IsAny<A> extends true ? true :
    IsAny<B> extends true ? true :
    1 extends (A extends unknown ? A extends B ? 1 : 2 : 3) ? true :
    1 extends (B extends unknown ? B extends A ? 1 : 2 : 3) ? true :
    false;

/**
 * Maps to `true` if `Sub` is a subset of `Super`; otherwise, `false`.
 */
export type IsSubsetOf<Sub, Super> =
    IsAny<Sub> extends true ? boolean :         // Nothing can be determined about a subset of `any`
    IsAny<Super> extends true ? boolean :       // Nothing can be determined about a superset of `any`
    __IsSubsetOf<Sub, Super>;

type __IsSubsetOf<Sub, Super> =
    IsNever<Sub> extends true ? true :          // The empty set is a subset of all sets
    IsNever<Super> extends true ? false :       // No other set is a subset of the empty set
    IsUnknown<Sub> extends true ? false :       // The set of all types cannot be a proper subset of itself
    IsUnknown<Super> extends true ? true :      // All other sets are the subset of the set of all types
    [Sub] extends [Super] ? true :
    false;

/**
 * Maps to `true` if `Super` is a superset of `Sub`; otherwise, `false`.
 */
export type IsSupersetOf<Super, Sub> = IsSubsetOf<Sub, Super>;

/**
 * Maps to `true` if `Sub` is a proper subset of `Super`; otherwise, `false`.
 */
export type IsProperSubsetOf<Sub, Super> =
    IsAny<Sub> extends true ? boolean :         // Nothing can be determined about a subset of `any`
    IsAny<Super> extends true ? boolean :       // Nothing can be determined about a superset of `any`
    SameType<Sub, Super> extends true ? false : // A set cannot be a proper subset of itself
    __IsSubsetOf<Sub, Super>;

/**
 * Maps to `true` if `Super` is a proper superset of `Sub`; otherwise, `false`.
 */
export type IsProperSupersetOf<Super, Sub> = IsProperSubsetOf<Sub, Super>;

/**
 * Maps to the keys of `T` whose values match `TMatch`.
 */
export type MatchingKeys<T, TMatch> = __MatchingKeys<T, TMatch, keyof T>;

type __MatchingKeys<T, TSuper, K extends keyof T> = K extends (T[K] extends TSuper ? K : never) ? K : never;

/**
 * Maps to the keys of `T` whose values do not match `TMatch`.
 */
export type NonMatchingKeys<T, TMatch> = Exclude<keyof T, MatchingKeys<T, TMatch>>;

/**
 * Maps to the keys of `T` whose values are functions.
 */
export type FunctionKeys<T, F extends Function = Function> = MatchingKeys<T, F>;

/**
 * Maps to the keys of `T` whose values are not functions.
 */
export type NonFunctionKeys<T, F extends Function = Function> = NonMatchingKeys<T, F>;

// /**
//  * Maps `T` to its awaited type if `T` is a promise.
//  */
// export type Await<T> = {
//     0: T,
//     1: T extends { then(onfulfilled: infer U): any } ? U extends ((value: infer V) => any) ? Await<V> : never : never;
// }[T extends { then(): any } ? 1 : 0];

// /**
//  * Maps each element of `T` to its awaited type if the element is a promise.
//  */
// export type AwaitAll<T extends any[]> = { [P in keyof T]: Await<T[P]>; };

// /**
//  * Maps to a tuple where the first element is the first element of `L` and the second element are the remaining elements of `L`.
//  */
// export type Shift<L extends any[]> =
//     [] extends L ? [never, never] :
//     ((...a: L) => void) extends ((head: infer H, ...tail: infer T) => void) ? [H, T] :
//     never;

// /**
//  * Inserts an element at the start of a tuple.
//  */
// export type Unshift<T extends any[], H> = ((h: H, ...t: T) => void) extends ((...l: infer L) => void) ? L : never;

// type __Reverse<L extends any[], R extends any[] = []> = {
//     0: R,
//     1: ((...l: L) => void) extends ((h: infer H, ...t: infer T) => void) ? __Reverse<T, Unshift<R, H>> : never
// }[L extends [any, ...any[]] ? 1 : 0];

// /**
//  * Reverse the order of the elements of a tuple.
//  */
// export type Reverse<L extends any[]> = __Reverse<L>;

// type __PopRest<R extends [any, any[]]> = [R[0], Reverse<R[1]>];

// /**
//  * Maps to a tuple where the first element is the last element of `L` and the second element are the remaining elements of `L`.
//  */
// export type Pop<L extends any[]> = __PopRest<Shift<Reverse<L>>>;

// /**
//  * Push an element on to the end of a tuple.
//  */
// export type Push<H extends any[], T> = Reverse<Unshift<Reverse<H>, T>>;

/**
 * Split an object into a union of objects for each key/value pair.
 */
export type Disjoin<T extends object> =
    IsNever<T> extends true ? never :
    IsAny<T> extends true ? any :
    __DisjoinRest<{ [K in keyof T]: { [P in K]: T[P] }; }[keyof T]>;

type __DisjoinRest<T> = IsNever<T> extends true ? {} : T;

/**
 * Map an intersection of object types into a single object type.
 */
export type Reshape<T extends object> = Pick<T, keyof T>;

/**
 * Joins a union of disjoint object types into a single object type.
 */
export type Conjoin<T extends object> = {
    [P in AnyKeyof<T>]: AnyExtract<T, { readonly [U in P]: unknown }>[P];
};

/**
 * Maps to `true` if any type in `A` is assignable to or shares a property with any type in `B`; otherwise, `false`.
 * This is similar to `Overlaps`, except object types in `A` and `B` are mapped through `Disjoin`.
 */
export type DisjoinOverlaps<A, B> = Overlaps<
    A extends object ? Disjoin<A> : A,
    B extends object ? Disjoin<B> : B>;

/**
 * Maps to `true` if `T` is an empty object (`{}`).
 */
export type IsEmpty<T extends object> = IsNever<keyof T>;

/**
 * Remove from `T` all keys in `K`.
 */
export type Omit<T, K extends PropertyKey> = Pick<T, Exclude<keyof T, K>>;

/**
 * Remove from `A` all properties with the same types that exist in `B`.
 */
export type Diff<A extends object, B extends object> = Omit<A, keyof B>;

/**
 * Pick from `A` all properties with the same types that exist in `B`.
 */
export type Intersect<A extends object, B extends object> = Pick<A & B, Extract<keyof A, keyof B> & Extract<keyof B, keyof A>>;

/**
 * Combine the properties of `A` and `B`, chosing the properties in `B` if the types differ.
 */
export type Assign<A extends object, B extends object> = Reshape<Diff<A, B> & B>;
