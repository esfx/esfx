// 4.1.5 Reflect.hasOwnMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.hasownmetadata

import "..";

describe("Reflect.hasOwnMetadata", () => {
    it("InvalidTarget", () => {
        expect(() => Reflect.hasOwnMetadata("key", undefined!)).toThrow(TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.hasOwnMetadata("key", obj);
        expect(result).toBe(false);
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        let result = Reflect.hasOwnMetadata("key", obj);
        expect(result).toBe(true);
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype);
        let result = Reflect.hasOwnMetadata("key", obj);
        expect(result).toBe(false);
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.hasOwnMetadata("key", obj, "name");
        expect(result).toBe(false);
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.hasOwnMetadata("key", obj, "name");
        expect(result).toBe(true);
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.hasOwnMetadata("key", obj, "name");
        expect(result).toBe(false);
    });
});