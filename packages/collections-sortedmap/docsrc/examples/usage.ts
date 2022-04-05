import { SortedMap } from "@esfx/collections-sortedmap";
import { Equatable, Equaler, Comparable, Comparer } from "@esfx/equatable";

class Person {
    firstName: string;
    lastName: string;
    constructor(firstName: string, lastName: string) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    toString() {
        return `${this.firstName} ${this.lastName}`;
    }

    [Equatable.equals](other: unknown) {
        return other instanceof Person
            && this.lastName === other.lastName
            && this.firstName === other.firstName;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.lastName)
            ^ Equaler.defaultEqualer.hash(this.firstName);
    }

    [Comparable.compareTo](other: unknown) {
        if (!(other instanceof Person)) throw new TypeError();
        return Comparer.defaultComparer.compare(this.lastName, other.lastName)
            || Comparer.defaultComparer.compare(this.firstName, other.firstName);
    }
}

const obj1 = new Person("Alice", "Johnson");
const obj2 = new Person("Bob", "Clark");

// ECMAScript native map iterates in insertion order
const map = new Map<Person, string>(); // native ECMAScript Map
map.set(obj1, "obj1");
map.set(obj2, "obj2");
[...map.keys()]; // Alice Johnson, Bob Clark

// SortedMap uses Comparable.compareTo if available
const sortedMap = new SortedMap<Person, string>();
sortedMap.set(obj1, "obj1");
sortedMap.set(obj2, "obj2");
[...sortedMap.keys()]; // Bob Clark, Alice Johnson
