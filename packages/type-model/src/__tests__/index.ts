import {
    IsNever,
    IsAny,
    IsUnion,
    IteratedType,
    GeneratorNextType,
    GeneratorReturnType,
    // AsyncIteratedType,
    // AsyncGeneratorNextType,
    // AsyncGeneratorReturnType,
    PromisedType,
    // UnionToIntersection,
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
    // Await,
    // AwaitAll,
    // Shift,
    // Unshift,
    // Reverse,
    // Pop,
    // Push,
    Disjoin,
    Conjoin,
    DisjoinOverlaps,
    IsEmpty,
    Diff,
    Intersect,
    Assign
} from "..";

it("type-model", () => {
    // Only Type-only tests are provided, below.
});

// #region IteratedType tests
{
    type _ = [
        __Verify<__ExactType<IteratedType<Iterable<number>>, number>>,
        __Verify<__ExactType<IteratedType<{ [Symbol.iterator](): { next(): { done: false, value: number } } }>, number>>,
    ];
}
// #endregion IteratedType tests

// #region GeneratorNextType tests
{
    type _ = [
        __Verify<__ExactType<GeneratorNextType<{ [Symbol.iterator](): { next(value?: number): any } }>, number>>,
    ];
}
// #endregion GeneratorNextType tests

// #region GeneratorReturnType tests
{
    type _ = [
        __Verify<__ExactType<GeneratorReturnType<Iterable<number>>, any>>,
        __Verify<__ExactType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: true, value: number } } }>, number>>,
    ];
}
// #endregion GeneratorReturnType tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region AsyncIteratedType tests
// {
//     type _ = [
//         __Verify<__ExactType<AsyncIteratedType<AsyncIterable<number>>, number>>,
//         __Verify<__ExactType<AsyncIteratedType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: false, value: number }> } }>, number>>,
//     ];
// }
// // #endregion AsyncIteratedType tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region AsyncGeneratorNextType tests
// {
//     type _ = [
//         __Verify<__ExactType<AsyncGeneratorNextType<{ [Symbol.asyncIterator](): { next(value?: number): any } }>, number>>,
//     ];
// }
// // #endregion AsyncGeneratorNextType tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region AsyncGeneratorReturnType tests
// {
//     type _ = [
//         __Verify<__ExactType<AsyncGeneratorReturnType<AsyncIterable<number>>, number>>,
//         __Verify<__ExactType<AsyncGeneratorReturnType<{ [Symbol.asyncIterator](): { next(): Promise<{ done: true, value: number }> } }>, number>>,
//     ];
// }
// // #endregion AsyncGeneratorReturnType tests

// #region PromisedType tests
{
    type _ = [
        __Verify<__ExactType<PromisedType<number>, never>>,
        __Verify<__ExactType<PromisedType<{ then(): any }>, never>>,
        __Verify<__ExactType<PromisedType<{ then(cb: (x: number) => void): any }>, number>>,
        __Verify<__ExactType<PromisedType<Promise<Promise<number>>>, Promise<number>>>,
    ];
}
// #endregion

// // #region UnionToIntersection tests
// {
//     type _ = [
//         __Verify<__ExactType<UnionToIntersection<1 | 2>, 1 & 2>>,
//         __Verify<__ExactType<UnionToIntersection<1 | never>, 1>>,
//         __Verify<__ExactType<UnionToIntersection<1 | unknown>, unknown>>,
//     ];
// }
// // #endregion

// #region IsAny tests
{
    type _ = [
        __Verify<__ExactType<IsAny<any>,        true>>,
        __Verify<__ExactType<IsAny<never>,      false>>,
        __Verify<__ExactType<IsAny<unknown>,    false>>,
        __Verify<__ExactType<IsAny<number>,     false>>,
    ];
}
// #endregion IsAny tests

// #region IsNever tests
{
    type _ = [
        __Verify<__ExactType<IsNever<never>,    true>>,
        __Verify<__ExactType<IsNever<any>,      false>>,
        __Verify<__ExactType<IsNever<unknown>,  false>>,
        __Verify<__ExactType<IsNever<number>,   false>>,
    ];
}
// #endregion IsNever tests

// #region IsUnion tests
{
    const enum E { One, Two }
    type _ = [
        __Verify<__ExactType<IsUnion<never>,    false>>,
        __Verify<__ExactType<IsUnion<any>,      false>>,
        __Verify<__ExactType<IsUnion<1>,        false>>,
        __Verify<__ExactType<IsUnion<1 | 2>,    true>>,
        __Verify<__ExactType<IsUnion<number>,   false>>,
        __Verify<__ExactType<IsUnion<boolean>,  true>>,
        __Verify<__ExactType<IsUnion<E>,        true>>,
    ];
}
// #endregion IsUnion tests


// #region IsCallable tests
{
    type A = { (): void, new (): void };
    type _ = [
        __Verify<__ExactType<IsCallable<any>,               boolean>>,
        __Verify<__ExactType<IsCallable<never>,             never>>,
        __Verify<__ExactType<IsCallable<string>,            false>>,
        __Verify<__ExactType<IsCallable<{}>,                false>>,
        __Verify<__ExactType<IsCallable<Function>,          true>>,
        __Verify<__ExactType<IsCallable<() => void>,        true>>,
        __Verify<__ExactType<IsCallable<new () => void>,    false>>,
        __Verify<__ExactType<IsCallable<A>,                 true>>,
    ];
}
// #endregion IsCallable tests

// #region IsConstructable tests
{
    type A = { (): void, new (): void };
    type _ = [
        __Verify<__ExactType<IsConstructable<any>,              boolean>>,
        __Verify<__ExactType<IsConstructable<never>,            never>>,
        __Verify<__ExactType<IsConstructable<string>,           false>>,
        __Verify<__ExactType<IsConstructable<{}>,               false>>,
        __Verify<__ExactType<IsConstructable<Function>,         true>>,
        __Verify<__ExactType<IsConstructable<new () => void>,   true>>,
        __Verify<__ExactType<IsConstructable<() => void>,       false>>,
        __Verify<__ExactType<IsConstructable<A>,                true>>,
    ];
}
// #endregion IsConstructable tests

// #region IsUnknown tests
{
    type _ = [
        __Verify<__ExactType<IsUnknown<unknown>, true>>,
        __Verify<__ExactType<IsUnknown<never>,   false>>,
        __Verify<__ExactType<IsUnknown<any>,     false>>,
        __Verify<__ExactType<IsUnknown<1>,       false>>,
    ];
}
// #endregion IsUnknown tests

// #region IsSubtypeOf tests
{
    type _ = [
        __Verify<__ExactType<IsSubtypeOf<never, never>,     true>>,
        __Verify<__ExactType<IsSubtypeOf<never, 1>,         true>>,
        __Verify<__ExactType<IsSubtypeOf<1, never>,         false>>,
        __Verify<__ExactType<IsSubtypeOf<any, any>,         true>>,
        __Verify<__ExactType<IsSubtypeOf<any, 1>,           true>>,
        __Verify<__ExactType<IsSubtypeOf<1, any>,           true>>,
        __Verify<__ExactType<IsSubtypeOf<unknown, unknown>, true>>,
        __Verify<__ExactType<IsSubtypeOf<unknown, 1>,       false>>,
        __Verify<__ExactType<IsSubtypeOf<1, unknown>,       true>>,
    ];
}
// #endregion IsSubtypeOf tests

// #region Not tests
{
    type _ = [
        __Verify<__ExactType<Not<true>,     false>>,
        __Verify<__ExactType<Not<false>,    true>>,
        __Verify<__ExactType<Not<boolean>,  boolean>>,
        __Verify<__ExactType<Not<any>,      boolean>>,
        __Verify<__ExactType<Not<never>,    never>>,
    ];
}
// #endregion Not tests

// #region And tests
{
    type _ = [
        __Verify<__ExactType<And<true, true>,       true>>,
        __Verify<__ExactType<And<false, false>,     false>>,
        __Verify<__ExactType<And<true, false>,      false>>,
        __Verify<__ExactType<And<false, true>,      false>>,
        __Verify<__ExactType<And<boolean, true>,    boolean>>,
        __Verify<__ExactType<And<boolean, false>,   false>>,
        __Verify<__ExactType<And<true, boolean>,    boolean>>,
        __Verify<__ExactType<And<false, boolean>,   false>>,
        __Verify<__ExactType<And<boolean, boolean>, boolean>>,
        __Verify<__ExactType<And<any, true>,        boolean>>,
        __Verify<__ExactType<And<any, false>,       false>>,
        __Verify<__ExactType<And<true, any>,        boolean>>,
        __Verify<__ExactType<And<false, any>,       false>>,
        __Verify<__ExactType<And<any, any>,         boolean>>,
        __Verify<__ExactType<And<never, true>,      never>>,
        __Verify<__ExactType<And<never, false>,     never>>,
        __Verify<__ExactType<And<true, never>,      never>>,
        __Verify<__ExactType<And<false, never>,     never>>,
        __Verify<__ExactType<And<never, never>,     never>>,
    ];
}
// #endregion And tests

// #region Or tests
{
    type _ = [
        __Verify<__ExactType<Or<true, true>,        true>>,
        __Verify<__ExactType<Or<false, false>,      false>>,
        __Verify<__ExactType<Or<true, false>,       true>>,
        __Verify<__ExactType<Or<false, true>,       true>>,
        __Verify<__ExactType<Or<boolean, true>,     true>>,
        __Verify<__ExactType<Or<boolean, false>,    boolean>>,
        __Verify<__ExactType<Or<true, boolean>,     true>>,
        __Verify<__ExactType<Or<false, boolean>,    boolean>>,
        __Verify<__ExactType<Or<boolean, boolean>,  boolean>>,
        __Verify<__ExactType<Or<any, true>,         true>>,
        __Verify<__ExactType<Or<any, false>,        boolean>>,
        __Verify<__ExactType<Or<true, any>,         true>>,
        __Verify<__ExactType<Or<false, any>,        boolean>>,
        __Verify<__ExactType<Or<any, any>,          boolean>>,
        __Verify<__ExactType<Or<never, true>,       never>>,
        __Verify<__ExactType<Or<never, false>,      never>>,
        __Verify<__ExactType<Or<true, never>,       never>>,
        __Verify<__ExactType<Or<false, never>,      never>>,
        __Verify<__ExactType<Or<never, never>,      never>>,
    ];
}
// #endregion Or tests

// #region XOr tests
{
    type _ = [
        __Verify<__ExactType<XOr<true, true>,       false>>,
        __Verify<__ExactType<XOr<false, false>,     false>>,
        __Verify<__ExactType<XOr<true, false>,      true>>,
        __Verify<__ExactType<XOr<false, true>,      true>>,
        __Verify<__ExactType<XOr<boolean, true>,    boolean>>,
        __Verify<__ExactType<XOr<boolean, false>,   boolean>>,
        __Verify<__ExactType<XOr<true, boolean>,    boolean>>,
        __Verify<__ExactType<XOr<false, boolean>,   boolean>>,
        __Verify<__ExactType<XOr<boolean, boolean>, boolean>>,
        __Verify<__ExactType<XOr<any, true>,        boolean>>,
        __Verify<__ExactType<XOr<any, false>,       boolean>>,
        __Verify<__ExactType<XOr<true, any>,        boolean>>,
        __Verify<__ExactType<XOr<false, any>,       boolean>>,
        __Verify<__ExactType<XOr<any, any>,         boolean>>,
        __Verify<__ExactType<XOr<never, true>,      never>>,
        __Verify<__ExactType<XOr<never, false>,     never>>,
        __Verify<__ExactType<XOr<true, never>,      never>>,
        __Verify<__ExactType<XOr<false, never>,     never>>,
        __Verify<__ExactType<XOr<never, never>,     never>>,
    ];
}
// #endregion XOr tests

// #region Every tests
{
    type _ = [
        __Verify<__ExactType<Every<[true, true]>,           true>>,
        __Verify<__ExactType<Every<[true, true, true]>,     true>>,
        __Verify<__ExactType<Every<[true, true, false]>,    false>>,
        __Verify<__ExactType<Every<[false, false]>,         false>>,
        __Verify<__ExactType<Every<[true, false]>,          false>>,
        __Verify<__ExactType<Every<[false, true]>,          false>>,
        __Verify<__ExactType<Every<[boolean, true]>,        boolean>>,
        __Verify<__ExactType<Every<[boolean, false]>,       false>>,
        __Verify<__ExactType<Every<[true, boolean]>,        boolean>>,
        __Verify<__ExactType<Every<[false, boolean]>,       false>>,
        __Verify<__ExactType<Every<[boolean, boolean]>,     boolean>>,
        __Verify<__ExactType<Every<[any, true]>,            boolean>>,
        __Verify<__ExactType<Every<[any, false]>,           false>>,
        __Verify<__ExactType<Every<[true, any]>,            boolean>>,
        __Verify<__ExactType<Every<[false, any]>,           false>>,
        __Verify<__ExactType<Every<[any, any]>,             boolean>>,
        __Verify<__ExactType<Every<[never, true]>,          never>>,
        __Verify<__ExactType<Every<[never, false]>,         never>>,
        __Verify<__ExactType<Every<[true, never]>,          never>>,
        __Verify<__ExactType<Every<[false, never]>,         never>>,
        __Verify<__ExactType<Every<[never, never]>,         never>>,
        __Verify<__ExactType<Every<[]>,                     never>>,
    ]
}
// #endregion Every tests

// #region Some tests
{
    type _ = [
        __Verify<__ExactType<Some<[true, true]>,        true>>,
        __Verify<__ExactType<Some<[false, false]>,      false>>,
        __Verify<__ExactType<Some<[true, false]>,       true>>,
        __Verify<__ExactType<Some<[false, true]>,       true>>,
        __Verify<__ExactType<Some<[boolean, true]>,     true>>,
        __Verify<__ExactType<Some<[boolean, false]>,    boolean>>,
        __Verify<__ExactType<Some<[true, boolean]>,     true>>,
        __Verify<__ExactType<Some<[false, boolean]>,    boolean>>,
        __Verify<__ExactType<Some<[boolean, boolean]>,  boolean>>,
        __Verify<__ExactType<Some<[any, true]>,         true>>,
        __Verify<__ExactType<Some<[any, false]>,        boolean>>,
        __Verify<__ExactType<Some<[true, any]>,         true>>,
        __Verify<__ExactType<Some<[false, any]>,        boolean>>,
        __Verify<__ExactType<Some<[any, any]>,          boolean>>,
        __Verify<__ExactType<Some<[never, true]>,       never>>,
        __Verify<__ExactType<Some<[never, false]>,      never>>,
        __Verify<__ExactType<Some<[true, never]>,       never>>,
        __Verify<__ExactType<Some<[false, never]>,      never>>,
        __Verify<__ExactType<Some<[never, never]>,      never>>,
        __Verify<__ExactType<Some<[]>,                  never>>,
    ]
}
// #endregion Some tests

// #region One tests
{
    type _ = [
        __Verify<__ExactType<One<[true, true]>,       false>>,
        __Verify<__ExactType<One<[false, false]>,     false>>,
        __Verify<__ExactType<One<[true, false]>,      true>>,
        __Verify<__ExactType<One<[false, true]>,      true>>,
        __Verify<__ExactType<One<[boolean, true]>,    boolean>>,
        __Verify<__ExactType<One<[boolean, false]>,   boolean>>,
        __Verify<__ExactType<One<[true, boolean]>,    boolean>>,
        __Verify<__ExactType<One<[false, boolean]>,   boolean>>,
        __Verify<__ExactType<One<[boolean, boolean]>, boolean>>,
        __Verify<__ExactType<One<[any, true]>,        boolean>>,
        __Verify<__ExactType<One<[any, false]>,       boolean>>,
        __Verify<__ExactType<One<[true, any]>,        boolean>>,
        __Verify<__ExactType<One<[false, any]>,       boolean>>,
        __Verify<__ExactType<One<[any, any]>,         boolean>>,
        __Verify<__ExactType<One<[never, true]>,      never>>,
        __Verify<__ExactType<One<[never, false]>,     never>>,
        __Verify<__ExactType<One<[true, never]>,      never>>,
        __Verify<__ExactType<One<[false, never]>,     never>>,
        __Verify<__ExactType<One<[never, never]>,     never>>,
        __Verify<__ExactType<One<[]>,                 never>>,
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
        __Verify<__ExactType<SameType<any, any>,            true>>,
        __Verify<__ExactType<SameType<never, never>,        true>>,
        __Verify<__ExactType<SameType<unknown, unknown>,    true>>,
        __Verify<__ExactType<SameType<any, true>,           true>>,
        __Verify<__ExactType<SameType<never, true>,         false>>,
        __Verify<__ExactType<SameType<unknown, true>,       false>>,
        __Verify<__ExactType<SameType<true, true>,          true>>,
        __Verify<__ExactType<SameType<false, true>,         false>>,
        __Verify<__ExactType<SameType<A, A>,                true>>,
        __Verify<__ExactType<SameType<A, B>,                false>>,
        __Verify<__ExactType<SameType<Ab, Ba>,              false>>,
        __Verify<__ExactType<SameType<Ab, Ac>,              true>>,
        __Verify<__ExactType<SameType<true, any>,           true>>,
        __Verify<__ExactType<SameType<true, never>,         false>>,
        __Verify<__ExactType<SameType<true, unknown>,       false>>,
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
        __Verify<__ExactType<SameTypes<never>,              never>>,
        __Verify<__ExactType<SameTypes<[]>,                 never>>,
        __Verify<__ExactType<SameTypes<[any, any]>,         true>>,
        __Verify<__ExactType<SameTypes<[never, never]>,     true>>,
        __Verify<__ExactType<SameTypes<[unknown, unknown]>, true>>,
        __Verify<__ExactType<SameTypes<[any, true]>,        true>>,
        __Verify<__ExactType<SameTypes<[never, true]>,      false>>,
        __Verify<__ExactType<SameTypes<[unknown, true]>,    false>>,
        __Verify<__ExactType<SameTypes<[true, true]>,       true>>,
        __Verify<__ExactType<SameTypes<[false, true]>,      false>>,
        __Verify<__ExactType<SameTypes<[A, A]>,             true>>,
        __Verify<__ExactType<SameTypes<[A, B]>,             false>>,
        __Verify<__ExactType<SameTypes<[Ab, Ba]>,           false>>,
        __Verify<__ExactType<SameTypes<[Ab, Ac]>,           true>>,
        __Verify<__ExactType<SameTypes<[true, any]>,        true>>,
        __Verify<__ExactType<SameTypes<[true, never]>,      false>>,
        __Verify<__ExactType<SameTypes<[true, unknown]>,    false>>,
    ];
}
// #endregion SameTypes tests

// #region Relatable tests
{
    type _ = [
        __Verify<__ExactType<Relatable<any, any>,        true>>,
        __Verify<__ExactType<Relatable<any, any>,        true>>,
        __Verify<__ExactType<Relatable<any, number>,     true>>,
        __Verify<__ExactType<Relatable<number, any>,     true>>,
        __Verify<__ExactType<Relatable<number, number>,  true>>,
        __Verify<__ExactType<Relatable<number, 1>,       true>>,
        __Verify<__ExactType<Relatable<1, number>,       true>>,
        __Verify<__ExactType<Relatable<1, 2>,            false>>,
        __Verify<__ExactType<Relatable<1 | 2, 3 | 4>,    false>>,
        __Verify<__ExactType<Relatable<1 | 2, 2 | 3>,    false>>,
        __Verify<__ExactType<Relatable<never, any>,      false>>,
        __Verify<__ExactType<Relatable<any, never>,      false>>,
        __Verify<__ExactType<Relatable<never, never>,    false>>,
    ];
}
// #endregion Relatable tests

// #region Overlaps tests
{
    type _ = [
        __Verify<__ExactType<Overlaps<any, any>,        true>>,
        __Verify<__ExactType<Overlaps<any, any>,        true>>,
        __Verify<__ExactType<Overlaps<any, number>,     true>>,
        __Verify<__ExactType<Overlaps<number, any>,     true>>,
        __Verify<__ExactType<Overlaps<number, number>,  true>>,
        __Verify<__ExactType<Overlaps<number, 1>,       true>>,
        __Verify<__ExactType<Overlaps<1, number>,       true>>,
        __Verify<__ExactType<Overlaps<1, 2>,            false>>,
        __Verify<__ExactType<Overlaps<1 | 2, 3 | 4>,    false>>,
        __Verify<__ExactType<Overlaps<1 | 2, 2 | 3>,    true>>,
        __Verify<__ExactType<Overlaps<never, any>,      false>>,
        __Verify<__ExactType<Overlaps<any, never>,      false>>,
        __Verify<__ExactType<Overlaps<never, never>,    false>>,
    ];
}
// #endregion Overlaps tests

// #region IsSubsetOf tests
{
    type _ = [
        __Verify<__ExactType<IsSubsetOf<any, any>,            boolean>>,
        __Verify<__ExactType<IsSubsetOf<any, 1>,              boolean>>,
        __Verify<__ExactType<IsSubsetOf<1, any>,              boolean>>,
        __Verify<__ExactType<IsSubsetOf<never, never>,        true>>,
        __Verify<__ExactType<IsSubsetOf<never, 1>,            true>>,
        __Verify<__ExactType<IsSubsetOf<1, never>,            false>>,
        __Verify<__ExactType<IsSubsetOf<unknown, unknown>,    false>>,
        __Verify<__ExactType<IsSubsetOf<unknown, 1>,          false>>,
        __Verify<__ExactType<IsSubsetOf<1, unknown>,          true>>,
        __Verify<__ExactType<IsSubsetOf<number, number>,      true>>,
        __Verify<__ExactType<IsSubsetOf<1, 1>,                true>>,
        __Verify<__ExactType<IsSubsetOf<1, number>,           true>>,
        __Verify<__ExactType<IsSubsetOf<1, 1 | 2>,            true>>,
        __Verify<__ExactType<IsSubsetOf<number, 1>,           false>>,
        __Verify<__ExactType<IsSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsSupersetOf tests
{
    type _ = [
        __Verify<__ExactType<IsSupersetOf<any, any>,            boolean>>,
        __Verify<__ExactType<IsSupersetOf<any, 1>,              boolean>>,
        __Verify<__ExactType<IsSupersetOf<1, any>,              boolean>>,
        __Verify<__ExactType<IsSupersetOf<never, never>,        true>>,
        __Verify<__ExactType<IsSupersetOf<never, 1>,            false>>,
        __Verify<__ExactType<IsSupersetOf<1, never>,            true>>,
        __Verify<__ExactType<IsSupersetOf<unknown, unknown>,    false>>,
        __Verify<__ExactType<IsSupersetOf<unknown, 1>,          true>>,
        __Verify<__ExactType<IsSupersetOf<1, unknown>,          false>>,
        __Verify<__ExactType<IsSupersetOf<number, number>,      true>>,
        __Verify<__ExactType<IsSupersetOf<1, 1>,                true>>,
        __Verify<__ExactType<IsSupersetOf<1, number>,           false>>,
        __Verify<__ExactType<IsSupersetOf<1, 1 | 2>,            false>>,
        __Verify<__ExactType<IsSupersetOf<number, 1>,           true>>,
        __Verify<__ExactType<IsSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsProperSubsetOf tests
{
    type _ = [
        __Verify<__ExactType<IsProperSubsetOf<any, any>,            boolean>>,
        __Verify<__ExactType<IsProperSubsetOf<any, 1>,              boolean>>,
        __Verify<__ExactType<IsProperSubsetOf<1, any>,              boolean>>,
        __Verify<__ExactType<IsProperSubsetOf<never, never>,        false>>,
        __Verify<__ExactType<IsProperSubsetOf<never, 1>,            true>>,
        __Verify<__ExactType<IsProperSubsetOf<1, never>,            false>>,
        __Verify<__ExactType<IsProperSubsetOf<unknown, unknown>,    false>>,
        __Verify<__ExactType<IsProperSubsetOf<unknown, 1>,          false>>,
        __Verify<__ExactType<IsProperSubsetOf<1, unknown>,          true>>,
        __Verify<__ExactType<IsProperSubsetOf<number, number>,      false>>,
        __Verify<__ExactType<IsProperSubsetOf<1, 1>,                false>>,
        __Verify<__ExactType<IsProperSubsetOf<1, number>,           true>>,
        __Verify<__ExactType<IsProperSubsetOf<1, 1 | 2>,            true>>,
        __Verify<__ExactType<IsProperSubsetOf<number, 1>,           false>>,
        __Verify<__ExactType<IsProperSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsProperSubsetOf tests

// #region IsProperSupersetOf tests
{
    type _ = [
        __Verify<__ExactType<IsProperSupersetOf<any, any>,            boolean>>,
        __Verify<__ExactType<IsProperSupersetOf<any, 1>,              boolean>>,
        __Verify<__ExactType<IsProperSupersetOf<1, any>,              boolean>>,
        __Verify<__ExactType<IsProperSupersetOf<never, never>,        false>>,
        __Verify<__ExactType<IsProperSupersetOf<never, 1>,            false>>,
        __Verify<__ExactType<IsProperSupersetOf<1, never>,            true>>,
        __Verify<__ExactType<IsProperSupersetOf<unknown, unknown>,    false>>,
        __Verify<__ExactType<IsProperSupersetOf<unknown, 1>,          true>>,
        __Verify<__ExactType<IsProperSupersetOf<1, unknown>,          false>>,
        __Verify<__ExactType<IsProperSupersetOf<number, number>,      false>>,
        __Verify<__ExactType<IsProperSupersetOf<1, 1>,                false>>,
        __Verify<__ExactType<IsProperSupersetOf<1, number>,           false>>,
        __Verify<__ExactType<IsProperSupersetOf<1, 1 | 2>,            false>>,
        __Verify<__ExactType<IsProperSupersetOf<number, 1>,           true>>,
        __Verify<__ExactType<IsProperSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsProperSupersetOf tests

// #region MatchingKeys tests
{
    type A = { a: number, b: string, c: number };
    type _ = [
        __Verify<__ExactType<MatchingKeys<A, number>, "a" | "c">>,
        __Verify<__ExactType<MatchingKeys<A, string>, "b">>,
        __Verify<__ExactType<MatchingKeys<A, boolean>, never>>,
    ];
}
// #endregion MatchingKeys tests

// #region FunctionKeys tests
{
    type A = { a(x: string): void, b(x: number): void, c(): void, d: new () => any };
    type _ = [
        __Verify<__ExactType<FunctionKeys<A>,                       "a" | "b" | "c" | "d">>,
        __Verify<__ExactType<FunctionKeys<A, () => void>,           "c">>,
        __Verify<__ExactType<FunctionKeys<A, (x: string) => void>,  "a" | "c">>,
        __Verify<__ExactType<FunctionKeys<A, (x: number) => void>,  "b" | "c">>,
        __Verify<__ExactType<FunctionKeys<A, Constructor>,          "d">>,
    ];
}
// #endregion FunctionKeys tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Await tests
// {
//     type _ = [
//         __Verify<__ExactType<Await<number>,                   number>>,
//         __Verify<__ExactType<Await<Promise<number>>,          number>>,
//         __Verify<__ExactType<Await<Promise<Promise<number>>>, number>>,
//     ];
// }
// // #endregion Await tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region AwaitAll tests
// {
//     type _ = [
//         __Verify<__ExactType<AwaitAll<[]>,                          []>>,
//         __Verify<__ExactType<AwaitAll<[number]>,                    [number]>>,
//         __Verify<__ExactType<AwaitAll<[Promise<number>]>,           [number]>>,
//         __Verify<__ExactType<AwaitAll<[Promise<number>, number]>,   [number, number]>>,
//     ];
// }
// // #endregion AwaitAll tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Shift tests
// {
//     type _ = [
//         __Verify<__ExactType<Shift<[1, 2, 3]>,  [1, [2, 3]]>>,
//         __Verify<__ExactType<Shift<[1, 2]>,     [1, [2]]>>,
//         __Verify<__ExactType<Shift<[1]>,        [1, []]>>,
//         __Verify<__ExactType<Shift<[]>,         [never, never]>>,
//     ];
// }
// // #endregion Shift tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Unshift tests
// {
//     type _ = [
//         __Verify<__ExactType<Unshift<[1, 2], 3>,    [3, 1, 2]>>,
//         __Verify<__ExactType<Unshift<[1], 2>,       [2, 1]>>,
//         __Verify<__ExactType<Unshift<[], 1>,        [1]>>,
//         __Verify<__ExactType<Unshift<never, 1>,     never>>,
//     ];
// }
// // #endregion Unshift tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Reverse tests
// {
//     type _ = [
//         __Verify<__ExactType<Reverse<[1, 2, 3]>,        [3, 2, 1]>>,
//         __Verify<__ExactType<Reverse<[1, 2]>,           [2, 1]>>,
//         __Verify<__ExactType<Reverse<[1]>,              [1]>>,
//         __Verify<__ExactType<Reverse<[]>,               []>>,
//         __Verify<__ExactType<Reverse<[1, ...number[]]>, [1]>>,
//         __Verify<__ExactType<Reverse<never>,            never>>,
//     ];
// }
// // #endregion Reverse tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Pop tests
// {
//     type _ = [
//         __Verify<__ExactType<Pop<[1, 2, 3]>,   [3, [1, 2]]>>,
//         __Verify<__ExactType<Pop<[1, 2]>,      [2, [1]]>>,
//         __Verify<__ExactType<Pop<[1]>,         [1, []]>>,
//         __Verify<__ExactType<Pop<[]>,          [never, never]>>,
//     ];
// }
// // #endregion Pop tests

// TODO(rbuckton): Depends on recursion in object types, which is currently unsafe.
// // #region Push tests
// {
//     type _ = [
//         __Verify<__ExactType<Push<[1, 2], 3>,   [1, 2, 3]>>,
//         __Verify<__ExactType<Push<[1], 2>,      [1, 2]>>,
//         __Verify<__ExactType<Push<[], 1>,       [1]>>,
//         __Verify<__ExactType<Push<never, 1>,    never>>,
//     ]
// }
// // #endregion Push tests

// #region Disjoin tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };
    type AandB = A & B;
    type AorB = A | B;
    type _ = [
        __Verify<__ExactType<Disjoin<AB>,       AorB>>,
        __Verify<__ExactType<Disjoin<AandB>,    AorB>>,
        __Verify<__ExactType<Disjoin<A>,        A>>,
        __Verify<__ExactType<Disjoin<{}>,       {}>>,
        __Verify<__ExactType<Disjoin<never>,    never>>,
        __Verify<__ExactType<Disjoin<any>,      any>>,
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
        __Verify<__ExactType<T1, AB>>,
    ];
}
// #endregion Conjoin tests

// #region DisjoinOverlaps tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };
    type _ = [
        __Verify<__ExactType<DisjoinOverlaps<any, any>,         true>>,
        __Verify<__ExactType<DisjoinOverlaps<any, any>,         true>>,
        __Verify<__ExactType<DisjoinOverlaps<any, number>,      true>>,
        __Verify<__ExactType<DisjoinOverlaps<number, any>,      true>>,
        __Verify<__ExactType<DisjoinOverlaps<number, number>,   true>>,
        __Verify<__ExactType<DisjoinOverlaps<number, 1>,        true>>,
        __Verify<__ExactType<DisjoinOverlaps<1, number>,        true>>,
        __Verify<__ExactType<DisjoinOverlaps<1, 2>,             false>>,
        __Verify<__ExactType<DisjoinOverlaps<1 | 2, 3 | 4>,     false>>,
        __Verify<__ExactType<DisjoinOverlaps<1 | 2, 2 | 3>,     true>>,
        __Verify<__ExactType<DisjoinOverlaps<A, B>,             false>>,
        __Verify<__ExactType<DisjoinOverlaps<A, AB>,            true>>,
        __Verify<__ExactType<DisjoinOverlaps<AB, B>,            true>>,
        __Verify<__ExactType<DisjoinOverlaps<never, any>,       false>>,
        __Verify<__ExactType<DisjoinOverlaps<any, never>,       false>>,
        __Verify<__ExactType<DisjoinOverlaps<never, never>,     false>>,
    ];
}
// #endregion DisjoinOverlaps tests

// #region IsEmpty tests
declare const testSymbol: unique symbol;
{
    type _ = [
        __Verify<__ExactType<IsEmpty<{}>, true>>,
        __Verify<__ExactType<IsEmpty<{ a: number }>, false>>,
        __Verify<__ExactType<IsEmpty<{ [a: number]: any }>, false>>,
        __Verify<__ExactType<IsEmpty<{ [testSymbol]: any }>, false>>,
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
        __Verify<__ExactType<Diff<AB, B>, A>>,
        __Verify<__ExactType<Diff<AB, B2>, A>>,
        __Verify<__ExactType<Diff<ABC, B>, AC>>,
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
        __Verify<__ExactType<Intersect<AB1, AC>,    A>>,
        __Verify<__ExactType<Intersect<AB1, AB2>,   AB1and2>>,
        __Verify<__ExactType<Intersect<A, B>,       {}>>,
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

    type T = Assign<AB, B2>;
    type _ = [
        __Verify<__ExactType<Assign<A, B>,      AB>>,
        __Verify<__ExactType<Assign<AB, AC>,    ABC>>,
        __Verify<__ExactType<Assign<AB, C>,     ABC>>,
        __Verify<__ExactType<Assign<A, BC>,     ABC>>,
        __Verify<__ExactType<Assign<B, ABC>,    ABC>>,
        __Verify<__ExactType<Assign<AB, B2>,    AB2>>,
    ];
}
// #endregion Assign tests


// #region Test helper types
type __Verify<T extends { ok: true }> = T;
type __ExactType<Actual, Expected> =
    IsNever<Expected> extends true ? { ok: IsNever<Actual>, actual: Actual, expected: Expected } :
    IsNever<Actual> extends true ? { ok: IsNever<Expected>, actual: Actual, expected: Expected } :
    IsAny<Expected> extends true ? { ok: IsAny<Actual>, actual: Actual, expected: Expected } :
    IsAny<Actual> extends true ? { ok: IsAny<Expected>, actual: Actual, expected: Expected } :
    [Expected, Actual] extends [Actual, Expected] ? { ok: true, actual: Actual, expected: Expected } :
    { ok: false, actual: Actual, expected: Expected };
// #endregion Test helper types
