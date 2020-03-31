import { matcherHint, printReceived, printExpected } from "jest-matcher-utils";
import { Sequence } from '../sequence';
import predicate from "./predicate";

const passMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.not.toEqualSequenceAsync') +
    `\n\n` +
    `Expected sequence to not equal:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

const failMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.toEqualSequenceAsync') +
    `\n\n` +
    `Expected sequence equal:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

export async function toEqualSequenceAsync<T>(received: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
    const result = await predicate(received, expected);
    return { pass: result.pass, message: (result.pass ? passMessage : failMessage)(result.received, result.expected) };
}