// 4.1.7 Reflect.getOwnMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getownmetadata

import "..";

describe("Reflect.getOwnMetadata", () => {
    it("InvalidTarget", () => {
        expect(() => Reflect.getOwnMetadata("key", undefined!)).toThrow(TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadata("key", obj);
        expect(result).toBeUndefined();
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        let result = Reflect.getOwnMetadata("key", obj);
        expect(result).toEqual("value");
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype);
        let result = Reflect.getOwnMetadata("key", obj);
        expect(result).toBeUndefined();
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadata("key", obj, "name");
        expect(result).toBeUndefined();
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getOwnMetadata("key", obj, "name");
        expect(result).toEqual("value");
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getOwnMetadata("key", obj, "name");
        expect(result).toBeUndefined();
    });
});