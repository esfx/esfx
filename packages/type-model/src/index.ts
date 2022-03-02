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

/** A type useful as a base constraint for a string that should be inferred as a string literal type. */
export type conststring = string & {} | "";

/** A type useful as a base constraint for a number that should be inferred as a number literal type. */
export type constnumber = number & {} | 0;

/** A type useful as a base constraint for a symbol that should be inferred as a unique symbol type. */
export type constsymbol = symbol & {} | typeof kIgnore;
declare const kIgnore: unique symbol;

/** A type useful as a base constraint for an array that should be inferred as a tuple. */
export type consttuple<T> = readonly T[] | readonly [];

type numbers255 = [
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
    0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f,
    0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f,
    0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f,
    0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f,
    0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f,
    0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,
    0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
    0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf,
    0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf,
    0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf,
    0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf,
    0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
    0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff,
];

type strings255 = numbers255 extends infer T ? { [P in keyof T]: P } : never;

/**
 * Gets a union of the number and numeric string value for a number or numeric string index between 0 and 255
 */
export type numstr<I extends keyof any> =
    I extends numbers255[number] ? I | strings255[I] :
    I extends strings255[number] ? I | numbers255[I] :
    never;

/**
 * A union of all of the primitive types in TypeScript.
 */
export type Primitive = string | symbol | boolean | number | bigint;

/**
 * A union of all of the falsy types in TypeScript.
 */
export type Falsy = null | undefined | false | 0 | 0n | '';

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

type _RequiredKeyof<T, K extends keyof T = keyof T> =
    K extends keyof T ?
        Pick<T, K> extends Required<Pick<T, K>> ? K : never :
        never;

/**
 * Gets a union of the keys of `T` that are non-optional.
 */
export type RequiredKeyof<T> = _RequiredKeyof<T, keyof T>;

/**
 * Gets a union of the keys of `T` that are optional.
 */
export type OptionalKeyof<T> = Exclude<keyof T, RequiredKeyof<T>>;

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
export type AbstractConstructor<T = {}, A extends any[] = any[]> = abstract new (...args: A) => T;

/**
 * Gets the type yielded by an Iterable.
 */
export type IteratedType<T> =
    T extends { [Symbol.iterator](): { next(...args: any): infer R } } ?
        R extends { done?: boolean, value: any } ?
            R["done"] extends true ? never : R["value"] :
            never :
        never;

/**
 * Gets the type that can be returned from a generator when it has finished executing.
 */
export type GeneratorReturnType<T> =
    T extends { [Symbol.iterator](): { next(...args: any): infer R } } ?
        R extends { done?: boolean, value: any } ?
            R["done"] extends false | undefined ? never : R["value"] :
            never :
        never;

/**
 * Gets the type that can be sent to a generator via its `next` method.
 */
export type GeneratorNextType<T> =
    T extends { [Symbol.iterator](): { next(value?: infer U): any } } ? U :
    never;

/**
 * Gets the type yielded by an AsyncIterable.
 */
export type AsyncIteratedType<T> =
    T extends { [Symbol.asyncIterator](): { next(...args: any): PromiseLike<infer R> } } ?
        R extends { done?: boolean, value?: any } ?
            R["done"] extends true ? never : Await<R["value"]> :
            never :
        never;

/**
 * Gets the type that can be sent to a generator via its `next` method.
 */
export type AsyncGeneratorNextType<T> =
    T extends { [Symbol.asyncIterator](): { next(value?: infer U): any } } ? U :
    never;

/**
 * Gets the type that can be returned from a generator when it has finished executing.
 */
export type AsyncGeneratorReturnType<T> =
    T extends { [Symbol.asyncIterator](): { next(...args: any): PromiseLike<infer R> } } ?
        R extends { done?: boolean, value?: any } ?
            R["done"] extends false | undefined ? never : Await<R["value"]> :
            never :
        never;

/**
 * Gets the promised type of a Promise.
 */
export type PromisedType<T> =
    T extends { then(onfulfilled: infer U): any } ? U extends ((value: infer V) => any) ? V : never :
    never;

/**
 * Maps an ordered tuple of types into an intersection of those types.
 */
export type Intersection<A extends any[]> =
    A extends [infer H, ...infer T] ? H & Intersection<T> :
    unknown;

/**
 * Maps an ordered tuple of types into a union of those types.
 */
export type Union<A extends any[]> = A[number];

// TODO(rbuckton): Investigate whether UnionToIntersection should be kept. Intersections are ordered
//                 while unions are unordered.
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
export type IsNever<A> = [A] extends [never] ? true : false;

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
export type MatchingKeys<T, TMatch> = { [P in keyof T]: T[P] extends TMatch ? P : never }[keyof T];

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

/**
 * Maps `T` to its awaited type if `T` is a promise.
 */
export type Await<T> =
    T extends { then(onfulfilled: infer U): any } ?
        U extends ((value: infer V) => any) ?
            Await<V> :
            never :
    T;

/**
 * Maps each element of `T` to its awaited type if the element is a promise.
 */
export type AwaitAll<T extends any[]> = { [P in keyof T]: Await<T[P]>; };

/**
 * Maps to a tuple where the first element is the first element of `L` and the second element are the remaining elements of `L`.
 */
export type Shift<L extends any[]> = L extends [infer H, ...infer T] ? [H, T] : [never, never];

/**
 * Inserts an element at the start of a tuple.
 */
export type Unshift<T extends any[], H> = [H, ...T];

/**
 * Reverse the order of the elements of a tuple.
 */
export type Reverse<L extends any[]> = L extends [infer H, ...infer T] ? [...Reverse<T>, H] : [];

/**
 * Maps to a tuple where the first element is the last element of `L` and the second element are the remaining elements of `L`.
 */
export type Pop<L extends any[]> = L extends [...infer H, infer T] ? [T, H] : [never, never];

/**
 * Push an element on to the end of a tuple.
 */
export type Push<H extends any[], T> = [...H, T];

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
    B extends object ? Disjoin<B> : B
>;

/**
 * Maps to `true` if `T` is an empty object (`{}`).
 */
export type IsEmpty<T extends object> = IsNever<keyof T>;

/**
 * Remove from `T` all keys in `K`.
 */
export import Omit = globalThis.Omit;

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

/**
 * Maps to a mutable copy of T.
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
}
