// Reflect.decorate ( decorators, target [, propertyKey [, descriptor] ] )

import "..";

describe("Reflect.decorate", () => {
    it("ThrowsIfDecoratorsArgumentNotArrayForFunctionOverload", () => {
        let target = function() { };
        expect(() => Reflect.decorate(undefined!, target, undefined!, undefined)).toThrow(TypeError);
    });

    it("ThrowsIfTargetArgumentNotFunctionForFunctionOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = {};
        expect(() => Reflect.decorate(decorators, target, undefined!, undefined)).toThrow(TypeError);
    });

    it("ThrowsIfDecoratorsArgumentNotArrayForPropertyOverload", () => {
        let target = {};
        let name = "name";
        expect(() => Reflect.decorate(undefined!, target, name, undefined)).toThrow(TypeError);
    });

    it("ThrowsIfTargetArgumentNotObjectForPropertyOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = 1;
        let name = "name";
        expect(() => Reflect.decorate(decorators, target as any, name, undefined)).toThrow(TypeError);
    });

    it("ThrowsIfDecoratorsArgumentNotArrayForPropertyDescriptorOverload", () => {
        let target = {};
        let name = "name";
        let descriptor = {};
        expect(() => Reflect.decorate(undefined!, target, name, descriptor)).toThrow(TypeError);
    });

    it("ThrowsIfTargetArgumentNotObjectForPropertyDescriptorOverload", () => {
        let decorators: (MethodDecorator | PropertyDecorator)[] = [];
        let target = 1;
        let name = "name";
        let descriptor = {};
        expect(() => Reflect.decorate(decorators, target as any, name, descriptor)).toThrow(TypeError);
    });

    it("ExecutesClassDecoratorsWhenExcessArgumentsAreUndefined", () => {
        const fn = jest.fn();
        const decorators = [fn];
        const target = function() { };
        Reflect.decorate(decorators, target, undefined!, undefined!);
        expect(fn).toBeCalledTimes(1);
    });

    it("ExecutesDecoratorsInReverseOrderForFunctionOverload", () => {
        let order: number[] = [];
        let decorators = [
            (target: Function): void => { order.push(0); },
            (target: Function): void => { order.push(1); }
        ];
        let target = function() { };
        Reflect.decorate(decorators, target);
        expect(order).toEqual([1, 0]);
    });

    it("ExecutesDecoratorsInReverseOrderForPropertyOverload", () => {
        let order: number[] = [];
        let decorators = [
            (target: Object, name: string | symbol): void => { order.push(0); },
            (target: Object, name: string | symbol): void => { order.push(1); }
        ];
        let target = {};
        let name = "name";
        Reflect.decorate(decorators, target, name, undefined);
        expect(order).toEqual([1, 0]);
    });

    it("ExecutesDecoratorsInReverseOrderForPropertyDescriptorOverload", () => {
        let order: number[] = [];
        let decorators = [
            (target: Object, name: string | symbol): void => { order.push(0); },
            (target: Object, name: string | symbol): void => { order.push(1); }
        ];
        let target = {};
        let name = "name";
        let descriptor = {};
        Reflect.decorate(decorators, target, name, descriptor);
        expect(order).toEqual([1, 0]);
    });

    it("DecoratorPipelineForFunctionOverload", () => {
        let A = function A(): void { };
        let B = function B(): void { };
        let decorators = [
            (target: Function): any => { return undefined; },
            (target: Function): any => { return A; },
            (target: Function): any => { return B; }
        ];
        let target = function (): void { };
        let result = Reflect.decorate(decorators, target);
        expect(result).toBe(A);
    });

    it("DecoratorPipelineForPropertyOverload", () => {
        let A = {};
        let B = {};
        let decorators = [
            (target: Object, name: string | symbol): any => { return undefined; },
            (target: Object, name: string | symbol): any => { return A; },
            (target: Object, name: string | symbol): any => { return B; }
        ];
        let target = {};
        let result = Reflect.decorate(decorators, target, "name", undefined);
        expect(result).toBe(A);
    });

    it("DecoratorPipelineForPropertyDescriptorOverload", () => {
        let A = {};
        let B = {};
        let C = {};
        let decorators = [
            (target: Object, name: string | symbol): any => { return undefined; },
            (target: Object, name: string | symbol): any => { return A; },
            (target: Object, name: string | symbol): any => { return B; }
        ];
        let target = {};
        let result = Reflect.decorate(decorators, target, "name", C);
        expect(result).toBe(A);
    });

    it("DecoratorCorrectTargetInPipelineForFunctionOverload", () => {
        let sent: Function[] = [];
        let A = function A(): void { };
        let B = function B(): void { };
        let decorators = [
            (target: Function): any => { sent.push(target); return undefined; },
            (target: Function): any => { sent.push(target); return undefined; },
            (target: Function): any => { sent.push(target); return A; },
            (target: Function): any => { sent.push(target); return B; }
        ];
        let target = function (): void { };
        Reflect.decorate(decorators, target);
        expect(sent).toEqual([target, B, A, A]);
    });

    it("DecoratorCorrectTargetInPipelineForPropertyOverload", () => {
        let sent: Object[] = [];
        let decorators = [
            (target: Object, name: string | symbol): any => { sent.push(target); },
            (target: Object, name: string | symbol): any => { sent.push(target); },
            (target: Object, name: string | symbol): any => { sent.push(target); },
            (target: Object, name: string | symbol): any => { sent.push(target); }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name");
        expect(sent).toEqual([target, target, target, target]);
    });

    it("DecoratorCorrectNameInPipelineForPropertyOverload", () => {
        let sent: (symbol | string)[] = [];
        let decorators = [
            (target: Object, name: string | symbol): any => { sent.push(name); },
            (target: Object, name: string | symbol): any => { sent.push(name); },
            (target: Object, name: string | symbol): any => { sent.push(name); },
            (target: Object, name: string | symbol): any => { sent.push(name); }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name");
        expect(sent).toEqual(["name", "name", "name", "name"]);
    });

    it("DecoratorCorrectTargetInPipelineForPropertyDescriptorOverload", () => {
        let sent: Object[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (target: Object, name: string | symbol): any => { sent.push(target); return undefined; },
            (target: Object, name: string | symbol): any => { sent.push(target); return undefined; },
            (target: Object, name: string | symbol): any => { sent.push(target); return A; },
            (target: Object, name: string | symbol): any => { sent.push(target); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        expect(sent).toEqual([target, target, target, target]);
    });

    it("DecoratorCorrectNameInPipelineForPropertyDescriptorOverload", () => {
        let sent: (symbol | string)[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (target: Object, name: string | symbol): any => { sent.push(name); return undefined; },
            (target: Object, name: string | symbol): any => { sent.push(name); return undefined; },
            (target: Object, name: string | symbol): any => { sent.push(name); return A; },
            (target: Object, name: string | symbol): any => { sent.push(name); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        expect(sent).toEqual(["name", "name", "name", "name"]);
    });

    it("DecoratorCorrectDescriptorInPipelineForPropertyDescriptorOverload", () => {
        let sent: PropertyDescriptor[] = [];
        let A = { };
        let B = { };
        let C = { };
        let decorators = [
            (target: Object, name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return undefined; },
            (target: Object, name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return undefined; },
            (target: Object, name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return A; },
            (target: Object, name: string | symbol, descriptor: PropertyDescriptor): any => { sent.push(descriptor); return B; }
        ];
        let target = { };
        Reflect.decorate(decorators, target, "name", C);
        expect(sent).toEqual([C, B, A, A]);
    });
});