import { Deferred } from "..";

describe("deferred", () => {
    it("resolve", async () => {
        const deferred = new Deferred<number>();
        deferred.resolve(1);
        const result = await deferred.promise;
        expect(result).toBe(1);
    });
    it("reject", async () => {
        const deferred = new Deferred<void>();
        deferred.reject(new Error());
        await expect(deferred.promise).rejects.toThrow();
    });
});