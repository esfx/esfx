import { Metadata, getObjectMetadata, getPropertyMetadata, getParameterMetadata } from "@esfx/metadata";

const Service = name => Metadata("Service", name);
const ReturnType = type => Metadata("ReturnType", type);
const Type = type => Metadata("Type", type);

@Service("MyService")
class MyClass {
    @ReturnType("string")
    method(@Type("number") x: number) {
        return "hi";
    }
}

const c = new MyClass();
getObjectMetadata(MyClass, "Service"); // "MyService"
getPropertyMetadata(c, "method", "ReturnType"); // "string"
getParameterMetadata(c, "method", 0, "Type"); // "number"