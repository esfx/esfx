/*!
   Copyright 2021 Ron Buckton

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

let hashCode;
try {
    hashCode = await import(`@esfx/equatable-${process.platform}-${process.arch}`);
    hashCode.hashBigInt.native = true;
    hashCode.hashNumber.native = true;
    hashCode.hashString.native = true;
    hashCode.hashSymbol.native = true;
    hashCode.hashObject.native = true;
}
catch {
    hashCode = await import("../dist/esm/internal/hashCode.mjs");
}

export const {
    hashBigInt,
    hashNumber,
    hashString,
    hashSymbol,
    hashObject,
} = hashCode;