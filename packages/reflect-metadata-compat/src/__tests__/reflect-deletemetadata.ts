// 4.1.10 Reflect.deleteMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.deletemetadata

import "..";

describe("Reflect.deleteMetadata", () => {
    it("InvalidTarget", () => {
        expect(() => Reflect.deleteMetadata("key", undefined!)).toThrow(TypeError);
    });

    it("WhenNotDefinedWithoutTargetKey", () => {
        let obj = {};
        let result = Reflect.deleteMetadata("key", obj);
        expect(result).toBe(false);
    });

    it("WhenDefinedWithoutTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        let result = Reflect.deleteMetadata("key", obj);
        expect(result).toBe(true);
    });

    it("WhenDefinedOnPrototypeWithoutTargetKey", () => {
        let prototype = {};
        Reflect.defineMetadata("key", "value", prototype);
        let obj = Object.create(prototype);
        let result = Reflect.deleteMetadata("key", obj);
        expect(result).toBe(false);
    });

    it("AfterDeleteMetadata", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        Reflect.deleteMetadata("key", obj);
        let result = Reflect.hasOwnMetadata("key", obj);
        expect(result).toBe(false);
    });
});