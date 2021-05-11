import { Worker } from "..";
import { TSError } from 'ts-node';

it("eval: typescript", () => new Promise((resolve, reject) => {
    jest.setTimeout(30000);
    const worker = new Worker(`
        import { parentPort } from "worker_threads";
        let x: number = 1;
        parentPort!.postMessage(undefined);
    `, {
        eval: "typescript",
        "ts-node": {
            typeCheck: true,
            compilerOptions: { strict: true },
        }
    });
    worker.on("error", reject);
    worker.on("message", resolve);
}));

it("eval: typescript w/errors", async () => {
    jest.setTimeout(30000);
    const p = new Promise((resolve, reject) => {
        const worker = new Worker(`
            import { parentPort } from "worker_threads";
            let x: null;
            x.y;
            parentPort!.postMessage(undefined);
        `, {
            eval: "typescript",
            "ts-node": {
                typeCheck: true,
                compilerOptions: { strict: true },
            }
        });
        worker.on("error", reject);
        worker.on("message", resolve);
    });
    await expect(p).rejects.toThrow(TSError);
});
