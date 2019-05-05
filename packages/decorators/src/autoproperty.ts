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

import { createDecoratorOrDecoratorFactory, MemberDescriptor, isField } from "@esfx/decorators-stage1-core";

/**
 * Converts a field declaration into an accessor with a backing property.
 */
export const autoproperty = createDecoratorOrDecoratorFactory((member: MemberDescriptor, readonly?: boolean) => {
    if (!isField(member)) throw new TypeError(`'@autoproperty' is only supported on fields.`);
    const backingField = Symbol(`__backingField<${member.key.toString()}>`);
    const descriptor: PropertyDescriptor = {
        enumerable: false,
        configurable: true,
        get(this: { [backingField]: unknown }) {
            return this[backingField];
        },
        set(this: { [backingField]: unknown }, value: unknown) {
            if (backingField in this && readonly) throw new TypeError("Property not writable.");
            this[backingField] = value;
        }
    };
    Object.defineProperty(member.target, member.key, descriptor);
});