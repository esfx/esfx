// 4.1.2 Reflect.metadata ( metadataKey, metadataValue )
// https://rbuckton.github.io/reflect-metadata/#reflect.metadata

import "..";

describe("Reflect.metadata", () => {
    it("ReturnsDecoratorFunction", () => {
        let result = Reflect.metadata("key", "value");
        expect(typeof result).toBe("function");
    });

    it("DecoratorThrowsWithInvalidTargetWithTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        expect(() => decorator(undefined!, "name")).toThrow(TypeError);
    });

    it("DecoratorThrowsWithInvalidTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        expect(() => decorator({}, <any>{})).toThrow(TypeError);
    });

    it("OnTargetWithoutTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        let target = function () {}
        decorator(target);

        let result = Reflect.hasOwnMetadata("key", target);
        expect(result,).toBe(true);
    });

    it("OnTargetWithTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        let target = {}
        decorator(target, "name");

        let result = Reflect.hasOwnMetadata("key", target, "name");
        expect(result,).toBe(true);
    });
});