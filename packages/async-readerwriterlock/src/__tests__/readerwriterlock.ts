import { ReaderWriterLock } from "..";
import { CancelToken, CancelError } from '@esfx/async-canceltoken';

describe("read", () => {
    it("throws when token not CancelToken", async () => {
        await expect(new ReaderWriterLock().read(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws when token is canceled", async () => {
        await expect(new ReaderWriterLock().read(CancelToken.canceled)).rejects.toThrow(CancelError);
    });
    it("multiple readers", async () => {
        const steps: string[] = [];
        const rw = new ReaderWriterLock();
        async function operation1() {
            await rw.read();
            steps.push("operation1");
        }
        async function operation2() {
            await rw.read();
            steps.push("operation2");
        }
        await Promise.all([operation1(), operation2()]);
        expect(steps).toEqual(["operation1", "operation2"]);
    });
    it("waits on existing writer", async () => {
        const steps: string[] = [];
        const rw = new ReaderWriterLock();
        const writeLockPromise = rw.write();
        const readLockPromise = rw.read();
        async function writer() {
            const lock = await writeLockPromise;
            steps.push("writer");
            lock.release();
        }
        async function reader() {
            const lock = await readLockPromise;
            steps.push("reader");
            lock.release();
        }
        await Promise.all([reader(), writer()]);
        expect(steps).toEqual(["writer", "reader"]);
    });
});
describe("upgradeableRead", () => {
    it("throws when token not Cancelable", async () => {
        await expect(new ReaderWriterLock().upgradeableRead(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws when token is canceled", async () => {
        await expect(new ReaderWriterLock().upgradeableRead(CancelToken.canceled)).rejects.toThrow(CancelError);
    });
    it("can take while reading", async () => {
        const steps: string[] = [];
        const rw = new ReaderWriterLock();
        const readLockPromise1 = rw.read();
        const upgradeableReadLockPromise = rw.upgradeableRead();
        const readLockPromise2 = rw.read();
        async function reader1() {
            const lock = await readLockPromise1;
            steps.push("reader1");
            lock.release();
        }
        async function reader2() {
            const lock = await readLockPromise2;
            steps.push("reader2");
            lock.release();
        }
        async function upgradeableReader() {
            const lock = await upgradeableReadLockPromise;
            steps.push("upgradeableReader");
            lock.release();
        }

        await Promise.all([reader1(), reader2(), upgradeableReader()]);
        expect(steps).toEqual([
            "reader1",
            "reader2",
            "upgradeableReader",
        ]);
    });
    describe("upgrade", () => {
        it("throws when token not CancelToken", async () => {
            const rw = new ReaderWriterLock();
            const upgradeable = await rw.upgradeableRead();
            await expect(upgradeable.upgrade(<any>{})).rejects.toThrow(TypeError);
        });
        it("throws when token is canceled", async () => {
            const rw = new ReaderWriterLock();
            const upgradeable = await rw.upgradeableRead();
            await expect(upgradeable.upgrade(CancelToken.canceled)).rejects.toThrow(CancelError);
        });
    });
});
describe("write", () => {
    it("throws when token not CancelToken", async () => {
        await expect(new ReaderWriterLock().write(<any>{})).rejects.toThrow(TypeError);
    });
    it("throws when token is canceled", async () => {
        await expect(new ReaderWriterLock().write(CancelToken.canceled)).rejects.toThrow(CancelError);
    });
    it("waits on existing readers", async () => {
        const steps: string[] = [];
        const rw = new ReaderWriterLock();
        const readLockPromises = [rw.read(), rw.read()];
        const writeLockPromise = rw.write();
        async function reader() {
            const locks = await Promise.all(readLockPromises);
            steps.push("reader");
            locks[0].release();
            locks[1].release();
        }
        async function writer() {
            const lock = await writeLockPromise;
            steps.push("writer");
            lock.release();
        }
        await Promise.all([writer(), reader()]);
        expect(steps).toEqual(["reader", "writer"]);
    });
});