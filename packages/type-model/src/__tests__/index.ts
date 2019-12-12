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
        __Test<__ExpectType<IteratedType<Iterable<number>>, number>>,
        __Test<__ExpectType<IteratedType<Generator<number>>, number>>,
        // post TS 3.6 behavior
        __Test<__ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: false, value: number } } }>, number>>, 
        __Test<__ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done?: false, value: number } } }>, number>>,
        __Test<__ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { value: number } } }>, number>>,
        __Test<__ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: true, value: number } } }>, never>>,
        // pre TS 3.6 behavior
        __Test<__ExpectType<IteratedType<{ [Symbol.iterator](): { next(): { done: boolean, value: number } } }>, number>>,
    ];
}
// #endregion IteratedType tests

// #region GeneratorReturnType tests
{
    type _ = [
        __Test<__ExpectType<GeneratorReturnType<Iterable<number>>, any>>,
        __Test<__ExpectType<GeneratorReturnType<Generator<number, string, boolean>>, string>>,
        __Test<__ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: true, value: number } } }>, number>>,
        __Test<__ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: false, value: number } } }>, never>>,
        __Test<__ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done: boolean, value: number } } }>, number>>,
        __Test<__ExpectType<GeneratorReturnType<{ [Symbol.iterator](): { next(): { done?: false, value: number } } }>, never>>,
    ];
}
// #endregion GeneratorReturnType tests

// #region GeneratorNextType tests
{
    type _ = [
        __Test<__ExpectType<GeneratorNextType<Iterable<number>>, undefined>>,
        __Test<__ExpectType<GeneratorNextType<Generator<"a", "b", number>>, number>>,
        __Test<__ExpectType<GeneratorNextType<{ [Symbol.iterator](): { next(value?: number): any } }>, number>>,
    ];
}
// #endregion GeneratorNextType tests

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
        __Test<__ExpectType<PromisedType<number>, never>>,
        __Test<__ExpectType<PromisedType<{ then(): any }>, never>>,
        __Test<__ExpectType<PromisedType<{ then(cb: (x: number) => void): any }>, number>>,
        __Test<__ExpectType<PromisedType<Promise<Promise<number>>>, Promise<number>>>,
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
        __Test<__ExpectType<IsAny<any>,        true>>,
        __Test<__ExpectType<IsAny<never>,      false>>,
        __Test<__ExpectType<IsAny<unknown>,    false>>,
        __Test<__ExpectType<IsAny<number>,     false>>,
    ];
}
// #endregion IsAny tests

// #region IsNever tests
{
    type _ = [
        __Test<__ExpectType<IsNever<never>,    true>>,
        __Test<__ExpectType<IsNever<any>,      false>>,
        __Test<__ExpectType<IsNever<unknown>,  false>>,
        __Test<__ExpectType<IsNever<number>,   false>>,
    ];
}
// #endregion IsNever tests

// #region IsUnion tests
{
    const enum E { One, Two }
    type _ = [
        __Test<__ExpectType<IsUnion<never>,    false>>,
        __Test<__ExpectType<IsUnion<any>,      false>>,
        __Test<__ExpectType<IsUnion<1>,        false>>,
        __Test<__ExpectType<IsUnion<1 | 2>,    true>>,
        __Test<__ExpectType<IsUnion<number>,   false>>,
        __Test<__ExpectType<IsUnion<boolean>,  true>>,
        __Test<__ExpectType<IsUnion<E>,        true>>,
    ];
}
// #endregion IsUnion tests


// #region IsCallable tests
{
    type A = { (): void, new (): void };
    type _ = [
        __Test<__ExpectType<IsCallable<any>,               boolean>>,
        __Test<__ExpectType<IsCallable<never>,             never>>,
        __Test<__ExpectType<IsCallable<string>,            false>>,
        __Test<__ExpectType<IsCallable<{}>,                false>>,
        __Test<__ExpectType<IsCallable<Function>,          true>>,
        __Test<__ExpectType<IsCallable<() => void>,        true>>,
        __Test<__ExpectType<IsCallable<new () => void>,    false>>,
        __Test<__ExpectType<IsCallable<A>,                 true>>,
    ];
}
// #endregion IsCallable tests

// #region IsConstructable tests
{
    type A = { (): void, new (): void };
    type _ = [
        __Test<__ExpectType<IsConstructable<any>,              boolean>>,
        __Test<__ExpectType<IsConstructable<never>,            never>>,
        __Test<__ExpectType<IsConstructable<string>,           false>>,
        __Test<__ExpectType<IsConstructable<{}>,               false>>,
        __Test<__ExpectType<IsConstructable<Function>,         true>>,
        __Test<__ExpectType<IsConstructable<new () => void>,   true>>,
        __Test<__ExpectType<IsConstructable<() => void>,       false>>,
        __Test<__ExpectType<IsConstructable<A>,                true>>,
    ];
}
// #endregion IsConstructable tests

// #region IsUnknown tests
{
    type _ = [
        __Test<__ExpectType<IsUnknown<unknown>, true>>,
        __Test<__ExpectType<IsUnknown<never>,   false>>,
        __Test<__ExpectType<IsUnknown<any>,     false>>,
        __Test<__ExpectType<IsUnknown<1>,       false>>,
    ];
}
// #endregion IsUnknown tests

// #region IsSubtypeOf tests
{
    type _ = [
        __Test<__ExpectType<IsSubtypeOf<never, never>,     true>>,
        __Test<__ExpectType<IsSubtypeOf<never, 1>,         true>>,
        __Test<__ExpectType<IsSubtypeOf<1, never>,         false>>,
        __Test<__ExpectType<IsSubtypeOf<any, any>,         true>>,
        __Test<__ExpectType<IsSubtypeOf<any, 1>,           true>>,
        __Test<__ExpectType<IsSubtypeOf<1, any>,           true>>,
        __Test<__ExpectType<IsSubtypeOf<unknown, unknown>, true>>,
        __Test<__ExpectType<IsSubtypeOf<unknown, 1>,       false>>,
        __Test<__ExpectType<IsSubtypeOf<1, unknown>,       true>>,
    ];
}
// #endregion IsSubtypeOf tests

// #region Not tests
{
    type _ = [
        __Test<__ExpectType<Not<true>,     false>>,
        __Test<__ExpectType<Not<false>,    true>>,
        __Test<__ExpectType<Not<boolean>,  boolean>>,
        __Test<__ExpectType<Not<any>,      boolean>>,
        __Test<__ExpectType<Not<never>,    never>>,
    ];
}
// #endregion Not tests

// #region And tests
{
    type _ = [
        __Test<__ExpectType<And<true, true>,       true>>,
        __Test<__ExpectType<And<false, false>,     false>>,
        __Test<__ExpectType<And<true, false>,      false>>,
        __Test<__ExpectType<And<false, true>,      false>>,
        __Test<__ExpectType<And<boolean, true>,    boolean>>,
        __Test<__ExpectType<And<boolean, false>,   false>>,
        __Test<__ExpectType<And<true, boolean>,    boolean>>,
        __Test<__ExpectType<And<false, boolean>,   false>>,
        __Test<__ExpectType<And<boolean, boolean>, boolean>>,
        __Test<__ExpectType<And<any, true>,        boolean>>,
        __Test<__ExpectType<And<any, false>,       false>>,
        __Test<__ExpectType<And<true, any>,        boolean>>,
        __Test<__ExpectType<And<false, any>,       false>>,
        __Test<__ExpectType<And<any, any>,         boolean>>,
        __Test<__ExpectType<And<never, true>,      never>>,
        __Test<__ExpectType<And<never, false>,     never>>,
        __Test<__ExpectType<And<true, never>,      never>>,
        __Test<__ExpectType<And<false, never>,     never>>,
        __Test<__ExpectType<And<never, never>,     never>>,
    ];
}
// #endregion And tests

// #region Or tests
{
    type _ = [
        __Test<__ExpectType<Or<true, true>,        true>>,
        __Test<__ExpectType<Or<false, false>,      false>>,
        __Test<__ExpectType<Or<true, false>,       true>>,
        __Test<__ExpectType<Or<false, true>,       true>>,
        __Test<__ExpectType<Or<boolean, true>,     true>>,
        __Test<__ExpectType<Or<boolean, false>,    boolean>>,
        __Test<__ExpectType<Or<true, boolean>,     true>>,
        __Test<__ExpectType<Or<false, boolean>,    boolean>>,
        __Test<__ExpectType<Or<boolean, boolean>,  boolean>>,
        __Test<__ExpectType<Or<any, true>,         true>>,
        __Test<__ExpectType<Or<any, false>,        boolean>>,
        __Test<__ExpectType<Or<true, any>,         true>>,
        __Test<__ExpectType<Or<false, any>,        boolean>>,
        __Test<__ExpectType<Or<any, any>,          boolean>>,
        __Test<__ExpectType<Or<never, true>,       never>>,
        __Test<__ExpectType<Or<never, false>,      never>>,
        __Test<__ExpectType<Or<true, never>,       never>>,
        __Test<__ExpectType<Or<false, never>,      never>>,
        __Test<__ExpectType<Or<never, never>,      never>>,
    ];
}
// #endregion Or tests

// #region XOr tests
{
    type _ = [
        __Test<__ExpectType<XOr<true, true>,       false>>,
        __Test<__ExpectType<XOr<false, false>,     false>>,
        __Test<__ExpectType<XOr<true, false>,      true>>,
        __Test<__ExpectType<XOr<false, true>,      true>>,
        __Test<__ExpectType<XOr<boolean, true>,    boolean>>,
        __Test<__ExpectType<XOr<boolean, false>,   boolean>>,
        __Test<__ExpectType<XOr<true, boolean>,    boolean>>,
        __Test<__ExpectType<XOr<false, boolean>,   boolean>>,
        __Test<__ExpectType<XOr<boolean, boolean>, boolean>>,
        __Test<__ExpectType<XOr<any, true>,        boolean>>,
        __Test<__ExpectType<XOr<any, false>,       boolean>>,
        __Test<__ExpectType<XOr<true, any>,        boolean>>,
        __Test<__ExpectType<XOr<false, any>,       boolean>>,
        __Test<__ExpectType<XOr<any, any>,         boolean>>,
        __Test<__ExpectType<XOr<never, true>,      never>>,
        __Test<__ExpectType<XOr<never, false>,     never>>,
        __Test<__ExpectType<XOr<true, never>,      never>>,
        __Test<__ExpectType<XOr<false, never>,     never>>,
        __Test<__ExpectType<XOr<never, never>,     never>>,
    ];
}
// #endregion XOr tests

// #region Every tests
{
    type _ = [
        __Test<__ExpectType<Every<[true, true]>,           true>>,
        __Test<__ExpectType<Every<[true, true, true]>,     true>>,
        __Test<__ExpectType<Every<[true, true, false]>,    false>>,
        __Test<__ExpectType<Every<[false, false]>,         false>>,
        __Test<__ExpectType<Every<[true, false]>,          false>>,
        __Test<__ExpectType<Every<[false, true]>,          false>>,
        __Test<__ExpectType<Every<[boolean, true]>,        boolean>>,
        __Test<__ExpectType<Every<[boolean, false]>,       false>>,
        __Test<__ExpectType<Every<[true, boolean]>,        boolean>>,
        __Test<__ExpectType<Every<[false, boolean]>,       false>>,
        __Test<__ExpectType<Every<[boolean, boolean]>,     boolean>>,
        __Test<__ExpectType<Every<[any, true]>,            boolean>>,
        __Test<__ExpectType<Every<[any, false]>,           false>>,
        __Test<__ExpectType<Every<[true, any]>,            boolean>>,
        __Test<__ExpectType<Every<[false, any]>,           false>>,
        __Test<__ExpectType<Every<[any, any]>,             boolean>>,
        __Test<__ExpectType<Every<[never, true]>,          never>>,
        __Test<__ExpectType<Every<[never, false]>,         never>>,
        __Test<__ExpectType<Every<[true, never]>,          never>>,
        __Test<__ExpectType<Every<[false, never]>,         never>>,
        __Test<__ExpectType<Every<[never, never]>,         never>>,
        __Test<__ExpectType<Every<[]>,                     never>>,
    ]
}
// #endregion Every tests

// #region Some tests
{
    type _ = [
        __Test<__ExpectType<Some<[true, true]>,        true>>,
        __Test<__ExpectType<Some<[false, false]>,      false>>,
        __Test<__ExpectType<Some<[true, false]>,       true>>,
        __Test<__ExpectType<Some<[false, true]>,       true>>,
        __Test<__ExpectType<Some<[boolean, true]>,     true>>,
        __Test<__ExpectType<Some<[boolean, false]>,    boolean>>,
        __Test<__ExpectType<Some<[true, boolean]>,     true>>,
        __Test<__ExpectType<Some<[false, boolean]>,    boolean>>,
        __Test<__ExpectType<Some<[boolean, boolean]>,  boolean>>,
        __Test<__ExpectType<Some<[any, true]>,         true>>,
        __Test<__ExpectType<Some<[any, false]>,        boolean>>,
        __Test<__ExpectType<Some<[true, any]>,         true>>,
        __Test<__ExpectType<Some<[false, any]>,        boolean>>,
        __Test<__ExpectType<Some<[any, any]>,          boolean>>,
        __Test<__ExpectType<Some<[never, true]>,       never>>,
        __Test<__ExpectType<Some<[never, false]>,      never>>,
        __Test<__ExpectType<Some<[true, never]>,       never>>,
        __Test<__ExpectType<Some<[false, never]>,      never>>,
        __Test<__ExpectType<Some<[never, never]>,      never>>,
        __Test<__ExpectType<Some<[]>,                  never>>,
    ]
}
// #endregion Some tests

// #region One tests
{
    type _ = [
        __Test<__ExpectType<One<[true, true]>,       false>>,
        __Test<__ExpectType<One<[false, false]>,     false>>,
        __Test<__ExpectType<One<[true, false]>,      true>>,
        __Test<__ExpectType<One<[false, true]>,      true>>,
        __Test<__ExpectType<One<[boolean, true]>,    boolean>>,
        __Test<__ExpectType<One<[boolean, false]>,   boolean>>,
        __Test<__ExpectType<One<[true, boolean]>,    boolean>>,
        __Test<__ExpectType<One<[false, boolean]>,   boolean>>,
        __Test<__ExpectType<One<[boolean, boolean]>, boolean>>,
        __Test<__ExpectType<One<[any, true]>,        boolean>>,
        __Test<__ExpectType<One<[any, false]>,       boolean>>,
        __Test<__ExpectType<One<[true, any]>,        boolean>>,
        __Test<__ExpectType<One<[false, any]>,       boolean>>,
        __Test<__ExpectType<One<[any, any]>,         boolean>>,
        __Test<__ExpectType<One<[never, true]>,      never>>,
        __Test<__ExpectType<One<[never, false]>,     never>>,
        __Test<__ExpectType<One<[true, never]>,      never>>,
        __Test<__ExpectType<One<[false, never]>,     never>>,
        __Test<__ExpectType<One<[never, never]>,     never>>,
        __Test<__ExpectType<One<[]>,                 never>>,
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
        __Test<__ExpectType<SameType<any, any>,            true>>,
        __Test<__ExpectType<SameType<never, never>,        true>>,
        __Test<__ExpectType<SameType<unknown, unknown>,    true>>,
        __Test<__ExpectType<SameType<any, true>,           true>>,
        __Test<__ExpectType<SameType<never, true>,         false>>,
        __Test<__ExpectType<SameType<unknown, true>,       false>>,
        __Test<__ExpectType<SameType<true, true>,          true>>,
        __Test<__ExpectType<SameType<false, true>,         false>>,
        __Test<__ExpectType<SameType<A, A>,                true>>,
        __Test<__ExpectType<SameType<A, B>,                false>>,
        __Test<__ExpectType<SameType<Ab, Ba>,              false>>,
        __Test<__ExpectType<SameType<Ab, Ac>,              true>>,
        __Test<__ExpectType<SameType<true, any>,           true>>,
        __Test<__ExpectType<SameType<true, never>,         false>>,
        __Test<__ExpectType<SameType<true, unknown>,       false>>,
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
        __Test<__ExpectType<SameTypes<never>,              never>>,
        __Test<__ExpectType<SameTypes<[]>,                 never>>,
        __Test<__ExpectType<SameTypes<[any, any]>,         true>>,
        __Test<__ExpectType<SameTypes<[never, never]>,     true>>,
        __Test<__ExpectType<SameTypes<[unknown, unknown]>, true>>,
        __Test<__ExpectType<SameTypes<[any, true]>,        true>>,
        __Test<__ExpectType<SameTypes<[never, true]>,      false>>,
        __Test<__ExpectType<SameTypes<[unknown, true]>,    false>>,
        __Test<__ExpectType<SameTypes<[true, true]>,       true>>,
        __Test<__ExpectType<SameTypes<[false, true]>,      false>>,
        __Test<__ExpectType<SameTypes<[A, A]>,             true>>,
        __Test<__ExpectType<SameTypes<[A, B]>,             false>>,
        __Test<__ExpectType<SameTypes<[Ab, Ba]>,           false>>,
        __Test<__ExpectType<SameTypes<[Ab, Ac]>,           true>>,
        __Test<__ExpectType<SameTypes<[true, any]>,        true>>,
        __Test<__ExpectType<SameTypes<[true, never]>,      false>>,
        __Test<__ExpectType<SameTypes<[true, unknown]>,    false>>,
    ];
}
// #endregion SameTypes tests

// #region Relatable tests
{
    type _ = [
        __Test<__ExpectType<Relatable<any, any>,        true>>,
        __Test<__ExpectType<Relatable<any, any>,        true>>,
        __Test<__ExpectType<Relatable<any, number>,     true>>,
        __Test<__ExpectType<Relatable<number, any>,     true>>,
        __Test<__ExpectType<Relatable<number, number>,  true>>,
        __Test<__ExpectType<Relatable<number, 1>,       true>>,
        __Test<__ExpectType<Relatable<1, number>,       true>>,
        __Test<__ExpectType<Relatable<1, 2>,            false>>,
        __Test<__ExpectType<Relatable<1 | 2, 3 | 4>,    false>>,
        __Test<__ExpectType<Relatable<1 | 2, 2 | 3>,    false>>,
        __Test<__ExpectType<Relatable<never, any>,      false>>,
        __Test<__ExpectType<Relatable<any, never>,      false>>,
        __Test<__ExpectType<Relatable<never, never>,    false>>,
    ];
}
// #endregion Relatable tests

// #region Overlaps tests
{
    type _ = [
        __Test<__ExpectType<Overlaps<any, any>,        true>>,
        __Test<__ExpectType<Overlaps<any, any>,        true>>,
        __Test<__ExpectType<Overlaps<any, number>,     true>>,
        __Test<__ExpectType<Overlaps<number, any>,     true>>,
        __Test<__ExpectType<Overlaps<number, number>,  true>>,
        __Test<__ExpectType<Overlaps<number, 1>,       true>>,
        __Test<__ExpectType<Overlaps<1, number>,       true>>,
        __Test<__ExpectType<Overlaps<1, 2>,            false>>,
        __Test<__ExpectType<Overlaps<1 | 2, 3 | 4>,    false>>,
        __Test<__ExpectType<Overlaps<1 | 2, 2 | 3>,    true>>,
        __Test<__ExpectType<Overlaps<never, any>,      false>>,
        __Test<__ExpectType<Overlaps<any, never>,      false>>,
        __Test<__ExpectType<Overlaps<never, never>,    false>>,
    ];
}
// #endregion Overlaps tests

// #region IsSubsetOf tests
{
    type _ = [
        __Test<__ExpectType<IsSubsetOf<any, any>,            boolean>>,
        __Test<__ExpectType<IsSubsetOf<any, 1>,              boolean>>,
        __Test<__ExpectType<IsSubsetOf<1, any>,              boolean>>,
        __Test<__ExpectType<IsSubsetOf<never, never>,        true>>,
        __Test<__ExpectType<IsSubsetOf<never, 1>,            true>>,
        __Test<__ExpectType<IsSubsetOf<1, never>,            false>>,
        __Test<__ExpectType<IsSubsetOf<unknown, unknown>,    false>>,
        __Test<__ExpectType<IsSubsetOf<unknown, 1>,          false>>,
        __Test<__ExpectType<IsSubsetOf<1, unknown>,          true>>,
        __Test<__ExpectType<IsSubsetOf<number, number>,      true>>,
        __Test<__ExpectType<IsSubsetOf<1, 1>,                true>>,
        __Test<__ExpectType<IsSubsetOf<1, number>,           true>>,
        __Test<__ExpectType<IsSubsetOf<1, 1 | 2>,            true>>,
        __Test<__ExpectType<IsSubsetOf<number, 1>,           false>>,
        __Test<__ExpectType<IsSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsSupersetOf tests
{
    type _ = [
        __Test<__ExpectType<IsSupersetOf<any, any>,            boolean>>,
        __Test<__ExpectType<IsSupersetOf<any, 1>,              boolean>>,
        __Test<__ExpectType<IsSupersetOf<1, any>,              boolean>>,
        __Test<__ExpectType<IsSupersetOf<never, never>,        true>>,
        __Test<__ExpectType<IsSupersetOf<never, 1>,            false>>,
        __Test<__ExpectType<IsSupersetOf<1, never>,            true>>,
        __Test<__ExpectType<IsSupersetOf<unknown, unknown>,    false>>,
        __Test<__ExpectType<IsSupersetOf<unknown, 1>,          true>>,
        __Test<__ExpectType<IsSupersetOf<1, unknown>,          false>>,
        __Test<__ExpectType<IsSupersetOf<number, number>,      true>>,
        __Test<__ExpectType<IsSupersetOf<1, 1>,                true>>,
        __Test<__ExpectType<IsSupersetOf<1, number>,           false>>,
        __Test<__ExpectType<IsSupersetOf<1, 1 | 2>,            false>>,
        __Test<__ExpectType<IsSupersetOf<number, 1>,           true>>,
        __Test<__ExpectType<IsSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsSubsetOf tests

// #region IsProperSubsetOf tests
{
    type _ = [
        __Test<__ExpectType<IsProperSubsetOf<any, any>,            boolean>>,
        __Test<__ExpectType<IsProperSubsetOf<any, 1>,              boolean>>,
        __Test<__ExpectType<IsProperSubsetOf<1, any>,              boolean>>,
        __Test<__ExpectType<IsProperSubsetOf<never, never>,        false>>,
        __Test<__ExpectType<IsProperSubsetOf<never, 1>,            true>>,
        __Test<__ExpectType<IsProperSubsetOf<1, never>,            false>>,
        __Test<__ExpectType<IsProperSubsetOf<unknown, unknown>,    false>>,
        __Test<__ExpectType<IsProperSubsetOf<unknown, 1>,          false>>,
        __Test<__ExpectType<IsProperSubsetOf<1, unknown>,          true>>,
        __Test<__ExpectType<IsProperSubsetOf<number, number>,      false>>,
        __Test<__ExpectType<IsProperSubsetOf<1, 1>,                false>>,
        __Test<__ExpectType<IsProperSubsetOf<1, number>,           true>>,
        __Test<__ExpectType<IsProperSubsetOf<1, 1 | 2>,            true>>,
        __Test<__ExpectType<IsProperSubsetOf<number, 1>,           false>>,
        __Test<__ExpectType<IsProperSubsetOf<1 | 2, 1>,            false>>,
    ];
}
// #endregion IsProperSubsetOf tests

// #region IsProperSupersetOf tests
{
    type _ = [
        __Test<__ExpectType<IsProperSupersetOf<any, any>,            boolean>>,
        __Test<__ExpectType<IsProperSupersetOf<any, 1>,              boolean>>,
        __Test<__ExpectType<IsProperSupersetOf<1, any>,              boolean>>,
        __Test<__ExpectType<IsProperSupersetOf<never, never>,        false>>,
        __Test<__ExpectType<IsProperSupersetOf<never, 1>,            false>>,
        __Test<__ExpectType<IsProperSupersetOf<1, never>,            true>>,
        __Test<__ExpectType<IsProperSupersetOf<unknown, unknown>,    false>>,
        __Test<__ExpectType<IsProperSupersetOf<unknown, 1>,          true>>,
        __Test<__ExpectType<IsProperSupersetOf<1, unknown>,          false>>,
        __Test<__ExpectType<IsProperSupersetOf<number, number>,      false>>,
        __Test<__ExpectType<IsProperSupersetOf<1, 1>,                false>>,
        __Test<__ExpectType<IsProperSupersetOf<1, number>,           false>>,
        __Test<__ExpectType<IsProperSupersetOf<1, 1 | 2>,            false>>,
        __Test<__ExpectType<IsProperSupersetOf<number, 1>,           true>>,
        __Test<__ExpectType<IsProperSupersetOf<1 | 2, 1>,            true>>,
    ];
}
// #endregion IsProperSupersetOf tests

// #region MatchingKeys tests
{
    type A = { a: number, b: string, c: number };
    type _ = [
        __Test<__ExpectType<MatchingKeys<A, number>, "a" | "c">>,
        __Test<__ExpectType<MatchingKeys<A, string>, "b">>,
        __Test<__ExpectType<MatchingKeys<A, boolean>, never>>,
    ];
}
// #endregion MatchingKeys tests

// #region FunctionKeys tests
{
    type A = { a(x: string): void, b(x: number): void, c(): void, d: new () => any };
    type _ = [
        __Test<__ExpectType<FunctionKeys<A>,                       "a" | "b" | "c" | "d">>,
        __Test<__ExpectType<FunctionKeys<A, () => void>,           "c">>,
        __Test<__ExpectType<FunctionKeys<A, (x: string) => void>,  "a" | "c">>,
        __Test<__ExpectType<FunctionKeys<A, (x: number) => void>,  "b" | "c">>,
        __Test<__ExpectType<FunctionKeys<A, Constructor>,          "d">>,
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
        __Test<__ExpectType<Disjoin<AB>,       AorB>>,
        __Test<__ExpectType<Disjoin<AandB>,    AorB>>,
        __Test<__ExpectType<Disjoin<A>,        A>>,
        __Test<__ExpectType<Disjoin<{}>,       {}>>,
        __Test<__ExpectType<Disjoin<never>,    never>>,
        __Test<__ExpectType<Disjoin<any>,      any>>,
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
        __Test<__ExpectType<T1, AB>>,
    ];
}
// #endregion Conjoin tests

// #region DisjoinOverlaps tests
{
    type A = { a: number };
    type B = { b: number };
    type AB = { a: number, b: number };
    type _ = [
        __Test<__ExpectType<DisjoinOverlaps<any, any>,         true>>,
        __Test<__ExpectType<DisjoinOverlaps<any, any>,         true>>,
        __Test<__ExpectType<DisjoinOverlaps<any, number>,      true>>,
        __Test<__ExpectType<DisjoinOverlaps<number, any>,      true>>,
        __Test<__ExpectType<DisjoinOverlaps<number, number>,   true>>,
        __Test<__ExpectType<DisjoinOverlaps<number, 1>,        true>>,
        __Test<__ExpectType<DisjoinOverlaps<1, number>,        true>>,
        __Test<__ExpectType<DisjoinOverlaps<1, 2>,             false>>,
        __Test<__ExpectType<DisjoinOverlaps<1 | 2, 3 | 4>,     false>>,
        __Test<__ExpectType<DisjoinOverlaps<1 | 2, 2 | 3>,     true>>,
        __Test<__ExpectType<DisjoinOverlaps<A, B>,             false>>,
        __Test<__ExpectType<DisjoinOverlaps<A, AB>,            true>>,
        __Test<__ExpectType<DisjoinOverlaps<AB, B>,            true>>,
        __Test<__ExpectType<DisjoinOverlaps<never, any>,       false>>,
        __Test<__ExpectType<DisjoinOverlaps<any, never>,       false>>,
        __Test<__ExpectType<DisjoinOverlaps<never, never>,     false>>,
    ];
}
// #endregion DisjoinOverlaps tests

// #region IsEmpty tests
declare const testSymbol: unique symbol;
{
    type _ = [
        __Test<__ExpectType<IsEmpty<{}>, true>>,
        __Test<__ExpectType<IsEmpty<{ a: number }>, false>>,
        __Test<__ExpectType<IsEmpty<{ [a: number]: any }>, false>>,
        __Test<__ExpectType<IsEmpty<{ [testSymbol]: any }>, false>>,
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
        __Test<__ExpectType<Diff<AB, B>, A>>,
        __Test<__ExpectType<Diff<AB, B2>, A>>,
        __Test<__ExpectType<Diff<ABC, B>, AC>>,
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
        __Test<__ExpectType<Intersect<AB1, AC>,    A>>,
        __Test<__ExpectType<Intersect<AB1, AB2>,   AB1and2>>,
        __Test<__ExpectType<Intersect<A, B>,       {}>>,
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
        __Test<__ExpectType<Assign<A, B>,      AB>>,
        __Test<__ExpectType<Assign<AB, AC>,    ABC>>,
        __Test<__ExpectType<Assign<AB, C>,     ABC>>,
        __Test<__ExpectType<Assign<A, BC>,     ABC>>,
        __Test<__ExpectType<Assign<B, ABC>,    ABC>>,
        __Test<__ExpectType<Assign<AB, B2>,    AB2>>,
    ];
}
// #endregion Assign tests


// #region Test helper types
type __Test<T extends { pass: true }> = T;
type __ExpectType<Actual, Expected> =
    IsNever<Expected> extends true ? IsNever<Actual> extends true ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
    IsNever<Actual> extends true ? { pass: false, Expected: Expected, Actual: Actual } :
    IsAny<Expected> extends true ? IsAny<Actual> extends true ? { pass: true } : { pass: false, Expected: Expected, Actual: Actual } :
    IsAny<Actual> extends true ? { pass: false, Expected: Expected, Actual: Actual } :
    [Expected, Actual] extends [Actual, Expected] ? { pass: true } :
    { pass: false, Expected: Expected, Actual: Actual };
// #endregion Test helper types
