# `@esfx/reflect-metadata-compat`

The `@esfx/reflect-metadata-compat` package is a global shim that provides API compatibility with `reflect-metadata`.

# Overview

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)

# Installation

```sh
npm i @esfx/reflect-metadata-compat
```

# Usage

```ts
import "@esfx/reflect-metadata-compat";

// TypeScript compiled with --emitDecoratorMetadata
class MyClass {
    @someDecorator
    method(x: number): string {
        return "";
    }
}

const c = new MyClass();
Reflect.getMetadata("design:returntype", c, "method"); // String
Reflect.getMetadata("design:paramtypes", c, "method"); // [Number]
```

# API

```ts
import "@esfx/metadata-shim";
import { MetadataKey } from "@esfx/metadata";
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
```