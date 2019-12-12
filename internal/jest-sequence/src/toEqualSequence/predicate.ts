import { Sequence } from '../sequence';

export default function <T>(received: Iterable<T>, expected: Iterable<T>) {
    const receivedValues = [];
    const expectedValues = [];
    let hasMoreReceivedValues = true;
    let hasMoreExpectedValues = true;
    let sequencesAreEqual;
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

                if (Boolean(receivedResult.done) !== Boolean(expectedResult.done) || receivedResult.value !== expectedResult.value) {
                    sequencesAreEqual = false;
                    if (!receivedResult.done) {
                        if (receivedIterator!.next().done) {
                            hasMoreReceivedValues = false;
                        }
                    }
                    if (!expectedResult.done) {
                        if (expectedIterator!.next().done) {
                            hasMoreExpectedValues = false;
                        }
                    }
                    break;
                }

                if (receivedResult.done && expectedResult.done) {
                    sequencesAreEqual = true;
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
        pass: sequencesAreEqual,
        expected: new Sequence(expectedValues, hasMoreExpectedValues),
        received: new Sequence(receivedValues, hasMoreReceivedValues),
    };
}