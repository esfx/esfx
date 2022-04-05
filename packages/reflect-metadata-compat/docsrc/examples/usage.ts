// <usage>
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

// </usage>
declare var someDecorator;