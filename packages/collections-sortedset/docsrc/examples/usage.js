const { SortedSet } = require("@esfx/collections-sortedset");
const { Equatable, Equaler, Comparable, Comparer } = require("@esfx/equatable");

class Person {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    toString() {
        return `${this.firstName} ${this.lastName}`;
    }

    [Equatable.equals](other) {
        return other instanceof Person
            && this.lastName === other.lastName
            && this.firstName === other.firstName;
    }

    [Equatable.hash]() {
        return Equaler.defaultEqualer.hash(this.lastName)
            ^ Equaler.defaultEqualer.hash(this.firstName);
    }

    [Comparable.compareTo](other) {
        if (!(other instanceof Person)) throw new TypeError();
        return Comparer.defaultComparer.compare(this.lastName, other.lastName)
            || Comparer.defaultComparer.compare(this.firstName, other.firstName);
    }
}

const obj1 = new Person("Alice", "Johnson");
const obj2 = new Person("Bob", "Clark");

// ECMAScript native set iterates in insertion order
const set = new Set(); // native ECMAScript Set
set.add(obj1);
set.add(obj2);
[...set]; // Alice Johnson, Bob Clark

// SortedSet uses Comparable.compareTo if available
const sortedSet = new SortedSet();
sortedSet.add(obj1);
sortedSet.add(obj2);
[...sortedSet]; // Bob Clark, Alice Johnson