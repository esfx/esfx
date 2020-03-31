import { Sequence } from '../sequence';

export default async function <T>(received: AsyncIterable<T> | Iterable<PromiseLike<T> | T>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>) {
    const receivedValues: T[] = [];
    const expectedValues: T[] = [];
    let startsWithSequence: boolean;
    let hasMoreReceivedValues = true;
    let hasMoreExpectedValues = true;
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
            await expectedIterator?.return?.();
        }
    }
    finally {
        await receivedIterator?.return?.();
    }

    return {
        pass: startsWithSequence,
        expected: new Sequence(expectedValues, hasMoreExpectedValues),
        received: new Sequence(receivedValues, hasMoreReceivedValues),
    };
}