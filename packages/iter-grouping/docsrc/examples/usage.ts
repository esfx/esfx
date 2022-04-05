import { groupBy } from "@esfx/iter-fn";
import { Grouping } from "@esfx/iter-grouping";

const people = [{ familyName: "Smith", givenName: "Alice" }, { familyName: "Smith", givenName: "Bob" }];
for (const group of groupBy(people, person => person.familyName)) {
    group.key; // "Smith"
    group.values; // Iterable of "Alice", "Bob"
    group instanceof Grouping; // true
}
