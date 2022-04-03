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

   autobind is derived from the implementation of autobind in core-decorators.

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

import { ClassDescriptor, createDecorator, createMemberDescriptor, defaultFieldAttributes, defaultMethodAttributes, isClass, isMethod, isNonStatic, MemberDescriptor, MethodMemberDescriptor } from "@esfx/decorators-stage1-core";

let mapStore: WeakMap<object, WeakMap<Function, Function>> | undefined;

function getBoundSuper(obj: object, fn: Function) {
    if (!mapStore) mapStore = new WeakMap();
    let superStore = mapStore.get(obj);
    if (!superStore) mapStore.set(obj, superStore = new WeakMap());
    let boundFn = superStore.get(fn);
    if (!boundFn) superStore.set(fn, boundFn = fn.bind(obj));
    return boundFn;
}

function autobindClass(klass: ClassDescriptor) {
    const descriptors = Object.getOwnPropertyDescriptors(klass.target.prototype);
    for (const key of Object.getOwnPropertyNames(descriptors)) {
        if (key === "constructor") continue;
        const member = createMemberDescriptor(klass.target.prototype, key, descriptors[key]);
        if (isMethod(member)) Object.defineProperty(klass.target.prototype, key, autobindMethod(member));
    }
    for (const key of Object.getOwnPropertySymbols(descriptors)) {
        const member = createMemberDescriptor(klass.target.prototype, key, descriptors[key as any]);
        if (isMethod(member)) Object.defineProperty(klass.target.prototype, key, autobindMethod(member));
    }
}

function autobindMethod({ target, target: { constructor }, key, descriptor: { value: fn, enumerable, configurable, writable } }: MethodMemberDescriptor): PropertyDescriptor {
    return {
        enumerable,
        configurable,
        get(this: object) {
            if (this === target) return fn;
            if (this.constructor !== constructor && Object.getPrototypeOf(this).constructor === constructor) return fn;
            if (this.constructor !== constructor && key in this.constructor.prototype) return getBoundSuper(this, fn);
            const boundFn = fn.bind(this);
            Object.defineProperty(this, key, {
                ...defaultMethodAttributes,
                value: boundFn
            });
            return boundFn;
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
}

function autobindDecorator(descriptor: ClassDescriptor): void;
function autobindDecorator(descriptor: MemberDescriptor): PropertyDescriptor | void;
function autobindDecorator(descriptor: ClassDescriptor | MemberDescriptor): Function | PropertyDescriptor | void {
    if (isClass(descriptor)) return autobindClass(descriptor);
    if (isMethod(descriptor) && isNonStatic(descriptor)) return autobindMethod(descriptor);
    throw new TypeError(`'@autobind' is only supported on classes and non-static methods.`);
}

export const autobind = createDecorator(autobindDecorator);