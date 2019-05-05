// 4.1.5 Reflect.getMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getmetadata

import "..";

describe("Reflect.getMetadata", () => {
    it("InvalidTarget", () => {
        expect(() => Reflect.getMetadata("key", undefined!)).toThrow(TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getMetadata("key", obj);
        expect(result).toBeUndefined();
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj);
        let result = Reflect.getMetadata("key", obj);
        expect(result).toBe("value");
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype);
        let result = Reflect.getMetadata("key", obj);
        expect(result).toBe("value");
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getMetadata("key", obj, "name");
        expect(result).toBe(undefined);
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getMetadata("key", obj, "name");
        expect(result).toBe("value");
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getMetadata("key", obj, "name");
        expect(result).toBe("value");
    });
});