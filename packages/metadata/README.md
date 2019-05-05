# `@esfx/metadata`

The `@esfx/metadata` package provides an API for defining metadata about an object.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/metadata
```

# Usage

```ts
import { Metadata, getClassMetadata, getMemberMetadata, getParameterMetadata } from "@esfx/metadata";

const Service = name => Metadata("Service", name);
const ReturnType = type => Metadata("ReturnType", type);
const Type = type => Metadata("Type", type);

@Service("MyService")
class MyClass {
    @ReturnType("string")
    method(@Type("number") x) {
        return "hi";
    }
}

const c = new MyClass();
getClassMetadata(MyClass, "Service"); // "MyService"
getMemberMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"
```

# API

```ts
export declare type MetadataKey = string | symbol | number | boolean | bigint | object;
/**
 * Define metadata on a class.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export declare function defineClassMetadata(target: Function, metadataKey: MetadataKey, metadataValue: unknown): void;
/**
 * Deletes an own metadata key from a class.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 */
export declare function deleteClassMetadata(target: Function, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a class has own metadata for the provided key.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 */
export declare function hasOwnClassMetadata(target: Function, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a class or any of its superclasses have metadata for the provided key.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 */
export declare function hasClassMetadata(target: Function, metadataKey: MetadataKey): boolean;
/**
 * Gets the metadata value for an own metadata key on a class.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 */
export declare function getOwnClassMetadata(target: Function, metadataKey: MetadataKey): unknown;
/**
 * Gets the metadata value for a metadata key on a class or any of its superclasses.
 * @param target The class constructor.
 * @param metadataKey The metadata key.
 */
export declare function getClassMetadata(target: Function, metadataKey: MetadataKey): unknown;
/**
 * Gets the own metadata keys defined on a class.
 * @param target The class constructor.
 */
export declare function getOwnClassMetadataKeys(target: Function): self.MetadataKey[];
/**
 * Gets the metadata keys defined on a class or any of its superclasses.
 * @param target The class constructor.
 */
export declare function getClassMetadataKeys(target: Function): self.MetadataKey[];
/**
 * Define metadata on a member of an object.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export declare function defineMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey, metadataValue: unknown): void;
/**
 * Deletes an own metadata key from a member of an object.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 */
export declare function deleteMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a member of an object has own metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 */
export declare function hasOwnMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a member of an object or its prototypes have metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 */
export declare function hasMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey): boolean;
/**
 * Gets the metadata value for an own metadata key on a member of an object.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 */
export declare function getOwnMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey): unknown;
/**
 * Gets the metadata value for a metadata key on a member of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the member.
 * @param metadataKey The metadata key.
 */
export declare function getMemberMetadata(target: object, propertyKey: PropertyKey, metadataKey: MetadataKey): unknown;
/**
 * Gets the own metadata keys defined on a member of an object.
 * @param target The target object.
 * @param propertyKey The name of the member.
 */
export declare function getOwnMemberMetadataKeys(target: object, propertyKey: PropertyKey): self.MetadataKey[];
/**
 * Gets the metadata keys defined on a member of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the member.
 */
export declare function getMemberMetadataKeys(target: object, propertyKey: PropertyKey): self.MetadataKey[];
/**
 * Gets the own member names for an object for which there is metadata defined.
 * @param target An object.
 */
export declare function getOwnMetadataMembers(target: object): (string | symbol)[];
/**
 * Gets the member names for an object or its prototypes for which there is metadata defined.
 * @param target An object.
 */
export declare function getMetadataMembers(target: object): (string | symbol)[];
/**
 * Define metadata on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export declare function defineParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey, metadataValue: unknown): void;
/**
 * Deletes an own metadata key from a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export declare function deleteParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a parameter of a method of an object has own metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export declare function hasOwnParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey): boolean;
/**
 * Tests whether a parameter of a method of an object or its prototypes have metadata for the provided key.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export declare function hasParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey): boolean;
/**
 * Gets the metadata value for an own metadata key on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export declare function getOwnParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey): unknown;
/**
 * Gets the metadata value for a metadata key on a parameter of a method of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 * @param metadataKey The metadata key.
 */
export declare function getParameterMetadata(target: object, propertyKey: PropertyKey, parameterIndex: number, metadataKey: MetadataKey): unknown;
/**
 * Gets the own metadata keys defined on a parameter of a method of an object.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export declare function getOwnParameterMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number): self.MetadataKey[];
/**
 * Gets the metadata keys defined on a parameter of a method of an object or its prototypes.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export declare function getParameterMetadataKeys(target: object, propertyKey: PropertyKey, parameterIndex: number): self.MetadataKey[];
/**
 * Gets the maximum known length of a method of an object from its parameters that have metadata metadata.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export declare function getOwnMetadataParameterLength(target: object, propertyKey: PropertyKey): number;
/**
 * Gets the maximum known length of a method of an object or its prototypes from its parameters that have metadata metadata.
 * @param target The target object.
 * @param propertyKey The name of the method.
 * @param parameterIndex The ordinal index of the parameter.
 */
export declare function getMetadataParameterLength(target: object, propertyKey: PropertyKey): number;
/**
 * Attaches metadata to a class, member, or parameter.
 * @param metadataKey The metadata key.
 * @param metadataValue The metadata value.
 */
export declare function Metadata(metadataKey: MetadataKey, metadataValue?: unknown): {
    (target: Function): void;
    (target: object, propertyKey: string | number | symbol): void;
    (target: object, propertyKey: string | number | symbol, parameterIndex: number): void;
};
```