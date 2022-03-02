import { Test, ExpectType } from "../test";

import {
    IsNever,
    IsAny,
    IsUnion,
    IteratedType,
    GeneratorNextType,
    GeneratorReturnType,
    AsyncGeneratorNextType,
    AsyncGeneratorReturnType,
    PromisedType,
    // UnionToIntersection,
    Intersection,
    IsCallable,
    IsConstructable,
    IsUnknown,
    IsSubtypeOf,
    Not,
    And,
    Or,
    XOr,
    Every,
    Some,
    One,
    SameType,
    SameTypes,
    Relatable,
    Overlaps,
    IsSubsetOf,
    IsSupersetOf,
    IsProperSubsetOf,
    IsProperSupersetOf,
    MatchingKeys,
    FunctionKeys,
    Constructor,
    Await,
    AwaitAll,
    Shift,
    Unshift,
    Reverse,
    Pop,
    Push,
    Disjoin,
    Conjoin,
    DisjoinOverlaps,
    IsEmpty,
    Diff,
    Intersect,
    Assign,
    AsyncIteratedType,
    Union,
    RequiredKeyof,
    OptionalKeyof,
} from "..";

it("type-model", () => {
    // Only Type-only tests are provided, below.
});

// #region IteratedType tests
{
    type _ = [
        Test<ExpectType<IteratedType<Iterable<number>>, number>>,
        Test<ExpectType<IteratedType<Generator<number>>, number>>,
        // post TS 3.6 behavior
        Test<ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: false, value: number } } }>, number>>, 
        Test<ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done?: false, value: number } } }>, number>>,
        Test<ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { value: number } } }>, number>>,
        Test<ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: true, value: number } } }>, never>>,
        // pre TS 3.6 behavior
        Test<ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: boolean, value: number } } }>, number>>,
    ];
}
// #endregion IteratedType tests

// #region GeneratorReturnType tests
{
    type _ = [
        Test<ExpectType<GeneratorReturnType<Iterable<number>>, any>>,
        Test<ExpectType<GeneratorReturnType<Generator<number, string, boolean>>, string>>,
        Test<ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: true, value: number } } }>, number>>,
        Test<ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: false, value: number } } }>, never>>,
        Test<ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: boolean, value: number } } }>, number>>,
        Test<ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done?: false, value: number } } }>, never>>,
    ];
}
// #endregion GeneratorReturnType tests

// #region GeneratorNextType tests
{
    type _ = [
        Test<ExpectType<GeneratorNextType<Iterable<number>>, undefined>>,
        Test<ExpectType<GeneratorNextType<Generator<"a", "b", number>>, number>>,
        Test<ExpectType<GeneratorNextType<{ [Symbol.iterator](): { next(value?: number): any } }>, number>>,
    ];
}
// #endregion GeneratorNextType tests

// #region AsyncIteratedType tests
{
    type _ = [
        Test<ExpectType<AsyncIteratedType<AsyncIterable<number>>, number>>,
        Test<ExpectType<AsyncIteratedType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: false, value: number }> } }>, number>>,
        Test<ExpectType<AsyncIteratedType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: false, value: Promise<number> }> } }>, number>>,
        Test<ExpectType<AsyncIteratedType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: false, value: Promise<Promise<number>> }> } }>, number>>,
    ];
}
// #endregion AsyncIteratedType tests

// #region AsyncGeneratorNextType tests
{
    type _ = [
        Test<ExpectType<AsyncGeneratorNextType<{ [Symbol.asyncIterator](): { next(value?: number): any } }>, number>>,
    ];
}
// #endregion AsyncGeneratorNextType tests

// #region AsyncGeneratorReturnType tests
{
    type _ = [
        Test<ExpectType<AsyncGeneratorReturnType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: true, value: number }> } }>, number>>,
    ];
}
// #endregion AsyncGeneratorReturnType tests

// #region PromisedType tests
{
    type _ = [
        Test<ExpectType<PromisedType<number>, never>>,
        Test<ExpectType<PromisedType<{ then(): any }>, never>>,
        Test<ExpectType<PromisedType<{ then(cb: (x: number) => void): any }>, number>>,
        Test<ExpectType<PromisedType<Promise<Promise<number>>>, Promise<number>>>,
    ];
}
// #endregion

// // #region UnionToIntersection tests
// {
//     type _ = [
//         __Test<__ExpectType<UnionToIntersection<1 | 2>, 1 & 2>>,
//         __Test<__ExpectType<UnionToIntersection<1 | never>, 1>>,
//         __Test<__ExpectType<UnionToIntersection<1 | unknown>, unknown>>,
//     ];
// }
// // #endregion

// #region Intersection tests
{
    type _ = [
        Test<ExpectType<Intersection<[1, 2]>,        1 & 2>>,
        Test<ExpectType<Intersection<[1, never]>,    never>>,
        Test<ExpectType<Intersection<[1, unknown]>,  1>>,
    ];
}
// #endregion

// #region Union tests
{
    type _ = [
        Test<ExpectType<Union<[1, 2]>,        1 | 2>>,
        Test<ExpectType<Union<[1, never]>,    1>>,
        Test<ExpectType<Union<[1, unknown]>,  unknown>>,
    ];
}
// #endregion

// #region IsAny tests
{
    type _ = [
        Test<ExpectType<IsAny<any>,        true>>,
        Test<ExpectType<IsAny<never>,      false>>,
        Test<ExpectType<IsAny<unknown>,    false>>,
        Test<ExpectType<IsAny<number>,     false>>,
    ];
}
// #endregion IsAny tests

// #region IsNever tests
{
    type _ = [
        Test<ExpectType<IsNever<never>,    true>>,
        Test<ExpectType<IsNever<any>,      false>>,
        Test<ExpectType<IsNever<unknown>,  false>>,
        Test<ExpectType<IsNever<number>,   false>>,
    ];
}
// #endregion IsNever tests

// #region IsUnion tests
{
    const enum E { One, Two }
    type _ = [
        Test<ExpectType<IsUnion<never>,    false>>,
        Test<ExpectType<IsUnion<any>,      false>>,
        Test<ExpectType<IsUnion<1>,        false>>,
        Test<ExpectType<IsUnion<1 | 2>,    true>>,
        Test<ExpectType<IsUnion<number>,   false>>,
        Test<ExpectType<IsUnion<boolean>,  true>>,
        Test<ExpectType<IsUnion<E>,        true>>,
    ];
}
// #endregion IsUnion tests


// #region IsCallable tests
{
    type A = { (): void, new (): void };
    type _ = [
        Test<ExpectType<IsCallable<any>,               boolean>>,
        Test<ExpectType<IsCallable<never>,             never>>,
        Test<ExpectType<IsCallable<string>,            false>>,
        Test<ExpectType<IsCallable<{}>,                false>>,
        Test<ExpectType<IsCallable<Function>,          true>>,
        Test<ExpectType<IsCallable<() => void>,        true>>,
        Test<ExpectType<IsCallable<new () => void>,    false>>,
        Test<ExpectType<IsCallable<A>,                 true>>,
    ];
}
// #endregion IsCallable tests

// #region IsConstructable tests
{
    type A = { (): void, new (): void };
    type _ = [
        Test<ExpectType<IsConstructable<any>,              boolean>>,
        Test<ExpectType<IsConstructable<never>,            never>>,
        Test<ExpectType<IsConstructable<string>,           false>>,
        Test<ExpectType<IsConstructable<{}>,               false>>,
        Test<ExpectType<IsConstructable<Function>,         true>>,
        Test<ExpectType<IsConstructable<new () => void>,   true>>,
        Test<ExpectType<IsConstructable<() => void>,       false>>,
        Test<ExpectType<IsConstructable<A>,                true>>,
    ];
}
// #endregion IsConstructable tests

// #region IsUnknown tests
{
    type _ = [
        Test<ExpectType<IsUnknown<unknown>, true>>,
        Test<ExpectType<IsUnknown<never>,   false>>,
        Test<ExpectType<IsUnknown<any>,     false>>,
        Test<ExpectType<IsUnknown<1>,       false>>,
    ];
}
// #endregion IsUnknown tests

// #region IsSubtypeOf tests
{
    type _ = [
        Test<ExpectType<IsSubtypeOf<never, never>,     true>>,
        Test<ExpectType<IsSubtypeOf<never, 1>,         true>>,
        Test<ExpectType<IsSubtypeOf<1, never>,         false>>,
        Test<ExpectType<IsSubtypeOf<any, any>,         true>>,
        Test<ExpectType<IsSubtypeOf<any, 1>,           true>>,
        Test<ExpectType<IsSubtypeOf<1, any>,           true>>,
        Test<ExpectType<IsSubtypeOf<unknown, unknown>, true>>,
        Test<ExpectType<IsSubtypeOf<unknown, 1>,       false>>,
        Test<ExpectType<IsSubtypeOf<1, unknown>,       true>>,
    ];
}
// #endregion IsSubtypeOf tests

// #region Not tests
{
    type _ = [
        Test<ExpectType<Not<true>,     false>>,
        Test<ExpectType<Not<false>,    true>>,
        Test<ExpectType<Not<boolean>,  boolean>>,
        Test<ExpectType<Not<any>,      boolean>>,
        Test<ExpectType<Not<never>,    never>>,
    ];
}
// #endregion Not tests

// #region And tests
{
    type _ = [
        Test<ExpectType<And<true, true>,       true>>,
        Test<ExpectType<And<false, false>,     false>>,
        Test<ExpectType<And<true, false>,      false>>,
        Test<ExpectType<And<false, true>,      false>>,
        Test<ExpectType<And<boolean, true>,    boolean>>,
        Test<ExpectType<And<boolean, false>,   false>>,
        Test<ExpectType<And<true, boolean>,    boolean>>,
        Test<ExpectType<And<false, boolean>,   false>>,
        Test<ExpectType<And<boolean, boolean>, boolean>>,
        Test<ExpectType<And<any, true>,        boolean>>,
        Test<ExpectType<And<any, false>,       false>>,
        Test<ExpectType<And<true, any>,        boolean>>,
        Test<ExpectType<And<false, any>,       false>>,
        Test<ExpectType<And<any, any>,         boolean>>,
        Test<ExpectType<And<never, true>,      never>>,
        Test<ExpectType<And<never, false>,     never>>,
        Test<ExpectType<And<true, never>,      never>>,
        Test<ExpectType<And<false, never>,     never>>,
        Test<ExpectType<And<never, never>,     never>>,
    ];
}
// #endregion And tests

// #region Or tests
{
    type _ = [
        Test<ExpectType<Or<true, true>,        true>>,
        Test<ExpectType<Or<false, false>,      false>>,
        Test<ExpectType<Or<true, false>,       true>>,
        Test<ExpectType<Or<false, true>,       true>>,
        Test<ExpectType<Or<boolean, true>,     true>>,
        Test<ExpectType<Or<boolean, false>,    boolean>>,
        Test<ExpectType<Or<true, boolean>,     true>>,
        Test<ExpectType<Or<false, boolean>,    boolean>>,
        Test<ExpectType<Or<boolean, boolean>,  boolean>>,
        Test<ExpectType<Or<any, true>,         true>>,
        Test<ExpectType<Or<any, false>,        boolean>>,
        Test<ExpectType<Or<true, any>,         true>>,
        Test<ExpectType<Or<false, any>,        boolean>>,
        Test<ExpectType<Or<any, any>,          boolean>>,
        Test<ExpectType<Or<never, true>,       never>>,
        Test<ExpectType<Or<never, false>,      never>>,
        Test<ExpectType<Or<true, never>,       never>>,
        Test<ExpectType<Or<false, never>,      never>>,
        Test<ExpectType<Or<never, never>,      never>>,
    ];
}
// #endregion Or tests

// #region XOr tests
{
    type _ = [
        Test<ExpectType<XOr<true, true>,       false>>,
        Test<ExpectType<XOr<false, false>,     false>>,
        Test<ExpectType<XOr<true, false>,      true>>,
        Test<ExpectType<XOr<false, true>,      true>>,
        Test<ExpectType<XOr<boolean, true>,    boolean>>,
        Test<ExpectType<XOr<boolean, false>,   boolean>>,
        Test<ExpectType<XOr<true, boolean>,    boolean>>,
        Test<ExpectType<XOr<false, boolean>,   boolean>>,
        Test<ExpectType<XOr<boolean, boolean>, boolean>>,
        Test<ExpectType<XOr<any, true>,        boolean>>,
        Test<ExpectType<XOr<any, false>,       boolean>>,
        Test<ExpectType<XOr<true, any>,        boolean>>,
        Test<ExpectType<XOr<false, any>,       boolean>>,
        Test<ExpectType<XOr<any, any>,         boolean>>,
        Test<ExpectType<XOr<never, true>,      never>>,
        Test<ExpectType<XOr<never, false>,     never>>,
        Test<ExpectType<XOr<true, never>,      never>>,
        Test<ExpectType<XOr<false, never>,     never>>,
        Test<ExpectType<XOr<never, never>,     never>>,
    ];
}
// #endregion XOr tests

// #region Every tests
{
    type _ = [
        Test<ExpectType<Every<[true, true]>,           true>>,
        Test<ExpectType<Every<[true, true, true]>,     true>>,
        Test<ExpectType<Every<[true, true, false]>,    false>>,
        Test<ExpectType<Every<[false, false]>,         false>>,
        Test<ExpectType<Every<[true, false]>,          false>>,
        Test<ExpectType<Every<[false, true]>,          false>>,
        Test<ExpectType<Every<[boolean, true]>,        boolean>>,
        Test<ExpectType<Every<[boolean, false]>,       false>>,
        Test<ExpectType<Every<[true, boolean]>,        boolean>>,
        Test<ExpectType<Every<[false, boolean]>,       false>>,
        Test<ExpectType<Every<[boolean, boolean]>,     boolean>>,
        Test<ExpectType<Every<[any, true]>,            boolean>>,
        Test<ExpectType<Every<[any, false]>,           false>>,
        Test<ExpectType<Every<[true, any]>,            boolean>>,
        Test<ExpectType<Every<[false, any]>,           false>>,
        Test<ExpectType<Every<[any, any]>,             boolean>>,
        Test<ExpectType<Every<[never, true]>,          never>>,
        Test<ExpectType<Every<[never, false]>,         never>>,
        Test<ExpectType<Every<[true, never]>,          never>>,
        Test<ExpectType<Every<[false, never]>,         never>>,
        Test<ExpectType<Every<[never, never]>,         never>>,
        Test<ExpectType<Every<[]>,                     never>>,
    ]
}
// #endregion Every tests

// #region Some tests
{
    type _ = [
        Test<ExpectType<Some<[true, true]>,        true>>,
        Test<ExpectType<Some<[false, false]>,      false>>,
        Test<ExpectType<Some<[true, false]>,       true>>,
        Test<ExpectType<Some<[false, true]>,       true>>,
        Test<ExpectType<Some<[boolean, true]>,     true>>,
        Test<ExpectType<Some<[boolean, false]>,    boolean>>,
        Test<ExpectType<Some<[true, boolean]>,     true>>,
        Test<ExpectType<Some<[false, boolean]>,    boolean>>,
        Test<ExpectType<Some<[boolean, boolean]>,  boolean>>,
        Test<ExpectType<Some<[any, true]>,         true>>,
        Test<ExpectType<Some<[any, false]>,        boolean>>,
        Test<ExpectType<Some<[true, any]>,         true>>,
        Test<ExpectType<Some<[false, any]>,        boolean>>,
        Test<ExpectType<Some<[any, any]>,          boolean>>,
        Test<ExpectType<Some<[never, true]>,       never>>,
        Test<ExpectType<Some<[never, false]>,      never>>,
        Test<ExpectType<Some<[true, never]>,       never>>,
        Test<ExpectType<Some<[false, never]>,      never>>,
        Test<ExpectType<Some<[never, never]>,      never>>,
        Test<ExpectType<Some<[]>,                  never>>,
    ]
}
// #endregion Some tests

// #region One tests
{
    type _ = [
        Test<ExpectType<One<[true, true]>,       false>>,
        Test<ExpectType<One<[false, false]>,     false>>,
        Test<ExpectType<One<[true, false]>,      true>>,
        Test<ExpectType<One<[false, true]>,      true>>,
        Test<ExpectType<One<[boolean, true]>,    boolean>>,
        Test<ExpectType<One<[boolean, false]>,   boolean>>,
        Test<ExpectType<One<[true, boolean]>,    boolean>>,
        Test<ExpectType<One<[false, boolean]>,   boolean>>,
        Test<ExpectType<One<[boolean, boolean]>, boolean>>,
        Test<ExpectType<One<[any, true]>,        boolean>>,
        Test<ExpectType<One<[any, false]>,       boolean>>,
        Test<ExpectType<One<[true, any]>,        boolean>>,
        Test<ExpectType<One<[false, any]>,       boolean>>,
        Test<ExpectType<One<[any, any]>,         boolean>>,
        Test<ExpectType<One<[never, true]>,      never>>,
        Test<ExpectType<One<[never, false]>,     never>>,
        Test<ExpectType<One<[true, never]>,      never>>,
        Test<ExpectType<One<[false, never]>,     never>>,
        Test<ExpectType<One<[never, never]>,     never>>,
        Test<ExpectType<One<[]>,                 never>>,
    ]
}
// #endregion One tests

// #region SameType tests
{
    type A = { a: number };
    type B = { b: number };
    type Ab = { a: number, b?: number };
    type Ac = { a: number, c?: number };
    type Ba = { b: number, a?: number };
    type _ = [
        Test<ExpectType<SameType<any, any>,            true>>,
        Test<ExpectType<SameType<never, never>,        true>>,
        Test<ExpectType<SameType<unknown, unknown>,    true>>,
        Test<ExpectType<SameType<any, true>,           true>>,
        Test<ExpectType<SameType<never, true>,         false>>,
        Test<ExpectType<SameType<unknown, true>,       false>>,
        Test<ExpectType<SameType<true, true>,          true>>,
        Test<ExpectType<SameType<false, true>,         false>>,
        Test<ExpectType<SameType<A, A>,                true>>,
        Test<ExpectType<SameType<A, B>,                false>>,
        Test<ExpectType<SameType<Ab, Ba>,              false>>,
        Test<ExpectType<SameType<Ab, Ac>,              true>>,
        Test<ExpectType<SameType<true, any>,           true>>,
        Test<ExpectType<SameType<true, never>,         false>>,
        Test<ExpectType<SameType<true, unknown>,       false>>,
    ];
}
// #endregion SameType tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// #region SameTypes tests
{
    type A = { a: number };
    type B = { b: number };
    type Ab = { a: number, b?: number };
    type Ac = { a: number, c?: number };
    type Ba = { b: number, a?: number };
    type _ = [
        Test<ExpectType<SameTypes<never>,              never>>,
        Test<ExpectType<SameTypes<[]>,                 never>>,
        Test<ExpectType<SameTypes<[any, any]>,         true>>,
        Test<ExpectType<SameTypes<[never, never]>,     true>>,
        Test<ExpectType<SameTypes<[unknown, unknown]>, true>>,
        Test<ExpectType<SameTypes<[any, true]>,        true>>,
        Test<ExpectType<SameTypes<[never, true]>,      false>>,
        Test<ExpectType<SameTypes<[unknown, true]>,    false>>,
        Test<ExpectType<SameTypes<[true, true]>,       true>>,
        Test<ExpectType<SameTypes<[false, true]>,      false>>,
        Test<ExpectType<SameTypes<[A, A]>,             true>>,
        Test<ExpectType<SameTypes<[A, B]>,             false>>,
        Test<ExpectType<SameTypes<[Ab, Ba]>,           false>>,
        Test<ExpectType<SameTypes<[Ab, Ac]>,           true>>,
        Test<ExpectType<SameTypes<[true, any]>,        true>>,
        Test<ExpectType<SameTypes<[true, never]>,      false>>,
        Test<ExpectType<SameTypes<[true, unknown]>,    false>>,
    ];
}
// #endregion SameTypes tests

// #region Relatable tests
{
    type _ = [
        Test<ExpectType<Relatable<any, any>,        true>>,
        Test<ExpectType<Relatable<any, any>,        true>>,
        Test<ExpectType<Relatable<any, number>,     true>>,
        Test<ExpectType<Relatable<number, any>,     true>>,
        Test<ExpectType<Relatable<number, number>,  true>>,
        Test<ExpectType<Relatable<number, 1>,       true>>,
        Test<ExpectType<Relatable<1, number>,       true>>,
        Test<ExpectType<Relatable<1, 2>,            false>>,
        Test<ExpectType<Relatable<1 | 2, 3 | 4>,    false>>,
        Test<ExpectType<Relatable<1 | 2, 2 | 3>,    false>>,
        Test<ExpectType<Relatable<never, any>,      false>>,
        Test<ExpectType<Relatable<any, never>,      false>>,
        Test<ExpectType<Relatable<never, never>,    false>>,
    ];
}
// #endregion Relatable tests

// #region Overlaps tests
{
    type _ = [
        Test<ExpectType<Overlaps<any, any>,        true>>,
        Test<ExpectType<Overlaps<any, any>,        true>>,
        Test<ExpectType<Overlaps<any, number>,     true>>,
        Test<ExpectType<Overlaps<number, any>,     true>>,
        Test<ExpectType<Overlaps<number, number>,  true>>,
        Test<ExpectType<Overlaps<number, 1>,       true>>,
        Test<ExpectType<Overlaps<1, number>,       true>>,
        Test<ExpectType<Overlaps<1, 2>,            false>>,
        Test<ExpectType<Overlaps<1 | 2, 3 | 4>,    false>>,
        Test<ExpectType<Overlaps<1 | 2, 2 | 3>,    true>>,
        Test<ExpectType<Overlaps<never, any>,      false>>,
        Test<ExpectType<Overlaps<any, never>,      false>>,
        Test<ExpectType<Overlaps<never, never>,    false>>,
    ];
}
// #endregion Overlaps tests

// #region IsSubsetOf tests
{
    type _ = [
        Test<ExpectType<IsSubsetOf<any, any>,            boolean>>,
        Test<ExpectType<IsSubsetOf<any, 1>,              boolean>>,
        Test<ExpectType<IsSubsetOf<1, any>,              boolean>>,
        Test<ExpectType<IsSubsetOf<never, never>,        true>>,
        Test<ExpectType<IsSubsetOf<never, 1>,            true>>,
        Test<ExpectType<IsSubsetOf<1, never>,            false>>,
        Test<ExpectType<IsSubsetOf<unknown, unknown>,    false>>,
        Test<ExpectType<IsSubsetOf<unknown, 1>,          false>>,
        Test<ExpectType<IsSubsetOf<1, unknown>,          true>>,
        Test<ExpectType<IsSubsetOf<number, number>,      true>>,
        Test<ExpectType<IsSubsetOf<1, 1>,                true>>,
        Test<ExpectType<IsSubsetOf<1, number>,           true>>,
        Test<ExpectType<IsSubsetOf<1, 1 | 2>,            true>>,
        Test<ExpectType<IsSubsetOf<number, 1>,           false>>,
        Test<ExpectType<IsSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsSupersetOf tests
{
    type _ = [
        Test<ExpectType<IsSupersetOf<any, any>,            boolean>>,
        Test<ExpectType<IsSupersetOf<any, 1>,              boolean>>,
        Test<ExpectType<IsSupersetOf<1, any>,              boolean>>,
        Test<ExpectType<IsSupersetOf<never, never>,        true>>,
        Test<ExpectType<IsSupersetOf<never, 1>,            false>>,
        Test<ExpectType<IsSupersetOf<1, never>,            true>>,
        Test<ExpectType<IsSupersetOf<unknown, unknown>,    false>>,
        Test<ExpectType<IsSupersetOf<unknown, 1>,          true>>,
        Test<ExpectType<IsSupersetOf<1, unknown>,          false>>,
        Test<ExpectType<IsSupersetOf<number, number>,      true>>,
        Test<ExpectType<IsSupersetOf<1, 1>,                true>>,
        Test<ExpectType<IsSupersetOf<1, number>,           false>>,
        Test<ExpectType<IsSupersetOf<1, 1 | 2>,            false>>,
        Test<ExpectType<IsSupersetOf<number, 1>,           true>>,
        Test<ExpectType<IsSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsProperSubsetOf tests
{
    type _ = [
        Test<ExpectType<IsProperSubsetOf<any, any>,            boolean>>,
        Test<ExpectType<IsProperSubsetOf<any, 1>,              boolean>>,
        Test<ExpectType<IsProperSubsetOf<1, any>,              boolean>>,
        Test<ExpectType<IsProperSubsetOf<never, never>,        false>>,
        Test<ExpectType<IsProperSubsetOf<never, 1>,            true>>,
        Test<ExpectType<IsProperSubsetOf<1, never>,            false>>,
        Test<ExpectType<IsProperSubsetOf<unknown, unknown>,    false>>,
        Test<ExpectType<IsProperSubsetOf<unknown, 1>,          false>>,
        Test<ExpectType<IsProperSubsetOf<1, unknown>,          true>>,
        Test<ExpectType<IsProperSubsetOf<number, number>,      false>>,
        Test<ExpectType<IsProperSubsetOf<1, 1>,                false>>,
        Test<ExpectType<IsProperSubsetOf<1, number>,           true>>,
        Test<ExpectType<IsProperSubsetOf<1, 1 | 2>,            true>>,
        Test<ExpectType<IsProperSubsetOf<number, 1>,           false>>,
        Test<ExpectType<IsProperSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsProperSubsetOf tests

// #region IsProperSupersetOf tests
{
    type _ = [
        Test<ExpectType<IsProperSupersetOf<any, any>,            boolean>>,
        Test<ExpectType<IsProperSupersetOf<any, 1>,              boolean>>,
        Test<ExpectType<IsProperSupersetOf<1, any>,              boolean>>,
        Test<ExpectType<IsProperSupersetOf<never, never>,        false>>,
        Test<ExpectType<IsProperSupersetOf<never, 1>,            false>>,
        Test<ExpectType<IsProperSupersetOf<1, never>,            true>>,
        Test<ExpectType<IsProperSupersetOf<unknown, unknown>,    false>>,
        Test<ExpectType<IsProperSupersetOf<unknown, 1>,          true>>,
        Test<ExpectType<IsProperSupersetOf<1, unknown>,          false>>,
        Test<ExpectType<IsProperSupersetOf<number, number>,      false>>,
        Test<ExpectType<IsProperSupersetOf<1, 1>,                false>>,
        Test<ExpectType<IsProperSupersetOf<1, number>,           false>>,
        Test<ExpectType<IsProperSupersetOf<1, 1 | 2>,            false>>,
        Test<ExpectType<IsProperSupersetOf<number, 1>,           true>>,
        Test<ExpectType<IsProperSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsProperSupersetOf tests

// #region MatchingKeys tests
{
    type A = { a: number, b: string, c: number };
    type _ = [
        Test<ExpectType<MatchingKeys<A, number>, "a" | "c">>,
        Test<ExpectType<MatchingKeys<A, string>, "b">>,
        Test<ExpectType<MatchingKeys<A, boolean>, never>>,
    ];
}
// #endregion MatchingKeys tests

// #region FunctionKeys tests
{
    type A = { a(x: string): void, b(x: number): void, c(): void, d: new () => any };
    type _ = [
        Test<ExpectType<FunctionKeys<A>,                       "a" | "b" | "c" | "d">>,
        Test<ExpectType<FunctionKeys<A, () => void>,           "c">>,
        Test<ExpectType<FunctionKeys<A, (x: string) => void>,  "a" | "c">>,
        Test<ExpectType<FunctionKeys<A, (x: number) => void>,  "b" | "c">>,
        Test<ExpectType<FunctionKeys<A, Constructor>,          "d">>,
    ];
}
// #endregion FunctionKeys tests

// #region Await tests
{
    type _ = [
        Test<ExpectType<Await<number>,                   number>>,
        Test<ExpectType<Await<{ then(): any }>,          never>>,
        Test<ExpectType<Await<{ then: number }>,         { then: number }>>,
        Test<ExpectType<Await<Promise<number>>,          number>>,
        Test<ExpectType<Await<Promise<Promise<number>>>, number>>,
    ];
}
// #endregion Await tests

// #region AwaitAll tests
{
    type _ = [
        Test<ExpectType<AwaitAll<[]>,                          []>>,
        Test<ExpectType<AwaitAll<[number]>,                    [number]>>,
        Test<ExpectType<AwaitAll<[Promise<number>]>,           [number]>>,
        Test<ExpectType<AwaitAll<[Promise<number>, number]>,   [number, number]>>,
    ];
}
// #endregion AwaitAll tests

// #region Shift tests
{
    type _ = [
        Test<ExpectType<Shift<[1, 2, 3]>,  [1, [2, 3]]>>,
        Test<ExpectType<Shift<[1, 2]>,     [1, [2]]>>,
        Test<ExpectType<Shift<[1]>,        [1, []]>>,
        Test<ExpectType<Shift<[]>,         [never, never]>>,
    ];
}
// #endregion Shift tests

// #region Unshift tests
{
    type _ = [
        Test<ExpectType<Unshift<[1, 2], 3>,    [3, 1, 2]>>,
        Test<ExpectType<Unshift<[1], 2>,       [2, 1]>>,
        Test<ExpectType<Unshift<[], 1>,        [1]>>,
        Test<ExpectType<Unshift<never, 1>,     never>>,
    ];
}
// #endregion Unshift tests

// #region Reverse tests
{
    type _ = [
        Test<ExpectType<Reverse<[1, 2, 3]>,        [3, 2, 1]>>,
        Test<ExpectType<Reverse<[1, 2]>,           [2, 1]>>,
        Test<ExpectType<Reverse<[1]>,              [1]>>,
        Test<ExpectType<Reverse<[]>,               []>>,
        Test<ExpectType<Reverse<[1, ...number[]]>, [1]>>,
        Test<ExpectType<Reverse<never>,            never>>,
    ];
}
// #endregion Reverse tests

// #region Pop tests
{
    type _ = [
        Test<ExpectType<Pop<[1, 2, 3]>,   [3, [1, 2]]>>,
        Test<ExpectType<Pop<[1, 2]>,      [2, [1]]>>,
        Test<ExpectType<Pop<[1]>,         [1, []]>>,
        Test<ExpectType<Pop<[]>,          [never, never]>>,
    ];
}
// #endregion Pop tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// #region Push tests
{
    type _ = [
        Test<ExpectType<Push<[1, 2], 3>,   [1, 2, 3]>>,
        Test<ExpectType<Push<[1], 2>,      [1, 2]>>,
        Test<ExpectType<Push<[], 1>,       [1]>>,
        Test<ExpectType<Push<never, 1>,    never>>,
    ]
}
// #endregion Push tests

// #region Disjoin tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };
    type AandB = A & B;
    type AorB = A | B;
    type _ = [
        Test<ExpectType<Disjoin<AB>,       AorB>>,
        Test<ExpectType<Disjoin<AandB>,    AorB>>,
        Test<ExpectType<Disjoin<A>,        A>>,
        Test<ExpectType<Disjoin<{}>,       {}>>,
        Test<ExpectType<Disjoin<never>,    never>>,
        Test<ExpectType<Disjoin<any>,      any>>,
    ];
}
// #endregion Disjoin tests

// #region Conjoin tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };

    type T1 = Conjoin<A | B>;
    type _ = [
        // NOTE: There is no way in typespace to differentiate between `{ a: number, b: number }` and
        //       `{ a: number } & { b: number }`, so this needs to be manually verified above.
        Test<ExpectType<T1, AB>>,
    ];
}
// #endregion Conjoin tests

// #region DisjoinOverlaps tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };
    type _ = [
        Test<ExpectType<DisjoinOverlaps<any, any>,         true>>,
        Test<ExpectType<DisjoinOverlaps<any, any>,         true>>,
        Test<ExpectType<DisjoinOverlaps<any, number>,      true>>,
        Test<ExpectType<DisjoinOverlaps<number, any>,      true>>,
        Test<ExpectType<DisjoinOverlaps<number, number>,   true>>,
        Test<ExpectType<DisjoinOverlaps<number, 1>,        true>>,
        Test<ExpectType<DisjoinOverlaps<1, number>,        true>>,
        Test<ExpectType<DisjoinOverlaps<1, 2>,             false>>,
        Test<ExpectType<DisjoinOverlaps<1 | 2, 3 | 4>,     false>>,
        Test<ExpectType<DisjoinOverlaps<1 | 2, 2 | 3>,     true>>,
        Test<ExpectType<DisjoinOverlaps<A, B>,             false>>,
        Test<ExpectType<DisjoinOverlaps<A, AB>,            true>>,
        Test<ExpectType<DisjoinOverlaps<AB, B>,            true>>,
        Test<ExpectType<DisjoinOverlaps<never, any>,       false>>,
        Test<ExpectType<DisjoinOverlaps<any, never>,       false>>,
        Test<ExpectType<DisjoinOverlaps<never, never>,     false>>,
    ];
}
// #endregion DisjoinOverlaps tests

// #region IsEmpty tests
declare const testSymbol: unique symbol;
{
    type _ = [
        Test<ExpectType<IsEmpty<{}>, true>>,
        Test<ExpectType<IsEmpty<{ a: number }>, false>>,
        Test<ExpectType<IsEmpty<{ [a: number]: any }>, false>>,
        Test<ExpectType<IsEmpty<{ [testSymbol]: any }>, false>>,
    ];
}
// #endregion IsEmpty tests

// #region Diff tests
{
    type A = { a: number };
    type B = { b: number };
    type B2 = { b: string };
    type AB = { a: number, b: number };
    type ABC = { a: number, b: number, c: number };
    type AC = { a: number, c: number };
    type _ = [
        Test<ExpectType<Diff<AB, B>, A>>,
        Test<ExpectType<Diff<AB, B2>, A>>,
        Test<ExpectType<Diff<ABC, B>, AC>>,
    ];
}
// #endregion Diff tests

// #region Intersect tests
{
    type A = { a: number };
    type B = { b: number };
    type AB1 = { a: number, b: number };
    type AB2 = { a: number, b: string };
    type AB1and2 = { a: number, b: number & string };
    type AC = { a: number, c: number };
    type _ = [
        Test<ExpectType<Intersect<AB1, AC>,    A>>,
        Test<ExpectType<Intersect<AB1, AB2>,   AB1and2>>,
        Test<ExpectType<Intersect<A, B>,       {}>>,
    ];
}
// #endregion Intersect tests

// #region Assign tests
{
    type A = { a: number };
    type B = { b: number };
    type B2 = { b: string };
    type C = { c: number };
    type AB = { a: number, b: number };
    type AB2 = { a: number, b: string };
    type AC = { a: number, c: number };
    type BC = { b: number, c: number };
    type ABC = { a: number, b: number, c: number };

    type _ = [
        Test<ExpectType<Assign<A, B>,      AB>>,
        Test<ExpectType<Assign<AB, AC>,    ABC>>,
        Test<ExpectType<Assign<AB, C>,     ABC>>,
        Test<ExpectType<Assign<A, BC>,     ABC>>,
        Test<ExpectType<Assign<B, ABC>,    ABC>>,
        Test<ExpectType<Assign<AB, B2>,    AB2>>,
    ];
}
// #endregion Assign tests

// #region RequiredKeyof tests
{
    type _ = [
        Test<ExpectType<RequiredKeyof<{ a: 1, b: 2, c?: 3 }>, "a" | "b">>,
    ]
}
// #endregion RequiredKeyof tests

// #region OptionalKeyof tests
{
    type _ = [
        Test<ExpectType<OptionalKeyof<{ a: 1, b: 2, c?: 3 }>, "c">>,
    ]
}
// #endregion OptionalKeyof tests
