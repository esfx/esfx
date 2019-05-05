// 4.1.2 Reflect.defineMetadata ( metadataKey, metadataValue, target, propertyKey )
// https://rbuckton.github.io/reflect-metadata/#reflect.definemetadata

import "..";

describe("Reflect.defineMetadata", () => {
    it("InvalidTarget", () => {
        expect(() => Reflect.defineMetadata("key", "value", undefined!, undefined!)).toThrow(TypeError);
    });

    it("ValidTargetWithoutTargetKey", () => {
        expect(() => Reflect.defineMetadata("key", "value", { }, undefined!)).not.toThrow();
    });

    it("ValidTargetWithTargetKey", () => {
        expect(() => Reflect.defineMetadata("key", "value", { }, "name")).not.toThrow();
    });
});