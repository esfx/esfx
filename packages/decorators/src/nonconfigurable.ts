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

import { createDecoratorOrDecoratorFactory, MemberDescriptor, isMethod, isAccessor } from "@esfx/decorators-stage1-core";

/**
 * Makes a method or accessor non-configurable.
 */
export const nonconfigurable = createDecoratorOrDecoratorFactory((member: MemberDescriptor) => {
    if (!isMethod(member) && !isAccessor(member)) throw new TypeError(`'@nonconfigurable' is only supported on methods or accessors.`);
    member.descriptor.configurable = false;
});
