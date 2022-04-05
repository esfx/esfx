import { ref, Reference } from "@esfx/ref";
import { Metadata } from "@esfx/metadata";

const Type = (ref_type: Reference<Function>) => Metadata("design:type", ref_type);

class Node {
    @Type(ref(() => Container))
    get parent() { /*...*/ }

    @Type(ref(() => Node)) 
    get nextSibling() { /*...*/ }
}

class Container extends Node {
    @Type(ref(() => Node))
    get firstChild() { /*...*/ }
}