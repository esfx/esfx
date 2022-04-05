import { HashMap } from "@esfx/collections-hashmap";
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

const obj1 = new Person("Bob", "Clark");
const obj2 = new Person("Bob", "Clark");

const set = new Map<Person, string>(); // native ECMAScript Map
set.set(obj1, "obj1");
set.set(obj2, "obj2");
set.size; // 2

const hashMap = new HashMap<Person, string>();
hashMap.set(obj1, "obj1");
hashMap.set(obj2, "obj2");
hashMap.size; // 1