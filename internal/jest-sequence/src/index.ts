/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { toEqualSequence } from "./toEqualSequence";
import { toEqualSequenceAsync } from "./toEqualSequenceAsync";
import { toStartWithSequence } from "./toStartWithSequence";
import { toStartWithSequenceAsync } from "./toStartWithSequenceAsync";
import { IteratedType, AsyncIteratedType } from "@esfx/type-model";

expect.extend({
    toEqualSequence,
    toEqualSequenceAsync,
    toStartWithSequence,
    toStartWithSequenceAsync,
});

type Unpromise<T> = T extends PromiseLike<infer U> ? U extends PromiseLike<infer V> ? V : U : T;

declare global {
    namespace jest {
        // interface Expect {
        //     <T = any>(actual: T): Matchers2<T, T>;
        // }
        // interface Matchers2<R, V = R> extends Matchers<R, V> {
        //     resolves: Matchers2<Promise<R>, V>;
        //     rejects: Matchers2<Promise<R>, V>;
        // }
        // interface Matchers<R, V = R> {
        interface Matchers<R> {
            toEqualSequence<T>(this: Matchers<Iterable<T>>, expected: Iterable<T>): R;
            toEqualSequence<T>(this: Matchers<Promise<Iterable<T>>>, expected: Iterable<T>): R;
            toEqualSequence<T>(this: Matchers<Promise<Promise<Iterable<T>>>>, expected: Iterable<T>): R;
            // toEqualSequence(expected: Iterable<IteratedType<V>>): R;
            toStartWithSequence<T>(this: Matchers<Iterable<T>>, expected: Iterable<T>): R;
            toStartWithSequence<T>(this: Matchers<Promise<Iterable<T>>>, expected: Iterable<T>): R;
            toStartWithSequence<T>(this: Matchers<Promise<Promise<Iterable<T>>>>, expected: Iterable<T>): R;
            // toStartWithSequence(expected: Iterable<IteratedType<V>>): R;
            toEqualSequenceAsync<T>(this: Matchers<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            toEqualSequenceAsync<T>(this: Matchers<Promise<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            toEqualSequenceAsync<T>(this: Matchers<Promise<Promise<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            // toEqualSequenceAsync(expected: AsyncIterable<AsyncIteratedType<V> | IteratedType<V>> | Iterable<PromiseLike<AsyncIteratedType<V> | IteratedType<V>> | AsyncIteratedType<V> | IteratedType<V>>): R extends PromiseLike<any> ? R : Promise<V>;
            toStartWithSequenceAsync<T>(this: Matchers<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            toStartWithSequenceAsync<T>(this: Matchers<Promise<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            toStartWithSequenceAsync<T>(this: Matchers<Promise<Promise<AsyncIterable<T> | Iterable<PromiseLike<T> | T>>>>, expected: AsyncIterable<T> | Iterable<PromiseLike<T> | T>): R;
            // toStartWithSequenceAsync(expected: AsyncIterable<AsyncIteratedType<V> | IteratedType<V>> | Iterable<PromiseLike<AsyncIteratedType<V> | IteratedType<V>> | AsyncIteratedType<V> | IteratedType<V>>): R extends PromiseLike<any> ? R : Promise<V>;
        }
    }
}