import { Equaler } from "@esfx/equatable"
import { createHashData, insertEntry } from ".."

describe("insertEntry", () => {
    it("inserts", () => {
        const hashData = createHashData(Equaler.defaultEqualer, 0);
        insertEntry(hashData, "a", 1);
    });
});