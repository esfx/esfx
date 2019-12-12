import { Sequence } from '../sequence';

export default function <T>(received: Iterable<T>, expected: Iterable<T>) {
    const receivedValues: T[] = [];
    const expectedValues: T[] = [];
    let startsWithSequence: boolean;
    let hasMoreReceivedValues = true;
    let hasMoreExpectedValues = true;
    let receivedIterator: Iterator<T> | undefined = received[Symbol.iterator]();
    try {
        let expectedIterator: Iterator<T> | undefined = expected[Symbol.iterator]();
        try {
            while (true) {
                const receivedResult = receivedIterator!.next();
                const expectedResult = expectedIterator!.next();

                if (receivedResult.done) {
                    receivedIterator = undefined;
                    hasMoreReceivedValues = false;
                }
                else {
                    receivedValues.push(receivedResult.value);
                }

                if (expectedResult.done) {
                    expectedIterator = undefined;
                    hasMoreExpectedValues = false;
                }
                else {
                    expectedValues.push(expectedResult.value);
                }

                if (expectedResult.done) {
                    startsWithSequence = true;
                    break;
                }

                if (receivedResult.done || receivedResult.value !== expectedResult.value) {
                    startsWithSequence = false;
                    break;
                }
            }
        }
        finally {
            if (expectedIterator && typeof expectedIterator.return === "function") {
                expectedIterator.return();
            }
        }
    }
    finally {
        if (receivedIterator && typeof receivedIterator.return === "function") {
            receivedIterator.return();
        }
    }

    return {
        pass: startsWithSequence,
        expected: new Sequence(expectedValues, hasMoreExpectedValues),
        received: new Sequence(receivedValues, hasMoreReceivedValues),
    };
}