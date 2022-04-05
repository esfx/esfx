// <usage>
import { AsyncLazy } from "@esfx/async-lazy";

async function main() {
    // lazy initialize an object
    const lazy1 = new AsyncLazy(() => new SomeObject());
    lazy1.isStarted; // false
    const p1 = lazy1.value; // Promise {}
    lazy1.isStarted; // true
    await p1; // SomeObject {}

    // lazy initialize with arguments
    const lazy2 = AsyncLazy.from(
        async (a, b) => (await a) + (await b),
        Promise.resolve(1),
        Promise.resolve(2));
    lazy2.isStarted; // false
    const p2 = lazy2.value; // Promise {}
    lazy2.isStarted; // true
    await p2; // 3

    // initialized "lazy"
    const lazy3 = AsyncLazy.for(Promise.resolve("test"));
    lazy3.isStarted; // true
    await lazy3.value; // "test"
}
// </usage>

main().catch(e => console.error(e));
declare class SomeObject {}