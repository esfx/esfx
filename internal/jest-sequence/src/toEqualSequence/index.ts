import { matcherHint, printReceived, printExpected } from "jest-matcher-utils";
import { Sequence } from '../sequence';
import predicate from "./predicate";

const passMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.not.toEqualSequence') +
    `\n\n` +
    `Expected sequence to not equal:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

const failMessage = (received: Sequence, expected: Sequence) => () => 
    matcherHint('.toEqualSequence') +
    `\n\n` +
    `Expected sequence equal:\n  ${printExpected(expected)}\n` +
    `Received:\n  ${printReceived(received)}`;

export function toEqualSequence<T>(received: Iterable<T>, expected: Iterable<T>) {
    const result = predicate(received, expected);
    return { pass: result.pass, message: (result.pass ? passMessage : failMessage)(result.received, result.expected) };
}