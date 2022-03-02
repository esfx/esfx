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

import "@esfx/metadata-shim";
import * as metadata from "@esfx/metadata";
import { MetadataKey } from "@esfx/metadata";
import /*#__INLINE__*/ { isFunction, isObject, isPropertyKey, isPresent } from "@esfx/internal-guards";

declare global {
    namespace Reflect {
        function decorate(decorators: ClassDecorator[], target: Function): Function;
        function decorate(decorators: (PropertyDecorator | MethodDecorator)[], target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | undefined;
        function defineMetadata(metadataKey: MetadataKey, metadataValue: unknown, target: object): void;
        function defineMetadata(metadataKey: MetadataKey, metadataValue: unknown, target: object, propertyKey: PropertyKey): void;
        function defineMetadata(metadataKey: MetadataKey, metadataValue: unknown, target: object, propertyKey: PropertyKey, parameterIndex: number): void;
        function deleteMetadata(metadataKey: MetadataKey, target: object): boolean;
        function deleteMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey): boolean;
        function deleteMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey, parameterIndex: number): boolean;
        function hasOwnMetadata(metadataKey: MetadataKey, target: object): boolean;
        function hasOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey): boolean;
        function hasOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey, parameterIndex: number): boolean;
        function hasMetadata(metadataKey: MetadataKey, target: object): boolean;
        function hasMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey): boolean;
        function hasMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey, parameterIndex: number): boolean;
        function getOwnMetadata(metadataKey: MetadataKey, target: object): unknown;
        function getOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey): unknown;
        function getOwnMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey, parameterIndex: number): unknown;
        function getMetadata(metadataKey: MetadataKey, target: object): unknown;
        function getMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey): unknown;
        function getMetadata(metadataKey: MetadataKey, target: object, propertyKey: PropertyKey, parameterIndex: number): unknown;
        function getOwnMetadataKeys(target: object): MetadataKey[];
        function getOwnMetadataKeys(target: object, propertyKey: PropertyKey): MetadataKey[];
        function getOwnMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number): MetadataKey[];
        function getMetadataKeys(target: object): MetadataKey[];
        function getMetadataKeys(target: object, propertyKey: PropertyKey): MetadataKey[];
        function getMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number): MetadataKey[];
    }
}

type Overloads =
    | readonly [object]
    | readonly [object, PropertyKey]
    | readonly [object, PropertyKey, number];

function isParameterOverload(args: Overloads): args is readonly [object, PropertyKey, number] {
    if (args.length >= 3 && isObject(args[0]) && isPropertyKey(args[1]) && typeof args[2] === "number") return true;
    return false;
}

function isMemberOverload(args: Overloads): args is readonly [object, PropertyKey] {
    if (args.length >= 2 && isObject(args[0]) && isPropertyKey(args[1]) && (args.length === 2 || !isPresent(args[2]) || isObject(args[2]))) return true;
    return false;
}

function isObjectOverload(args: Overloads): args is readonly [object] {
    if (args.length >= 1 && isObject(args[0]) && (args.length === 1 || !isPresent(args[1]))) return true;
    return false;
}

if (!Reflect.decorate) Reflect.decorate = (() => {
    type DecorateOverloads =
        | readonly [ClassDecorator[], Function]
        | readonly [(PropertyDecorator | MethodDecorator)[], object, PropertyKey, PropertyDescriptor?];

    function isDecorateClassOverload(args: DecorateOverloads): args is readonly [ClassDecorator[], Function] {
        if (args.length >= 2 && Array.isArray(args[0]) && isFunction(args[1]) && (args.length === 2 || !isPresent(args[2])) && (args.length === 3 || !isPresent(args[3]))) return true;
        return false;
    }

    function isDecorateMemberOverload(args: DecorateOverloads): args is readonly [(PropertyDecorator | MethodDecorator)[], object, PropertyKey, PropertyDescriptor?] {
        if (args.length >= 3 && Array.isArray(args[0]) && isObject(args[1]) && isPropertyKey(args[2]) && (isObject(args[3]) || !isPresent(args[3]))) return true;
        return false;
    }


    function decorate(decorators: ClassDecorator[], target: Function): Function;
    function decorate(decorators: (PropertyDecorator | MethodDecorator)[], target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | undefined;
    function decorate(...args: DecorateOverloads) {
        if (isDecorateClassOverload(args)) return decorateClass(...args);
        if (isDecorateMemberOverload(args)) return decorateMember(...args);
        throw new TypeError();
    }

    function decorateClass(decorators: ClassDecorator[], target: Function): Function {
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

    function decorateMember(decorators: (PropertyDecorator | MethodDecorator)[], target: object, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | undefined {
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

    return decorate;
})();

if (!Reflect.defineMetadata) Reflect.defineMetadata = function (metadataKey: MetadataKey, metadataValue: unknown, ...args: Overloads) {
    if (isParameterOverload(args)) return void metadata.defineParameterMetadata(args[0], args[1], args[2], metadataKey, metadataValue);
    if (isMemberOverload(args)) return void metadata.definePropertyMetadata(args[0], args[1], metadataKey, metadataValue);
    if (isObjectOverload(args)) return void metadata.defineObjectMetadata(args[0], metadataKey, metadataValue);
    throw new TypeError();
};
if (!Reflect.deleteMetadata) Reflect.deleteMetadata = function (metadataKey: MetadataKey, ...args: Overloads) {
    if (isParameterOverload(args)) return metadata.deleteParameterMetadata(args[0], args[1], args[2], metadataKey);
    if (isMemberOverload(args)) return metadata.deletePropertyMetadata(args[0], args[1], metadataKey);
    if (isObjectOverload(args)) return metadata.deleteObjectMetadata(args[0], metadataKey);
    throw new TypeError();
}
if (!Reflect.hasOwnMetadata) Reflect.hasOwnMetadata = function (metadataKey: MetadataKey, ...args: Overloads) {
    if (isParameterOverload(args)) return metadata.hasOwnParameterMetadata(args[0], args[1], args[2], metadataKey);
    if (isMemberOverload(args)) return metadata.hasOwnPropertyMetadata(args[0], args[1], metadataKey);
    if (isObjectOverload(args)) return metadata.hasOwnObjectMetadata(args[0], metadataKey);
    throw new TypeError();
}
if (!Reflect.hasMetadata) Reflect.hasMetadata = function (metadataKey: MetadataKey, ...args: Overloads) {
    if (isParameterOverload(args)) return metadata.hasParameterMetadata(args[0], args[1], args[2], metadataKey);
    if (isMemberOverload(args)) return metadata.hasPropertyMetadata(args[0], args[1], metadataKey);
    if (isObjectOverload(args)) return metadata.hasObjectMetadata(args[0], metadataKey);
    throw new TypeError();
}
if (!Reflect.getOwnMetadata) Reflect.getOwnMetadata = function (metadataKey: MetadataKey, ...args: Overloads) {
    if (isParameterOverload(args)) return metadata.getOwnParameterMetadata(args[0], args[1], args[2], metadataKey);
    if (isMemberOverload(args)) return metadata.getOwnPropertyMetadata(args[0], args[1], metadataKey);
    if (isObjectOverload(args)) return metadata.getOwnObjectMetadata(args[0], metadataKey);
    throw new TypeError();
}
if (!Reflect.getMetadata) Reflect.getMetadata = function (metadataKey: MetadataKey, ...args: Overloads) {
    if (isParameterOverload(args)) return metadata.getParameterMetadata(args[0], args[1], args[2], metadataKey);
    if (isMemberOverload(args)) return metadata.getPropertyMetadata(args[0], args[1], metadataKey);
    if (isObjectOverload(args)) return metadata.getObjectMetadata(args[0], metadataKey);
    throw new TypeError();
}
if (!Reflect.getOwnMetadataKeys) Reflect.getOwnMetadataKeys = function (...args: Overloads) {
    if (isParameterOverload(args)) return metadata.getOwnParameterMetadataKeys(args[0], args[1], args[2]);
    if (isMemberOverload(args)) return metadata.getOwnPropertyMetadataKeys(args[0], args[1]);
    if (isObjectOverload(args)) return metadata.getOwnObjectMetadataKeys(args[0]);
    throw new TypeError();
}
if (!Reflect.getMetadataKeys) Reflect.getMetadataKeys = function (...args: Overloads) {
    if (isParameterOverload(args)) return metadata.getParameterMetadataKeys(args[0], args[1], args[2]);
    if (isMemberOverload(args)) return metadata.getPropertyMetadataKeys(args[0], args[1]);
    if (isObjectOverload(args)) return metadata.getObjectMetadataKeys(args[0]);
    throw new TypeError();
}
