import { ref, Reference } from "..";

describe("ref#get", () => {
    it("ok", () => {
        const x = 1;
        const ref_x = ref(() => x);
        expect(ref_x.value).toBe(x);
    });
    it("TDZ", () => {
        const ref_x = ref(() => x);
        expect(() => ref_x.value).toThrow();
        let x: number;
        x = 1;
        expect(() => ref_x.value).not.toThrow();
    });
});
describe("ref#set", () => {
    it("ok", () => {
        let x = 1;
        const ref_x = ref(() => x, _ => x = _);
        ref_x.value = 2;
        expect(x).toBe(2);
    });
    it("TDZ", () => {
        const ref_x = ref(() => x, _ => x = _);
        expect(() => {ref_x.value = 2}).toThrow();
        let x: number;
        x = 1;
        expect(() => {ref_x.value = 2}).not.toThrow();
    });
});
it("ref.is", () => {
    const x = 1;
    const ref_x = ref(() => x);
    expect(ref.is(x)).toBe(false);
    expect(ref.is(ref_x)).toBe(true);
    expect(ref.is(ref.prototype)).toBe(false);
});
it("instanceof ref", () => {
    const x = {};
    const ref_x = ref(() => x);
    expect(x instanceof ref).toBe(false);
    expect(ref_x instanceof ref).toBe(true);
    expect(ref.prototype instanceof ref).toBe(false);
});
it("ref.for", () => {
    const ref_x = ref.for(1);
    expect(ref_x.value).toBe(1);
    ref_x.value = 2;
    expect(ref_x.value).toBe(2);
});
describe("ref.at", () => {
    it("object", () => {
        const obj = { x: 1, y: 2 };
        const ref_obj_x = ref.at(obj, "x");
        expect(ref_obj_x.value).toBe(1);
        ref_obj_x.value = 4;
        expect(obj).toEqual({ x: 4, y: 2 });
    });
    it("array", () => {
        const ar = [1, 2, 3];
        const ref_ar = ref.at(ar, 0);
        expect(ref_ar.value).toBe(1);
        ref_ar.value = 4;
        expect(ar).toEqual([4, 2, 3]);
    });
    it("object (readonly)", () => {
        const obj = { x: 1, y: 2 };
        const ref_obj_x = ref.at(obj, "x", /*readonly*/ true);
        expect(ref_obj_x.value).toBe(1);
        expect(() => ref_obj_x.value = 4).toThrow();
    });
});
describe("ref.out", () => {
    describe("write before read", () => {
        function writeBeforeRead(out_x: Reference<number>, value: number) {
            out_x.value = value;
            return out_x.value;
        }
        it("with get/set", () => {
            let x!: number;
            const out_x = ref.out(() => x, _ => x = _);
            writeBeforeRead(out_x, 2);
            expect(x).toBe(2);
        });
        it("without get/set", () => {
            const out_x = ref.out<number>();
            writeBeforeRead(out_x, 2);
            expect(out_x.value).toBe(2);
        });
    });
    describe("read before write", () => {
        function readBeforeWrite(out_x: Reference<number>, value: number) {
            let x = out_x.value;
            out_x.value = value;
            return x;
        }
        it("with get/set", () => {
            let x!: number;
            const out_x = ref.out(() => x, _ => x = _);
            expect(() => readBeforeWrite(out_x, 2)).toThrow();
        });
        it("without get/set", () => {
            const out_x = ref.out<number>();
            expect(() => readBeforeWrite(out_x, 2)).toThrow();
        });
    });
});
