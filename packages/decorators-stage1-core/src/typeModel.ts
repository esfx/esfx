import { SameType, And, IsNever, Some, Not, SameTypes, Every, IsSubtypeOf } from "@esfx/type-model";
import { ClassDescriptor, MemberDescriptor, ParameterDescriptor, DecoratorDescriptor } from ".";

type TOrVoidClassDecoratorSignature<A extends any[] = any[]> = (<T extends Function>(descriptor: ClassDescriptor<T>, ...args: A) => T | void) | never;
type TClassDecoratorSignature<A extends any[] = any[]> = (<T extends Function>(descriptor: ClassDescriptor<T>, ...args: A) => T) | never;
type VoidClassDecoratorSignature<A extends any[] = any[]> = ((descriptor: ClassDescriptor, ...args: A) => void) | never;
type VoidMemberDecoratorSignature<A extends any[] = any[]> = ((descriptor: MemberDescriptor, ...args: A) => void) | never;
type VoidParameterDecoratorSignature<A extends any[] = any[]> = ((descriptor: ParameterDescriptor, ...args: A) => void) | never;

type ClassDecoratorSignature<A extends any[] = any[]> =
    | TOrVoidClassDecoratorSignature<A>
    | TClassDecoratorSignature<A>
    | VoidClassDecoratorSignature<A>;

type MemberDecoratorSignature<A extends any[] = any[]> =
    | VoidMemberDecoratorSignature<A>;

type ParameterDecoratorSignature<A extends any[] = any[]> =
    | VoidParameterDecoratorSignature<A>;

export type DecoratorSignature<A extends any[] = any[]> =
    | ClassDecoratorSignature<A>
    | MemberDecoratorSignature<A>
    | ParameterDecoratorSignature<A>;

type ExtractSignature<
    D extends DecoratorDescriptor,
    S extends DecoratorSignature,
    D1 = D extends ClassDescriptor ? MemberDescriptor : D extends MemberDescriptor ? ParameterDescriptor : ClassDescriptor,
    D2 = Exclude<DecoratorDescriptor, D | D1>,
> =
    S extends {
        (d: D, ...a: infer A): infer R;
        (d: D1, ...a: any): any;
        (d: D2, ...a: any): any;
    } ? [A, R] :
    S extends {
        (d: D, ...a: infer A): infer R;
        (d: D1, ...a: any): any;
    } ? [A, R] :
    S extends {
        (d: D, ...a: infer A): infer R;
        (d: D2, ...a: any): any;
    } ? [A, R] :
    S extends {
        (d: D, ...a: infer A): infer R;
    } ? [A, R] :
    [never, never];

type ExtractClassDecoratorSignature<
    S extends DecoratorSignature<any>,
    E extends [any[], any] = ExtractSignature<ClassDescriptor, S>,
> =
    [E[1]] extends [void] ? VoidClassDecoratorSignature<E[0]> :
    [void] extends [E[1]] ? TOrVoidClassDecoratorSignature<E[0]> :
    TClassDecoratorSignature<E[0]>;

type ExtractMemberDecoratorSignature<
    S extends DecoratorSignature<any>,
    E extends [any[], any] = ExtractSignature<MemberDescriptor, S>,
> = VoidMemberDecoratorSignature<E[0]>;

type ExtractParameterDecoratorSignature<
    S extends DecoratorSignature<any>,
    E extends [any[], any] = ExtractSignature<ParameterDescriptor, S>,
> = VoidParameterDecoratorSignature<E[0]>;

type T1 = __MappedDecoratorSignature<{
    (descriptor: ClassDescriptor, message?: string, error?: boolean): Function | void;
    (descriptor: MemberDescriptor, message?: string, error?: boolean): void;
}, []>;


type __MappedDecoratorSignatureRest<
    S extends DecoratorSignature<any>,
    A extends any[],
    R1 = ExtractSignature<ClassDescriptor, S>[1],
> =
    Every<[
        IsSubtypeOf<S, ClassDecoratorSignature<A>>,
        IsSubtypeOf<S, MemberDecoratorSignature<A>>,
        IsSubtypeOf<S, ParameterDecoratorSignature<A>>,
    ]> extends true ?
        [R1] extends [void] ? {
            (target: Function): void;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
            (target: object, key: PropertyKey, parameterIndex: number): void;
        } :
        [void] extends [R1] ? {
            <T extends Function>(target: T): T | void;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
            (target: object, key: PropertyKey, parameterIndex: number): void;
        } : {
            <T extends Function>(target: T): T;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
            (target: object, key: PropertyKey, parameterIndex: number): void;
        } :
    Every<[
        IsSubtypeOf<S, ClassDecoratorSignature<A>>,
        IsSubtypeOf<S, MemberDecoratorSignature<A>>,
    ]> extends true ?
        [R1] extends [void] ? {
            (target: Function): void;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
        } :
        [void] extends [R1] ? {
            <T extends Function>(target: T): T | void;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
        } : {
            <T extends Function>(target: T): T;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
        } :
    Every<[
        IsSubtypeOf<S, ClassDecoratorSignature<A>>,
        IsSubtypeOf<S, ParameterDecoratorSignature<A>>,
    ]> extends true ?
        [R1] extends [void] ? {
            (target: Function): void;
            (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
        } :
        [void] extends [R1] ? {
            <T extends Function>(target: T): T | void;
            (target: object, key: PropertyKey, parameterIndex: number): void;
        } : {
            <T extends Function>(target: T): T;
            (target: object, key: PropertyKey, parameterIndex: number): void;
        } :
    Every<[
        IsSubtypeOf<S, MemberDecoratorSignature<A>>,
        IsSubtypeOf<S, ParameterDecoratorSignature<A>>,
    ]> extends true ? {
        (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
        (target: object, key: PropertyKey, parameterIndex: number): void;
    } :
    IsSubtypeOf<S, ClassDecoratorSignature<A>> extends true ?
        [R1] extends [void] ? { (target: Function): void; } :
        [void] extends [R1] ? { <T extends Function>(target: T): T | void; } : 
        { <T extends Function>(target: T): T; } :
    IsSubtypeOf<S, MemberDecoratorSignature<A>> extends true ? {
        (target: object, key: PropertyKey, descriptor?: PropertyDescriptor): void;
    } :
    IsSubtypeOf<S, ParameterDecoratorSignature<A>> extends true ? {
        (target: object, key: PropertyKey, parameterIndex: number): void;
    } :
    never;

type UnionToIntersection<U> = ((U extends unknown ? (u: U) => void : never) extends ((i: infer I) => void) ? I : never) | never;

type __MappedDecoratorSignature<
    S extends DecoratorSignature<any>,
    A extends any[],
> = UnionToIntersection<S extends unknown ? __MappedDecoratorSignatureRest<S, A> : never>;

export type MappedDecoratorSignature<S extends DecoratorSignature> = __MappedDecoratorSignature<S, []>;

type PickSignature<
    S extends DecoratorSignature<any>,
    A extends any[],
> = (
    Extract<
        UnionToIntersection<
            | (S extends ClassDecoratorSignature<A> ? ExtractClassDecoratorSignature<S> : never)
            | (S extends MemberDecoratorSignature<A> ? ExtractMemberDecoratorSignature<S> : never)
            | (S extends ParameterDecoratorSignature<A> ? ExtractParameterDecoratorSignature<S> : never)
        >,
        DecoratorSignature<any>
    >
) | never;

type __MappedDecoratorFactorySignature<
    S extends DecoratorSignature,
    A1 extends ExtractSignature<ClassDescriptor, S>[0] = ExtractSignature<ClassDescriptor, S>[0],
    A2 extends ExtractSignature<MemberDescriptor, S>[0] = ExtractSignature<MemberDescriptor, S>[0],
    A3 extends ExtractSignature<ParameterDescriptor, S>[0] = ExtractSignature<ParameterDescriptor, S>[0],
    R1 extends PickSignature<S, A1> = PickSignature<S, A1>,
    R2 extends PickSignature<S, A2> = PickSignature<S, A2>,
    R3 extends PickSignature<S, A3> = PickSignature<S, A3>,
> = (
    Some<[
        SameTypes<[A1, A2, A3]>,
        And<SameType<A1, A2>, IsNever<A3>>,
        And<SameType<A1, A3>, IsNever<A2>>,
        And<SameType<A2, A3>, IsNever<A1>>,
        And<IsNever<A1>, IsNever<A2>>,
        And<IsNever<A1>, IsNever<A3>>,
        And<IsNever<A2>, IsNever<A3>>,
    ]> extends true ? {
        (...args: A1 | A2 | A3): __MappedDecoratorSignature<R1 | R2 | R3, any[]>;
    } :
    Every<[
        Not<IsNever<A1 | A2>>,
        Not<IsNever<A3>>,
        Some<[
            SameType<A1, A2>,
            IsNever<A1>,
            IsNever<A2>,
        ]>
    ]> extends true ? {
        (...args: A1 | A2): __MappedDecoratorSignature<R1 | R2, any[]>;
        (...args: A3): __MappedDecoratorSignature<R3, any[]>;
    } :
    Every<[
        Not<IsNever<A1 | A3>>,
        Not<IsNever<A2>>,
        Some<[
            SameType<A1, A3>,
            IsNever<A1>,
            IsNever<A3>,
        ]>
    ]> extends true ? {
        (...args: A1 | A3): __MappedDecoratorSignature<R1 | R3, any[]>;
        (...args: A2): __MappedDecoratorSignature<R2, any[]>;
    } :
    Every<[
        Not<IsNever<A2 | A3>>,
        Not<IsNever<A1>>,
        Some<[
            SameType<A2, A3>,
            IsNever<A2>,
            IsNever<A3>,
        ]>
    ]> extends true ? {
        (...args: A1): __MappedDecoratorSignature<R1, any[]>;
        (...args: A2 | A3): __MappedDecoratorSignature<R2 | R3, any[]>;
    } :
    Not<IsNever<A1 | A2 | A3>> extends true ? {
        (...args: A1): __MappedDecoratorSignature<R1, any[]>;
        (...args: A2): __MappedDecoratorSignature<R2, any[]>;
        (...args: A3): __MappedDecoratorSignature<R3, any[]>;
    } :
    never
) | never;

export type MappedDecoratorFactorySignature<S extends DecoratorSignature> = __MappedDecoratorFactorySignature<S>;

export type MappedDecoratorOrDecoratorFactorySignature<S extends DecoratorSignature> = (
    & MappedDecoratorFactorySignature<S>
    & MappedDecoratorSignature<S>
) | never;