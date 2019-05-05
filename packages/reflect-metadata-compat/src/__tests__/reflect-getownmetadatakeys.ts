// 4.1.9 Reflect.getOwnMetadataKeysKeys ( target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getownmetadatakeys

import "..";

describe("Reflect.deleteMetadata", () => {
    it("KeysKeysInvalidTarget", () => {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        expect(() => Reflect.getOwnMetadataKeys(undefined!)).toThrow(TypeError);
    });

    it("KeysWithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadataKeys(obj);
        expect(result).toEqual([]);
    });

    it("KeysWithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        let result = Reflect.getOwnMetadataKeys(obj);
        expect(result).toEqual(["key"]);
    });

    it("KeysWithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype);
        let result = Reflect.getOwnMetadataKeys(obj);
        expect(result).toEqual([]);
    });

    it("KeysOrderWithoutTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj);
        Reflect.defineMetadata("key0", "value", obj);
        let result = Reflect.getOwnMetadataKeys(obj);
        expect(result).toEqual(["key1", "key0"]);
    });

    it("KeysOrderAfterRedefineWithoutTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj);
        Reflect.defineMetadata("key0", "value", obj);
        Reflect.defineMetadata("key1", "value", obj);
        let result = Reflect.getOwnMetadataKeys(obj);
        expect(result).toEqual(["key1", "key0"]);
    });

    it("KeysWithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        expect(result).toEqual([]);
    });

    it("KeysWithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        expect(result).toEqual(["key"]);
    });

    it("KeysWithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        expect(result).toEqual([]);
    });

    it("KeysOrderAfterRedefineWithTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj, "name");
        Reflect.defineMetadata("key0", "value", obj, "name");
        Reflect.defineMetadata("key1", "value", obj, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        expect(result).toEqual(["key1", "key0"]);
    });
});