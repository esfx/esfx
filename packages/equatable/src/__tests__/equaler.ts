import { Equaler, Equatable } from "../index";

describe("defaultEqualer", () => {
    describe("hash", () => {
        it("Equatable object", () => expect(Equaler.defaultEqualer.hash({
            [Equatable.equals]() { return false; },
            [Equatable.hash]() { return 123; }
        })).toBe(123));
    });
});