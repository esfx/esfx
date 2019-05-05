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

   THIRD PARTY LICENSE NOTICE:

   lazyinit is derived from the implementation of lazyInitialize in core-decorators.

   core-decorators is licensed under the MIT License:

   The MIT License (MIT)

   Copyright (c) 2015-2018 Jay Phelps

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/

import { MemberDescriptor, createDecoratorFactory, isField, defaultFieldAttributes } from '@esfx/decorators-stage1-core';

export const lazyinit = createDecoratorFactory((member: MemberDescriptor, initializer: () => unknown, attributes: { enumerable?: boolean, configurable?: boolean, writable?: boolean } = {}) => {
    if (!isField(member)) throw new TypeError(`'@lazyinit' is only supported on fields.`);
    const { target, key } = member;
    const { enumerable, configurable, writable } = { ...defaultFieldAttributes, ...attributes };
    const descriptor: PropertyDescriptor = {
        enumerable,
        configurable: true,
        get(this: object) {
            if (this === target) return undefined;
            const value = Reflect.apply(initializer, this, []);
            Object.defineProperty(this, key, {
                enumerable,
                configurable,
                writable,
                value
            });
            return value;
        },
        set: writable
            ? function (this: object, value: unknown) {
                Object.defineProperty(this, key, {
                    ...defaultFieldAttributes,
                    value
                });
            }
            : undefined
    };
    Object.defineProperty(target, key, descriptor);
});
