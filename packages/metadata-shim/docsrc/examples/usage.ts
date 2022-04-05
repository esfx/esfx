import "@esfx/metadata-shim";
import { getPropertyMetadata } from "@esfx/metadata";

// TypeScript compiled with --emitDecoratorMetadata
class MyClass {
    @someDecorator
    method(x: number): string {
        return "";
    }
}

const c = new MyClass();
getPropertyMetadata(c, "method", "design:returntype"); // String
getPropertyMetadata(c, "method", "design:paramtypes"); // [Number]