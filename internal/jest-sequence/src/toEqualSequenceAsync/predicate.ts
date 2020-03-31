import { Sequence } from '../sequence';

export default async function <T>(received: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
    const receivedValues = [];
    const expectedValues = [];
    let hasMoreReceivedValues = true;
    let hasMoreExpectedValues = true;
    let sequencesAreEqual;
    let receivedIterator: AsyncIterator<T> | Iterator<PromiseLike<T> | T> | undefined =
        Symbol.asyncIterator in received ?
            (received as AsyncIterable<T>)[Symbol.asyncIterator]() :
            (received as Iterable<PromiseLike<T> | T>)[Symbol.iterator]();
    try {
        let expectedIterator: AsyncIterator<T> | Iterator<PromiseLike<T> | T> | undefined =
            Symbol.asyncIterator in expected ?
                (expected as AsyncIterable<T>)[Symbol.asyncIterator]() :
                (expected as Iterable<PromiseLike<T> | T>)[Symbol.iterator]();
        try {
            while (true) {
                const receivedResult = await receivedIterator!.next();
                const expectedResult = await expectedIterator!.next();

                if (receivedResult.done) {
                    receivedIterator = undefined;
                    hasMoreReceivedValues = false;
                }
                else {
                    receivedResult.value = await receivedResult.value;
                    receivedValues.push(receivedResult.value);
                }

                if (expectedResult.done) {
                    expectedIterator = undefined;
                    hasMoreExpectedValues = false;
                }
                else {
                    expectedResult.value = await expectedResult.value;
                    expectedValues.push(expectedResult.value);
                }

                if (!!receivedResult.done !== !!expectedResult.done || receivedResult.value !== expectedResult.value) {
                    sequencesAreEqual = false;
                    if (!receivedResult.done) {
                        if ((await receivedIterator!.next()).done) {
                            hasMoreReceivedValues = false;
                        }
                    }
                    if (!expectedResult.done) {
                        if ((await expectedIterator!.next()).done) {
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
            await expectedIterator?.return?.();
        }
    }
    finally {
        await receivedIterator?.return?.();
    }

    return {
        pass: sequencesAreEqual,
        expected: new Sequence(expectedValues, hasMoreExpectedValues),
        received: new Sequence(receivedValues, hasMoreReceivedValues),
    };
}