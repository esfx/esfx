const {
    defineClassMetadata,
    defineMemberMetadata,
    defineParameterMetadata,
    getObjectMetadata,
    getPropertyMetadata,
    getParameterMetadata
} = require("@esfx/metadata");

class MyClass {
    method(x) {
        return "hi";
    }
}

defineClassMetadata(MyClass, "Service", "MyService");
defineMemberMetadata(MyClass.prototype, "method", "ReturnType", "string");
defineParameterMetadata(MyClass.prototype, "method", 0, "Type", "number");

const c = new MyClass();
getObjectMetadata(MyClass, "Service"); // "MyService"
getPropertyMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"