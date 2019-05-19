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

/*@internal*/
export function defineTag<T extends object>(target: T, tag: string): T & Tagged {
    Object.defineProperty(target, Symbol.toStringTag, {
        writable: false,
        enumerable: false,
        configurable: true,
        value: tag
    });
    return target as T & { [Symbol.toStringTag]: string };
}

/*@internal*/
export function Tag(tag?: string) {
    return function (target: Function) {
        const tagString = tag || target.name;
        if (!tagString) throw new Error("Invalid tag");
        defineTag(target.prototype, tagString);
    }
}

/*@internal*/
export interface Tagged {
    [Symbol.toStringTag]: string;
}