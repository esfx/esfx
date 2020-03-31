import { matcherHint, printReceived, printExpected } from "jest-matcher-utils";
import { Sequence } from '../sequence';
import predicate from "./predicate";

const passMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.not.toStartWithSequenceAsync') +
    `\n\n` +
    `Expected sequence to not start with:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

const failMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.toStartWithSequenceAsync') +
    `\n\n` +
    `Expected sequence to start with:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

export async function toStartWithSequenceAsync<T>(received: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
    const result = await predicate(received, expected);
    return { pass: result.pass, message: (result.pass ? passMessage : failMessage)(result.received, result.expected) };
}