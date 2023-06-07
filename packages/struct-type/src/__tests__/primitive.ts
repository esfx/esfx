import { int32 } from "..";

describe("int32", () => {
    describe("read()", () => {
        it("native byte order", () => {
            const ar = new Int32Array(2);
            ar[0] = 0x12345678;
            ar[1] = 0x98765432 >> 0;
            expect(int32.read(ar.buffer, 0)).toBe(0x12345678);
            expect(int32.read(ar.buffer, 4)).toBe(0x98765432 >> 0);
        });
        it("big-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            view.setInt32(0, 0x12345678, false);
            view.setInt32(4, 0x98765432 >> 0, true);
            expect(int32.read(view.buffer, 0, "BE")).toBe(0x12345678);
            expect(int32.read(view.buffer, 4, "BE")).toBe(0x32547698 >> 0);
        });
        it("little-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            view.setInt32(0, 0x12345678, false);
            view.setInt32(4, 0x98765432 >> 0, true);
            expect(int32.read(view.buffer, 0, "LE")).toBe(0x78563412);
            expect(int32.read(view.buffer, 4, "LE")).toBe(0x98765432 >> 0);
        });
    });
    describe("write()", () => {
        it("native byte order", () => {
            const ar = new Int32Array(2);
            int32.write(ar.buffer, 0, 0x12345678);
            int32.write(ar.buffer, 4, 0x98765432 >> 0);
            expect(ar[0]).toBe(0x12345678);
            expect(ar[1]).toBe(0x98765432 >> 0);
        });
        it("big-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            int32.write(view.buffer, 0, 0x12345678, "BE");
            int32.write(view.buffer, 4, 0x98765432 >> 0, "BE");
            expect(view.getInt32(0, false)).toBe(0x12345678);
            expect(view.getInt32(4, true)).toBe(0x32547698 >> 0);
        });
        it("little-endian byte order", () => {
            const view = new DataView(new ArrayBuffer(8));
            int32.write(view.buffer, 0, 0x12345678, "LE");
            int32.write(view.buffer, 4, 0x98765432 >> 0, "LE");
            expect(view.getInt32(0, false)).toBe(0x78563412);
            expect(view.getInt32(4, true)).toBe(0x98765432 >> 0);
        });
    });
});