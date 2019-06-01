import { sleep } from "..";

it("sleep", () => {
    const start = Date.now();
    sleep(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
});