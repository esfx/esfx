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

import /*#__INLINE__*/ { isPresent, isFunction, isNumber, isObject, isPropertyKey } from '@esfx/internal-guards';
import { AccessorPropertyDescriptor, MethodPropertyDescriptor } from '@esfx/type-model';
import { DecoratorSignature, MappedDecoratorFactorySignature, MappedDecoratorOrDecoratorFactorySignature, MappedDecoratorSignature } from './typeModel';

/** @experimental */
export interface ClassDescriptor<T extends Function = Function> {
    kind: "class";
    target: T;
}

/** @experimental */
export interface MemberDescriptor<T = any> {
    kind: "member";
    target: object;
    key: string | symbol;
    descriptor?: TypedPropertyDescriptor<T>;
}

/** @experimental */
export interface AccessorMemberDescriptor<T = any> extends MemberDescriptor<T> {
    descriptor: AccessorPropertyDescriptor<T>;
}

/** @experimental */
export interface MethodMemberDescriptor<T extends (...args: any[]) => any = (...args: any[]) => any> extends MemberDescriptor<T> {
    descriptor: MethodPropertyDescriptor<T>;
}

/** @experimental */
export interface FieldMemberDescriptor<T = any> extends MemberDescriptor<T> {
    descriptor?: undefined;
}

/** @experimental */
export interface ParameterDescriptor {
    kind: "parameter";
    target: object;
    key: string | symbol;
    index: number;
}

/** @experimental */
export type DecoratorDescriptor = ClassDescriptor | MemberDescriptor | ParameterDescriptor;

/** @experimental */
export const defaultAccessorAttributes = Object.freeze({
    enumerable: false,
    configurable: true
});

/** @experimental */
export const defaultMethodAttributes = Object.freeze({
    enumerable: false,
    configurable: true,
    writable: true
});

/** @experimental */
export const defaultFieldAttributes = Object.freeze({
    enumerable: true,
    configurable: true,
    writable: true
});

/** @experimental */
export function createClassDescriptor<T extends Function = Function>(target: T): ClassDescriptor<T> {
    return { kind: "class", target };
}

/** @experimental */
export function createMemberDescriptor<T = any>(target: object, propertyKey: PropertyKey, descriptor?: TypedPropertyDescriptor<T>): MemberDescriptor<T> {
    return { kind: "member", target, key: toPropertyKey(propertyKey), descriptor };
}

/** @experimental */
export function createParameterDescriptor(target: object, propertyKey: PropertyKey, parameterIndex: number): ParameterDescriptor {
    return { kind: "parameter", target, key: toPropertyKey(propertyKey), index: parameterIndex };
}

/** @experimental */
export function isClass(value: DecoratorDescriptor): value is ClassDescriptor {
    return value.kind === "class";
}

/** @experimental */
export function isMember(value: DecoratorDescriptor): value is MemberDescriptor {
    return value.kind === "member";
}

/** @experimental */
export function isAccessor(value: DecoratorDescriptor): value is AccessorMemberDescriptor {
    return value.kind === "member"
        && isObject(value.descriptor)
        && (isFunction(value.descriptor.get) || isFunction(value.descriptor.set));
}

/** @experimental */
export function isMethod(value: DecoratorDescriptor): value is MethodMemberDescriptor {
    return value.kind === "member"
        && isObject(value.descriptor)
        && isFunction(value.descriptor.value);
}

/** @experimental */
export function isField(value: DecoratorDescriptor): value is FieldMemberDescriptor {
    return value.kind === "member"
        && value.descriptor === undefined;
}

/** @experimental */
export function isStatic(value: MemberDescriptor | ParameterDescriptor): boolean {
    return isFunction(value.target)
        && value.target.prototype.constructor === value.target;
}

/** @experimental */
export function isNonStatic(value: MemberDescriptor | ParameterDescriptor): boolean {
    return isObject(value.target)
        && value.target.constructor.prototype === value.target;
}

/** @experimental */
export function isParameter(value: DecoratorDescriptor): value is ParameterDescriptor {
    return value.kind === "parameter";
}

/** @experimental */
export type ClassDecoratorArguments = Parameters<(target: Function) => void>;

/** @experimental */
export type MemberDecoratorArguments = Parameters<(target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor) => void>;

/** @experimental */
export type ParameterDecoratorArguments = Parameters<(target: object, propertyKey: PropertyKey, parameterIndex: number) => void>;

/** @experimental */
export type DecoratorArguments =
    | ClassDecoratorArguments
    | MemberDecoratorArguments
    | ParameterDecoratorArguments;

/** @experimental */
export function isParameterDecoratorArguments(args: DecoratorArguments | IArguments | unknown[]): args is ParameterDecoratorArguments {
    return args.length === 3
        && isObject(args[0])
        && isPropertyKey(args[1])
        && isNumber(args[2]);
}

/** @experimental */
export function isMemberDecoratorArguments(args: DecoratorArguments | IArguments | unknown[]): args is MemberDecoratorArguments {
    return args.length === 2
        ? isObject(args[0]) && isPropertyKey(args[1])
        : args.length >= 3 && isObject(args[0]) && isPropertyKey(args[1]) && (args[2] === undefined || (isObject(args[2]) && !isFunction(args[2])));
}

/** @experimental */
export function isClassDecoratorArguments(args: DecoratorArguments | IArguments | unknown[]): args is ClassDecoratorArguments {
    return args.length === 1
        && isFunction(args[0]);
}

/** @experimental */
export function isDecoratorArguments(args: DecoratorArguments | IArguments | unknown[]): args is DecoratorArguments {
    return isClassDecoratorArguments(args)
        || isMemberDecoratorArguments(args)
        || isParameterDecoratorArguments(args);
}

/** @experimental */
export function getDecoratorInfoFromArguments(args: ClassDecoratorArguments): ClassDescriptor;
/** @experimental */
export function getDecoratorInfoFromArguments(args: MemberDecoratorArguments): MemberDescriptor;
/** @experimental */
export function getDecoratorInfoFromArguments(args: ParameterDecoratorArguments): ParameterDescriptor;
/** @experimental */
export function getDecoratorInfoFromArguments(args: DecoratorArguments): DecoratorDescriptor;
/** @experimental */
export function getDecoratorInfoFromArguments(args: DecoratorArguments | IArguments): DecoratorDescriptor | undefined;
export function getDecoratorInfoFromArguments(args: DecoratorArguments | IArguments) {
    if (isParameterDecoratorArguments(args)) {
        return createParameterDescriptor(args[0], args[1], args[2]);
    }
    if (isMemberDecoratorArguments(args)) {
        return createMemberDescriptor(args[0], args[1], args[2]);
    }
    if (isClassDecoratorArguments(args)) {
        return createClassDescriptor(args[0]);
    }
}

function toPropertyKey(value: unknown): string | symbol {
    return typeof value === "symbol" ? value : "" + value;
}

function __throw(e: unknown): never {
    throw e;
}

/** @experimental */
export function createDecorator<S extends DecoratorSignature<[]>>(decorator: S): MappedDecoratorSignature<S>;
export function createDecorator<S extends (descriptor: DecoratorDescriptor) => any>(decorator: S) {
    return (...args: DecoratorArguments) => decorator(getDecoratorInfoFromArguments(args) || __throw(new TypeError()));
}

/** @experimental */
export function createDecoratorFactory<S extends DecoratorSignature>(decorator: S): MappedDecoratorFactorySignature<S>;
export function createDecoratorFactory<A extends any[], F extends (descriptor: DecoratorDescriptor, ...args: A) => unknown>(decorator: F) {
    return (...outer: A) => (...args: DecoratorArguments): ReturnType<F> => decorator(getDecoratorInfoFromArguments(args) || __throw(new TypeError()), ...outer) as ReturnType<F>;
}

/** @experimental */
export function createDecoratorOrDecoratorFactory<S extends DecoratorSignature>(decorator: S): MappedDecoratorOrDecoratorFactorySignature<S>;
export function createDecoratorOrDecoratorFactory<A extends any[], F extends (descriptor: DecoratorDescriptor, ...args: A | []) => unknown>(decorator: F) {
    return (...outerArgs: A | DecoratorArguments) => isDecoratorArguments(outerArgs)
        ? decorator(getDecoratorInfoFromArguments(outerArgs) || __throw(new TypeError()))
        : (...args: DecoratorArguments) => decorator(getDecoratorInfoFromArguments(args) || __throw(new TypeError()), ...outerArgs);
}

type DecorateArguments =
    | Parameters<typeof decorateClass>
    | Parameters<typeof decorateMember>;

function isDecorateClassArguments(args: DecorateArguments): args is Parameters<typeof decorateClass> {
    return args.length === 2
        && Array.isArray(args[0])
        && isFunction(args[1]);
}

function isDecorateMemberArguments(args: DecorateArguments): args is Parameters<typeof decorateMember> {
    return args.length >= 3
        && Array.isArray(args[0])
        && isObject(args[1])
        && isPropertyKey(args[2])
        && (args[3] === undefined || isObject(args[3]));
}

/** @experimental */
export function decorate(decorators: ((target: Function) => Function | void)[], target: Function): Function;
/** @experimental */
export function decorate(decorators: ((target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor) => PropertyDescriptor | void)[], target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | void;
export function decorate(...args: DecorateArguments) {
    if (isDecorateClassArguments(args)) return decorateClass(...args);
    if (isDecorateMemberArguments(args)) return decorateMember(...args);
    throw new TypeError();
}

/** @experimental */
export function decorateClass(decorators: ((target: Function) => Function | void)[], target: Function): Function {
    for (let i = decorators.length - 1; i >= 0; i--) {
        const decorator = decorators[i];
        const decorated = decorator(target);
        if (isPresent(decorated)) {
            if (!isFunction(decorated)) throw new TypeError();
            target = decorated;
        }
    }
    return target;
}

/** @experimental */
export function decorateMember(decorators: ((target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor) => PropertyDescriptor | void)[], target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | void {
    if (typeof propertyKey !== "symbol") propertyKey = "" + propertyKey;
    for (let i = decorators.length - 1; i >= 0; i--) {
        const decorator = decorators[i];
        const decorated = decorator(target, propertyKey, descriptor!);
        if (isPresent(decorated)) {
            if (!isObject(decorated)) throw new TypeError();
            descriptor = decorated;
        }
    }
    return descriptor;
}
