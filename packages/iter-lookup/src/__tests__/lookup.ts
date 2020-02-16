/// <reference types="../../../../internal/jest-sequence" />

import { Lookup } from "../";

describe("Lookup", () => {
    it("size", () => expect(new Lookup(<[string, number[]][]>[["a", [1]]]).size).toBe(1));
    it("applyResultSelector()", () => expect(Array.from(new Lookup(<[string, number[]][]>[["a", [1]]]).applyResultSelector((x, y) => [x, Array.from(y)]))).toEqual([["a", [1]]]));
    it("get empty", () => expect(new Lookup<string, string>([]).get("doesNotExist")).toEqualSequence([]));
});
