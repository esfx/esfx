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

import { ClassDescriptor, createDecoratorFactory, createMemberDescriptor, createParameterDescriptor, DecoratorDescriptor, isClass, isMember, isParameter, MemberDescriptor, ParameterDescriptor } from '@esfx/decorators-stage1-core';
import /*#__INLINE__*/ { isPresent, isObject } from '@esfx/internal-guards';

export type MetadataKey = string | symbol | number | boolean | bigint | object;

interface ObjectDescriptor {
    kind: "object";
    target: object;
}

interface ObjectMetadata extends Map<MetadataKey, unknown> {
    _kind: "object";
    _parent: WeakMap<object, ObjectMetadata>;
    _key: object;
}

interface MembersMetadata extends Map<string | symbol, MemberMetadata> {
    _parent: WeakMap<object, MembersMetadata>;
    _key: object;
}

interface MemberMetadata extends Map<MetadataKey, unknown> {
    _kind: "member";
    _parent: MembersMetadata;
    _key: string | symbol;
}

interface MethodsMetadata extends Map<string | symbol, MethodMetadata> {
    _parent: WeakMap<object, MethodsMetadata>;
    _key: object;
}

interface MethodMetadata extends Map<number, ParameterMetadata>{
    _parent: MethodsMetadata;
    _key: string | symbol;
}

interface ParameterMetadata extends Map<MetadataKey, unknown> {
    _kind: "parameter";
    _parent: MethodMetadata;
    _key: number;
}

interface MetadataRoot {
    delete(key: unknown): boolean;
}

interface MetadataNode {
    readonly _parent: MetadataNode | MetadataRoot;
    readonly _key: unknown;
    readonly size: number;
    delete(key: unknown): boolean;
}

type MetadataSelector = ObjectDescriptor | MemberDescriptor | ParameterDescriptor;
type MetadataSelection = ObjectMetadata | MemberMetadata | ParameterMetadata;

const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty) as (target: object, propertyKey: PropertyKey) => boolean;
const weakObjectMetadata = new WeakMap<object, ObjectMetadata>();
const weakMemberMetadata = new WeakMap<object, MembersMetadata>();
const weakParameterMetadata = new WeakMap<object, MethodsMetadata>();

function createObjectDescriptor(target: object): ObjectDescriptor {
    return { kind: "object", target };
}

function selectMetadata<S extends MetadataSelector>(selector: S, create: true): Extract<MetadataSelection, { _kind: S["kind"] }>;
function selectMetadata<S extends MetadataSelector>(selector: S, create: boolean): Extract<MetadataSelection, { _kind: S["kind"] }> | undefined;
function selectMetadata(selector: MetadataSelector, create: boolean) {
    switch (selector.kind) {
        case "object": return selectObjectMetadata(selector, create);
        case "member": return selectMemberMetadata(selector, create);
        case "parameter": return selectParameterMetadata(selector, create);
    }
}

function selectObjectMetadata({ target }: ObjectDescriptor, create: boolean) {
    let objectMetadata = weakObjectMetadata.get(target);
    if (!objectMetadata) {
        if (!create) return undefined;
        weakObjectMetadata.set(target, objectMetadata = Object.assign(new Map(), {
            _kind: "object",
            _parent: weakObjectMetadata,
            _key: target
        } as const));
    }
    return objectMetadata;
}

function selectMemberMetadata({ target, key }: MemberDescriptor, create: boolean) {
    let membersMetadata = weakMemberMetadata.get(target);
    if (!membersMetadata) {
        if (!create) return undefined;
        weakMemberMetadata.set(target, membersMetadata = Object.assign(new Map(), {
            _parent: weakMemberMetadata,
            _key: target
        } as const));
    }
    let memberMetadata = membersMetadata.get(key);
    if (!memberMetadata) {
        if (!create) return undefined;
        membersMetadata.set(key, memberMetadata = Object.assign(new Map(), {
            _kind: "member",
            _parent: membersMetadata,
            _key: key
        } as const));
    }
    return memberMetadata;
}

function selectParameterMetadata({ target, key, index }: ParameterDescriptor, create: boolean) {
    let methodsMetadata = weakParameterMetadata.get(target);
    if (!methodsMetadata) {
        if (!create) return undefined;
        weakParameterMetadata.set(target, methodsMetadata = Object.assign(new Map(), {
            _parent: weakParameterMetadata,
            _key: target
        } as const));
    }
    let methodMetadata = methodsMetadata.get(key);
    if (!methodMetadata) {
        if (!create) return undefined;
        methodsMetadata.set(key, methodMetadata = Object.assign(new Map(), {
            _parent: methodsMetadata,
            _key: key
        } as const));
    }
    let parameterMetadata = methodMetadata.get(index);
    if (!parameterMetadata) {
        if (!create) return undefined;
        methodMetadata.set(index, parameterMetadata = Object.assign(new Map(), {
            _kind: "parameter",
            _parent: methodMetadata,
            _key: index
        } as const));
    }
    return parameterMetadata;
}

function hasOwnMember(selector: MemberDescriptor | ParameterDescriptor) {
    return hasOwn(selector.target, selector.key);
}

function defineMetadata(selector: MetadataSelector, metadataKey: MetadataKey, metadataValue: unknown) {
    const selection = selectMetadata(selector, /*create*/ true);
    selection.set(metadataKey, metadataValue);
}

function deleteMetadata(selector: MetadataSelector, metadataKey: MetadataKey) {
    let selection = selectMetadata(selector, /*create*/ false);
    if (selection && selection.delete(metadataKey)) {
        let node = selection as MetadataNode;
        while (node.size === 0) {
            node._parent.delete(node._key);
            if (!("_parent" in node._parent)) break;
            node = node._parent;
        }
        return true;
    }
    return false;
}

function hasOwnMetadata(selector: MetadataSelector, metadataKey: MetadataKey) {
    const selection = selectMetadata(selector, /*create*/ false);
    return selection ? selection.has(metadataKey) : false;
}

function hasMetadata(selector: MetadataSelector, metadataKey: MetadataKey) {
    return walk(
        selector,
        selector => hasOwnMetadata(selector, metadataKey),
        /*getValue*/ T,
        /*reduce*/ false,
        /*defaultValue*/ false);
}

function getOwnMetadata(selector: MetadataSelector, metadataKey: MetadataKey) {
    const selection = selectMetadata(selector, /*create*/ false);
    return selection ? selection.get(metadataKey) : undefined;
}

function getMetadata(selector: MetadataSelector, metadataKey: MetadataKey) {
    return walk(
        selector,
        selector => hasOwnMetadata(selector, metadataKey),
        selector => getOwnMetadata(selector, metadataKey),
        /*reduce*/ false,
        /*defaultValue*/ undefined);
}

function getOwnMetadataKeys(selector: MetadataSelector) {
    const selection = selectMetadata(selector, /*create*/ false);
    return selection ? [...selection.keys()] : [];
}

function getMetadataKeysReducer(selector: MetadataSelector, keys: Set<MetadataKey>) {
    for (const key of getOwnMetadataKeys(selector)) {
        keys.add(key);
    }
    return keys;
}

function getMetadataKeys(selector: MetadataSelector) {
    const keys = walk(
        selector,
        /*canGetValue*/ T,
        getMetadataKeysReducer,
        /*reduce*/ true,
        new Set<MetadataKey>());
    return [...keys];
}

// #region Object Metadata

/**
 * Define metadata on an object.
 * @param target The object.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export function defineObjectMetadata(target: object, metadataKey: MetadataKey, metadataValue: unknown) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    defineMetadata(createObjectDescriptor(target), metadataKey, metadataValue);
}

/**
 * Deletes an own metadata key from an object.
 * @param target The object.
 * @param metadataKey The metadata key.
 */
export function deleteObjectMetadata(target: object, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return deleteMetadata(createObjectDescriptor(target), metadataKey);
}

/**
 * Tests whether an object has own metadata for the provided key.
 * @param target The object.
 * @param metadataKey The metadata key.
 */
export function hasOwnObjectMetadata(target: object, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasOwnMetadata(createObjectDescriptor(target), metadataKey);
}

/**
 * Tests whether an object or its prototypes have metadata for the provided key.
 * @param target The object.
 * @param metadataKey The metadata key.
 */
export function hasObjectMetadata(target: object, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasMetadata(createObjectDescriptor(target), metadataKey);
}

/**
 * Gets the metadata value for an own metadata key on an object.
 * @param target The object.
 * @param metadataKey The metadata key.
 */
export function getOwnObjectMetadata(target: object, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getOwnMetadata(createObjectDescriptor(target), metadataKey);
}

/**
 * Gets the metadata value for a metadata key on an object or its prototypes.
 * @param target The object.
 * @param metadataKey The metadata key.
 */
export function getObjectMetadata(target: object, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getMetadata(createObjectDescriptor(target), metadataKey);
}

/**
 * Gets the own metadata keys defined on an object.
 * @param target The object.
 */
export function getOwnObjectMetadataKeys(target: object) {
    if (!isObject(target)) throw new TypeError();
    return getOwnMetadataKeys(createObjectDescriptor(target));
}

/**
 * Gets the metadata keys defined on an object or its prototypes.
 * @param target The object.
 */
export function getObjectMetadataKeys(target: object) {
    if (!isObject(target)) throw new TypeError();
    return getMetadataKeys(createObjectDescriptor(target));
}

function addMetadataMembers(target: object, members: Set<string | symbol>) {
    const membersMetadata = weakMemberMetadata.get(target);
    const methodsMetadata = weakParameterMetadata.get(target);
    if (membersMetadata) addRange(members, membersMetadata.keys());
    if (methodsMetadata) addRange(members, methodsMetadata.keys());
}

// #endregion Object Metadata

// #region Property Metadata

/**
 * Define metadata for a property of an object. The property does not have to exist.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export function definePropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey, metadataValue: unknown) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    defineMetadata(createMemberDescriptor(target, propertyKey), metadataKey, metadataValue);
}

/**
 * Deletes an own metadata key from a property of an object.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 */
export function deletePropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return deleteMetadata(createMemberDescriptor(target, propertyKey), metadataKey);
}

/**
 * Tests whether a property of an object has own metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 */
export function hasOwnPropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasOwnMetadata(createMemberDescriptor(target, propertyKey), metadataKey);
}

/**
 * Tests whether a property of an object or its prototypes have metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 */
export function hasPropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasMetadata(createMemberDescriptor(target, propertyKey), metadataKey);
}

/**
 * Gets the metadata value for an own metadata key on a property of an object.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 */
export function getOwnPropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getOwnMetadata(createMemberDescriptor(target, propertyKey), metadataKey);
}

/**
 * Gets the metadata value for a metadata key on a property of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the property.
 * @param metadataKey The metadata key.
 */
export function getPropertyMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getMetadata(createMemberDescriptor(target, propertyKey), metadataKey);
}

/**
 * Gets the own metadata keys defined on a property of an object.
 * @param target The target object.
 * @param propertyKey The name of the property.
 */
export function getOwnPropertyMetadataKeys(target: object, propertyKey: PropertyKey) {
    if (!isObject(target)) throw new TypeError();
    return getOwnMetadataKeys(createMemberDescriptor(target, propertyKey));
}

/**
 * Gets the metadata keys defined on a property of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the property.
 */
export function getPropertyMetadataKeys(target: object, propertyKey: PropertyKey) {
    if (!isObject(target)) throw new TypeError();
    return getMetadataKeys(createMemberDescriptor(target, propertyKey));
}

/**
 * Gets the own property names for an object for which there is metadata defined.
 * @param target An object.
 */
export function getOwnMetadataProperties(target: object) {
    if (!isObject(target)) throw new TypeError();
    const members = new Set<string | symbol>();
    addMetadataMembers(target, members);
    return [...members];
}

/**
 * Gets the property names for an object or its prototypes for which there is metadata defined.
 * @param target An object.
 */
export function getMetadataProperties(target: object) {
    if (!isObject(target)) throw new TypeError();
    const members = new Set<string | symbol>();
    let current: object | null = target;
    while (isObject(current)) {
        addMetadataMembers(current, members);
        current = Object.getPrototypeOf(current);
    }
    return [...members];
}

// #endregion Member Metadata

// #region Parameter Metadata

/**
 * Define metadata on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export function defineParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey, metadataValue: unknown) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    defineMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey, metadataValue);
}

/**
 * Deletes an own metadata key from a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export function deleteParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return deleteMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey);
}

/**
 * Tests whether a parameter of a method of an object has own metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export function hasOwnParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasOwnMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey);
}

/**
 * Tests whether a parameter of a method of an object or its prototypes have metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export function hasParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return hasMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey);
}

/**
 * Gets the metadata value for an own metadata key on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export function getOwnParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getOwnMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey);
}

/**
 * Gets the metadata value for a metadata key on a parameter of a method of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export function getParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    if (!isPresent(metadataKey)) throw new TypeError();
    return getMetadata(createParameterDescriptor(target, propertyKey, parameterIndex), metadataKey);
}

/**
 * Gets the own metadata keys defined on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export function getOwnParameterMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    return getOwnMetadataKeys(createParameterDescriptor(target, propertyKey, parameterIndex));
}

/**
 * Gets the metadata keys defined on a parameter of a method of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export function getParameterMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number) {
    if (!isObject(target)) throw new TypeError();
    if (typeof parameterIndex !== "number") throw new TypeError();
    return getMetadataKeys(createParameterDescriptor(target, propertyKey, parameterIndex));
}

function getOwnMetadataMaxParameterIndex({ target, key }: ParameterDescriptor) {
    let maxParameterIndex = -1;
    const membersMetadata = weakParameterMetadata.get(target);
    if (membersMetadata) {
        const parametersMetadata = membersMetadata.get(key);
        if (parametersMetadata) {
            for (const parameterIndex of parametersMetadata.keys()) {
                if (parameterIndex > maxParameterIndex) maxParameterIndex = parameterIndex;
            }
        }
    }
    return maxParameterIndex;
}

function getMetadataParameterLengthReducer(selector: ParameterDescriptor, maxParameterIndex: number) {
    return Math.max(maxParameterIndex, getOwnMetadataMaxParameterIndex(selector));
}

/**
 * Gets the maximum known length of a method of an object from its parameters that have metadata metadata.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export function getOwnMetadataParameterLength(target: object, propertyKey: PropertyKey) {
    if (!isObject(target)) throw new TypeError();
    return getOwnMetadataMaxParameterIndex(createParameterDescriptor(target, propertyKey, -1));
}

/**
 * Gets the maximum known length of a method of an object or its prototypes from its parameters that have metadata metadata.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export function getMetadataParameterLength(target: object, propertyKey: PropertyKey) {
    if (!isObject(target)) throw new TypeError();
    return walk(
        createParameterDescriptor(target, propertyKey, -1),
        hasOwnMember,
        getMetadataParameterLengthReducer,
        /*reduce*/ false,
        -1) + 1;
}

// #endregion Parameter Metadata

// #region Metadata decorator

function metadataDecorator(descriptor: ClassDescriptor, metadataKey: MetadataKey, metadataValue?: unknown): void;
function metadataDecorator(descriptor: MemberDescriptor, metadataKey: MetadataKey, metadataValue?: unknown): void;
function metadataDecorator(descriptor: ParameterDescriptor, metadataKey: MetadataKey, metadataValue?: unknown): void;
function metadataDecorator(descriptor: DecoratorDescriptor, metadataKey: MetadataKey, metadataValue?: unknown): void {
    if (!isClass(descriptor) && !isMember(descriptor) && !isParameter(descriptor)) throw new TypeError(`'@metadata' is only supported on classes, members, and parameters.`);
    const selector = descriptor.kind === "class" ? createObjectDescriptor(descriptor.target) : descriptor;
    defineMetadata(selector, metadataKey, metadataValue);
}

/**
 * Attaches metadata to a class, member, or parameter.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export const metadata = Object.assign(createDecoratorFactory(metadataDecorator), {
    defineObjectMetadata,
    deleteObjectMetadata,
    hasOwnObjectMetadata,
    hasObjectMetadata,
    getOwnObjectMetadata,
    getObjectMetadata,
    getOwnObjectMetadataKeys,
    getObjectMetadataKeys,
    definePropertyMetadata,
    deletePropertyMetadata,
    hasOwnPropertyMetadata,
    hasPropertyMetadata,
    getOwnPropertyMetadata,
    getPropertyMetadata,
    getOwnPropertyMetadataKeys,
    getPropertyMetadataKeys,
    getOwnMetadataProperties,
    getMetadataProperties,
    defineParameterMetadata,
    deleteParameterMetadata,
    hasOwnParameterMetadata,
    hasParameterMetadata,
    getOwnParameterMetadata,
    getParameterMetadata,
    getOwnParameterMetadataKeys,
    getParameterMetadataKeys,
    getOwnMetadataParameterLength,
    getMetadataParameterLength,
});

export { metadata as Metadata };

// #endregion Metadata decorator

function walk<S extends MetadataSelector, U>(selector: S, canGetValue: (selector: S) => boolean, getValue: (selector: S, previousValue: U) => U, reduce: boolean, defaultValue: U): U;
function walk<U>(selector: MetadataSelector, canGetValue: (selector: MetadataSelector) => boolean, getValue: (selector: MetadataSelector, previousValue: U) => U, reduce: boolean, defaultValue: U): U {
    let current: object | null = selector.target;
    while (isObject(current)) {
        selector = { ...selector };
        selector.target = current;
        if (canGetValue(selector)) {
            defaultValue = getValue(selector, defaultValue);
            if (!reduce) break;
        }
        if (selector.kind === "parameter" && hasOwnMember(selector)) {
            break;
        }
        current = Object.getPrototypeOf(selector.target);
    }
    return defaultValue;
}

function addRange<T>(set: Set<T>, values: Iterable<T>) {
    for (const value of values) {
        set.add(value);
    }
    return set;
}

function T() {
    return true;
}