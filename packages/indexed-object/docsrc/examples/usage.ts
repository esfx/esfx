import { IntegerIndexedObject } from "@esfx/indexed-object";

class BooleansCollection extends IntegerIndexedObject<boolean> {
    protected getLength() {
        return 2;
    }
    protected getIndex(index: number) {
        switch (index) {
            case 0: return false;
            case 1: return true;
            default: return undefined;
        }
    }
    // hasIndex(index): boolean
    // setIndex(index, value): boolean
    // deleteIndex(index): boolean
}

const booleans = new BooleansCollection();
console.log(booleans[0]); // false
console.log(booleans[1]); // true