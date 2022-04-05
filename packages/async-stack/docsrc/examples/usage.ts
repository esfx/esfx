import { AsyncStack } from "@esfx/async-stack";

async function main() {
    const stack = new AsyncStack<number>();

    // push two items on the stack
    stack.push(1);
    stack.push(Promise.resolve(2));

    // take two items from the stack
    await stack.pop(); // 2
    await stack.pop(); // 1

    // take two more pending items from the stack
    const p3 = stack.pop();
    const p4 = stack.pop();

    // put two more items on the stack
    stack.push(3);
    stack.push(4);

    await p3; // 3
    await p4; // 4
}