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

import { createDecoratorOrDecoratorFactory, MemberDescriptor, ClassDescriptor, isMethod, isAccessor, AccessorMemberDescriptor, MethodMemberDescriptor } from "@esfx/decorators-stage1-core";
import /*#__INLINE__*/ { isFunction } from "@esfx/internal-guards";

function formatClassDeprecationMessage(descriptor: ClassDescriptor, message = `This class will be removed in a future revision.`) {
    return `DEPRECATION ${descriptor.target.name}: ${message}`;
}

function formatMemberDeprecationMessage(descriptor: MemberDescriptor, message = `This member will be removed in a future revision.`) {
    const containerName = isFunction(descriptor.target) ? `${descriptor.target.name}.` : `${descriptor.target.constructor.name}#`;
    const memberName = descriptor.key.toString();
    return `DEPRECATION ${containerName}${memberName}: ${message}`;
}

function formatDeprecationMessage(descriptor: ClassDescriptor | MemberDescriptor, message?: string) {
    return descriptor.kind === "class"
        ? formatClassDeprecationMessage(descriptor, message)
        : formatMemberDeprecationMessage(descriptor, message);
}

function handleDeprecation(deprecation: { set: boolean }, descriptor: ClassDescriptor | MemberDescriptor, message?: string, error?: boolean) {
    const deprecationMessage = formatDeprecationMessage(descriptor, message);
    if (error) throw TypeError(deprecationMessage);
    if (!deprecation.set) {
        deprecation.set = true;
        if (typeof "console" !== undefined) {
            if (typeof console.warn === "function") {
                console.warn(deprecationMessage);
            }
            else if (typeof console.log === "function") {
                console.log(deprecationMessage);
            }
        }
    }
}

function obsoleteClass(descriptor: ClassDescriptor, message?: string, error?: boolean) {
    const deprecation = { set: false };
    const name = descriptor.target.name;
    return {
        [name]: class extends (descriptor.target as any) {
            constructor(...args: any[]) {
                handleDeprecation(deprecation, descriptor, message, error);
                super(...args);
            }
        }
    }[name];
}

function obsoleteAccessor(member: AccessorMemberDescriptor, message?: string, error?: boolean) {
    const deprecation = { set: false };
    if (member.descriptor.get) {
        const getter = member.descriptor.get;
        member.descriptor.get = function() {
            handleDeprecation(deprecation, member, message, error);
            return Reflect.apply(getter, this, arguments);
        };
    }
    if (member.descriptor.set) {
        const setter = member.descriptor.set;
        member.descriptor.set = function() {
            handleDeprecation(deprecation, member, message, error);
            return Reflect.apply(setter, this, arguments);
        };
    }
    return member.descriptor;
}

function obsoleteMethod(member: MethodMemberDescriptor, message?: string, error?: boolean) {
    const deprecation = { set: false };
    const method = member.descriptor.value;
    member.descriptor.value = {
        [member.key]: function () {
            handleDeprecation(deprecation, member, message, error);
            return Reflect.apply(method, this, arguments);
        }
    }[member.key as any];
    return member.descriptor;
}

function obsoleteMember(member: MemberDescriptor, message?: string, error?: boolean) {
    if (isAccessor(member)) return obsoleteAccessor(member, message, error);
    if (isMethod(member)) return obsoleteMethod(member, message, error);
    throw new TypeError(`'obsolete' is only supported on a class, method, or accessor.`);
}

function obsoleteDecorator(descriptor: ClassDescriptor, message?: string, error?: boolean): Function | void;
function obsoleteDecorator(descriptor: MemberDescriptor, message?: string, error?: boolean): void;
function obsoleteDecorator(descriptor: ClassDescriptor | MemberDescriptor, message?: string, error?: boolean): Function | PropertyDescriptor | void {
    if (descriptor.kind === "class") return obsoleteClass(descriptor, message, error);
    if (descriptor.kind === "member") return obsoleteMember(descriptor, message, error);
    throw new TypeError(`'obsolete' is only supported on a class, method, or accessor.`);
}

/**
 * Makes a member obsolete.
 */
export const obsolete = createDecoratorOrDecoratorFactory(obsoleteDecorator);
export { obsolete as deprecate };
